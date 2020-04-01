const UUID = require('uuid/v1');
const BaseComponent = require('./component');
const Entity = require('./entity');
const QueryCache = require('./querycache');

const componentMethods = new Set(['stringify', 'clone', 'getObject', Symbol.iterator]);
class ECS {

  constructor() {

    this.ticks = 0;
    this.entities = new Map();
    this.types = {};
    this.entityComponents = new Map();
    this.components = new Map();
    this.queryCache = new Map();
    this.subscriptions = new Map();
    this.systems = new Map();
    this.refs = {};
  }

  tick() {
    this.ticks++;
    return this.ticks;
  }

  get lastick() {
	  return this.ticks;
  }

  addRef(target, entity, component, prop, sub) {
    if (!this.refs[target]) {
      this.refs[target] = new Set();
    }
    this.refs[target].add([entity, component, prop, sub].join('...'));
  }

  deleteRef(target, entity, component, prop, sub) {
    /* $lab:coverage:off$ */
    if (!this.refs[target]) return;
    /* $lab:coverage:on$ */
    this.refs[target].delete([entity, component, prop, sub].join('...'));
    if (this.refs[target].size === 0) {
      delete this.refs[target];
    }
  }

  registerComponent(name, definition = {}) {

    const klass = class Component extends BaseComponent {}
    klass.definition = definition;
    Object.defineProperty(klass, 'name', {value: name});
    this.registerComponentClass(klass);
    return klass;
  }

  registerComponentClass(klass) {

    this.types[klass.name] = klass;
    this.entityComponents.set(klass.name, new Set());
    this.components.set(klass.name, new Set());
  }

  // Change Log:
  /* Extending fouction:
   *
   * when a type of component is found, it's better to give the caller a chance
   * to triggere something for the component.
   *
   * Call this to setup the event handler.
   *
   * Currrently only xworld use this to setup post effect's flags.
   * @param {string | array} cnames component name
   * @param {function} onFound event handler
   * @return {ECS} this
   */
  componentTriggered(cnames, onFound) {
    if (Array.isArray(cnames)) {
      for (var cn of cnames)
        this.componentTriggered(cn, onFound);
    }
    else {
      if (!this.compoTriggers)
        this.compoTriggers = new Set();
      this.compoTriggers[cnames] = typeof onFound === 'stirng' ?
        eval(onFound) : onFound;
    }
    return this;
  }

  createEntity(definition) {

    if (this.compoTriggers) {
        for (const type of Object.keys(definition)) {
            if (typeof this.compoTriggers[type] === 'function')
              this.compoTriggers[type](definition);
        }
    }

    return new Entity(this, definition);
  }

  removeEntity(id) {

    let entity;
    if (id instanceof Entity) {
      entity = id;
      id = entity.id;
    } else {
      entity = this.getEntity(id);
    }
    entity.destroy();
  }

  getEntity(entityId) {

    return this.entities.get(`${entityId}`);
  }

  queryEntities(args) {
    /* e.g. args = {persist: CamCtrl, has: Array(2)}
	 has = (2) ["UserCmd", "CmdFlag"],
	 hasnt = [],
	 persist = CamCtrl {ecs: ECS, changes: Array(0), lastTick: 0},
	 updatedValues = 0, updatedComponents = 0
	 */
	// branch ANY (and IFFALL)
    const { hasnt, has, iffall, any, persist, updatedValues, updatedComponents } = Object.assign({
      hasnt: [],
      has: [],
      iffall: [],
	  any: [],
      persist: false,
      updatedValues: 0,
      updatedComponents: 0
    }, args);

    let query;
    if (persist) {
      query = this.queryCache.get(persist);
    }
    if (!query) {
	  // branch ANY
      query = new QueryCache(this, has, hasnt, any, iffall);
    }
    if (persist) {
      this.queryCache.set(persist, query);
    }
    return query.filter(updatedValues, updatedComponents);
  }

  getComponents(name) {

    return this.components.get(name);
  }

  subscribe(system, type) {

    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
    }
    this.subscriptions.get(type).add(system);
  }

  addSystem(group, system) {

    if (typeof system === 'function') {
      system = new system(this);
    }
    if (!this.systems.has(group)) {
      this.systems.set(group, new Set());
    }
    this.systems.get(group).add(system);
  }

  runSystemGroup(group) {

    const systems = this.systems.get(group);
    if (!systems) return;
    for (const system of systems) {
      let entities;
      if (this.queryCache.has(system)) {
        entities = this.queryCache.get(system).filter();
      }
      system.update(this.ticks, entities ? entities : []);
      system.lastTick = this.ticks;
      if (system.changes.length !== 0) {
        system.changes = [];
      }
    }
  }

  _clearEntityFromCache(entity) {

    for (const query of this.queryCache) {
      query[1].clearEntity(entity);
    }

  }

  _updateCache(entity) {
    // e.g. this.queryCache = Map(2) {D3Pie => QueryCache, XSankey => QueryCache}
    for (const query of this.queryCache) {
      query[1].updateEntity(entity); // e.g. query = [D3Pie, QueryCache]
    }
  }

  _sendChange(component, op, key, old, value) {

    if (!component._ready) return;
    component.updated = component.entity.updatedValues = this.ticks;
    const systems = this.subscriptions.get(component.type);
    if (systems) {
      const change = { component, op, key, old, value };
      for (const system of systems) {
        system._sendChange(change);
      }
    }
  }

}

module.exports = ECS;

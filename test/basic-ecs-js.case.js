/**Test case of packages/ecs-js with mocha and chai.
 * Original Author: fritzy@github
 * Original source @ github:
 * https://github.com/fritzy/ecs-js/blob/master/tests/index.js
 *
 * @namespace xv.test.ecs */

import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as ECS from '../packages/ecs-js/index';

// lab.experiment('express components', () => {
describe('case: [ecs]express components', () => {

  const ecs = new ECS.ECS();
  ecs.registerComponent('Health', {
    properties: {
      max: 25,
      hp: 25,
      armor: 0
    }
  });

  // lab.test('create entity', () => {
  // it('creating 1 entity definition', function() {
  it('create entity', () => {
    ecs.createEntity({
      Health: [ { hp: 10 } ]
    });
    const results = ecs.queryEntities({ has: ['Health'] });
    expect(results.size).to.equal(1);
    assert.equal(results.size, 1);
  });

  // lab.test('create entity without array', () => {
  it('create entity without array', () => {
    ecs.createEntity({
      Health: { hp: 10 }
    });

    const results = ecs.queryEntities({ has: ['Health'] });

    // expect(results.size).to.equal(2);
    assert.equal(results.size, 2);
  });

  // lab.test('entity refs', () => {
  it('entity refs', () => {
    ecs.registerComponent('Storage', {
      properties: {
        name: 'inventory',
        size: 20,
        items: '<EntitySet>'
      },
      multiset: true,
      mapBy: 'name'
    });

    ecs.registerComponent('EquipmentSlot', {
      properties: {
        name: 'finger',
        slot: '<Entity>',
        effects: '<ComponentSet>'
      },
      multiset: true,
      mapBy: 'name'
    });

    ecs.registerComponent('Food', {
      properties: {
        rot: 300,
        restore: 2
      },
    });

    const food = ecs.createEntity({
      id: 'sandwich10', // to exersize custom id
      Food: {}
    });

    const entity = ecs.createEntity({
      Storage: {
        pockets: { size: 4 },
        backpack: { size: 25 }
      },
      EquipmentSlot: {
        pants: {},
        shirt: {}
      },
      Health: {
        hp: 10,
        max: 10
      }
    });

    entity.components.Storage.pockets.items.add(food);

    const entityObj = entity.getObject();
    delete entityObj.id;
    const eJson = JSON.stringify(entityObj);
    const entityDef = JSON.parse(eJson);

    const entity2 = ecs.createEntity(entityDef);

    // expect(entity.components.Storage.pockets.items.has(food)).to.be.true();
    expect(entity.components.Storage.pockets.items.has(food)).equal(true);
    // expect(entity2.components.Storage.pockets.items.has(food)).to.be.true();
    expect(entity2.components.Storage.pockets.items.has(food)).equal(true);

    ecs.removeEntity(food);

    // expect(ecs.getEntity(food.id)).to.be.undefined();
    expect(ecs.getEntity(food.id)).equal(undefined);
    ecs.removeEntity(entity.id);

    // expect(ecs.getEntity(entity.id)).to.be.undefined();
    expect(ecs.getEntity(entity.id)).equal(undefined);

  });

  // lab.test('system subscriptions', () => {
  it('system subscriptions', () => {
    let changes = [];
    let changes2 = [];
    let effectExt = null;
    /* $lab:coverage:off$ */
    class System extends ECS.System {
      constructor(ecs) {
        super(ecs);
        //this.ecs.subscribe(this, 'EquipmentSlot');
      }

      update(tick) {

        changes = this.changes;
        for (const change of this.changes) {
          const parent = change.component.entity;
          if (change.component.type === 'EquipmentSlot'
                && change.op === 'setEntity') {
            if (change.value !== null) {
              const value = this.ecs.getEntity(change.value);
              if (value.hasOwnProperty('Wearable')) {
                const components = [];
                for (const ctype of Object.keys(value.Wearable.effects)) {
                  const component = parent.addComponent(ctype, value.Wearable.effects[ctype]);
                  components.push(component);
                }
                if (components.length > 0) {
                  const effect = parent.addComponent('EquipmentEffect', { equipment: value.id });
                  for (const c of components) {
                    effect.effects.add(c);
                    effectExt = c;
                  }
                }
              }
            } else if (change.old !== null && change.value !== change.old) {
              for (const effect of parent.EquipmentEffect) {
                if (effect.equipment === change.old) {
                  for (const comp of effect.effects) {
                    parent.removeComponent(comp);
                  }
                  parent.removeComponent(effect);
                }
              }
            }
          }
        }
      }
    }
    System.subscriptions = ['EquipmentSlot'];

    class System2 extends ECS.System {

      constructor(ecs) {

        super(ecs);
        this.ecs.subscribe(this, 'EquipmentSlot');
      }

      update(tick) {

        if (this.changes.length > 0) {
          //make sure it is a separate object
          this.changes[0] = null;
        }
        changes2 = this.changes;
      }
    }
    /* $lab:coverage:on */

    ecs.registerComponent('EquipmentEffect', {
      properties: {
        equipment: '',
        effects: '<ComponentSet>'
      },
      multiset: true
    });

    ecs.registerComponent('Wearable', {
      properties: {
        name: 'ring',
        effects: {
          Burning: {}
        }
      },
    });

    ecs.registerComponent('Burning', {
      properties: {
      },
    });

    const system = new System(ecs);
    //const system2 = new System2(ecs);

    ecs.addSystem('equipment', system);
    ecs.addSystem('equipment', System2);

    ecs.runSystemGroup('equipment');

    const entity = ecs.createEntity({
      Storage: {
        pockets: { size: 4 },
        backpack: { size: 25 }
      },
      EquipmentSlot: {
        pants: {},
        shirt: {}
      },
      Health: {
        hp: 10,
        max: 10
      }
    });

    const pants = ecs.createEntity({
      Wearable: { name: 'Nice Pants',
        effects: {
          Burning: {}
        }
      }
    });

    ecs.runSystemGroup('equipment');
    expect(changes.length).to.equal(0);

    entity.EquipmentSlot.pants.slot = pants;

    ecs.runSystemGroup('equipment');

    // expect(entity.EquipmentEffect).to.exist();
    assert.isOk(entity.EquipmentEffect);
    // expect([...entity.EquipmentEffect][0].effects.has(effectExt)).to.be.true();
    expect([...entity.EquipmentEffect][0].effects.has(effectExt)).equal(true);
    // expect([...entity.EquipmentEffect][0].effects.has(effectExt.id)).to.be.true();
    expect([...entity.EquipmentEffect][0].effects.has(effectExt.id)).equal(true);

    // expect(entity.Burning).to.exist();
    assert.isOk(entity.Burning);
    expect(changes.length).to.equal(1);
    expect(changes[0].op).to.equal('setEntity');
    expect(changes[0].value).to.equal(pants.id);
    expect(changes[0].old).to.equal(null);

    //entity.EquipmentSlot.pants.slot = null;
    pants.destroy();
    ecs.runSystemGroup('equipment');

    ecs.runSystemGroup('asdf'); //code path for non-existant system

    expect(changes2.length).to.be.greaterThan(0);
    // expect(changes2[0]).to.be.null();
    expect(changes2[0]).to.be.null;
    expect(changes.length).to.be.greaterThan(0);
    // expect(changes[0].value).to.be.null();
    expect(changes[0].value).to.be.null;
    // expect(entity.EquipmentEffect).to.not.exist();
    expect(entity.EquipmentEffect).equal(undefined);
    // expect(entity.Burning).to.not.exist();
    expect(entity.Burning).equal(undefined);
  });

  // lab.test('component pointers', () => {
  it('component pointers', () => {
    const ecs = new ECS.ECS();
    ecs.registerComponent('Position', {
      properties: {
        x: '<Pointer container.position.x>',
        y: '<Pointer container.position.y>',
        container: null
      }
    });

    const entity1 = ecs.createEntity({
      Position: {
        x: 10,
        y: 12
      }
    });

    // expect(entity1.Position.x).to.be.equal(10);
    expect(entity1.Position.x).equal(10);
    // expect(entity1.Position.y).to.be.equal(12);
    expect(entity1.Position.y).equal(12);

    entity1.Position.container = { position: { x: 33, y: 1 } };

    // expect(entity1.Position.x).to.be.equal(33);
    expect(entity1.Position.x).equal(33);
    // expect(entity1.Position.y).to.be.equal(1);
    expect(entity1.Position.y).equal(1);

    entity1.Position.x = 21;
    entity1.Position.y = 34;

    // expect(entity1.Position.x).to.be.equal(21);
    // expect(entity1.Position.y).to.be.equal(34);
    // expect(entity1.Position.container.position.x).to.be.equal(21);
    // expect(entity1.Position.container.position.y).to.be.equal(34);
    expect(entity1.Position.x).equal(21);
    expect(entity1.Position.y).equal(34);
    expect(entity1.Position.container.position.x).equal(21);
    expect(entity1.Position.container.position.y).equal(34);
  });
});

// lab.experiment('component inheritance', () => {
describe('case: [ecs]component inheritance', () => {
  const ecs = new ECS.ECS();

  // lab.test('register component class', () => {
  it('register component class', () => {
    class Component1 extends ECS.Component {
    }
    Component1.definition = {};
    ecs.registerComponentClass(Component1);

    const entity = ecs.createEntity({
      Component1: {}
    });

    // expect(entity.Component1).to.exist()
    expect(entity.Component1).exist;
  });

  // lab.test('override core properties', { plan: 1 }, (flags) => {
  it('override core properties', (done) => {
    class Component3 extends ECS.Component {
    }
    Component3.definition = {};

    ecs.registerComponentClass(Component3);
    class Component4 extends Component3 {}
    Component4.definition = {
      properties: {
        id: 'hi',
        entity: 'whatever'
      }
    };

    ecs.registerComponentClass(Component4);

    try {
      ecs.createEntity({
        Component4: {}
      });
    } catch (err) {
      // expect(err).to.be.an.error();
      expect(err).to.be.an('error');
	  done();
    }
  });

  // lab.test('override inherited properties', () => {
  it('override inherited properties', () => {
    class Component6 extends ECS.Component {
    }
    Component6.definition = {
      properties: {
        greeting: 'hi'
      }
    };

    class Component7 extends Component6 {
    }
    Component7.definition = {
      properties: {
        greeting: 'hello'
      }
    };

    ecs.registerComponentClass(Component7);

    const entity = ecs.createEntity({
      Component7: {}
    });

    expect(entity.Component7.greeting).equal('hello');

  });
});

// lab.experiment('system queries', () => {
describe('case: [ecs]system queries', () => {

  const ecs = new ECS.ECS();

  // lab.test('add and remove forbidden component', () => {
  it('add and remove forbidden component', () => {
    ecs.registerComponent('Tile', {
      properties: {
        x: 0,
        y: 0,
        level: 0
      }
    });

    ecs.registerComponent('Hidden', {
      properties: {}
    });

    class TileSystem extends ECS.System {

      constructor(ecs) {
        super(ecs);
        this.lastResults =[];
      }

      update(tick, entities) {
        this.lastResults = entities;
      }
    }
    TileSystem.query = {
      has: ['Tile'],
      hasnt: ['Hidden']
    };

    const tileSystem = new TileSystem(ecs);
    ecs.addSystem('map', tileSystem);

    ecs.runSystemGroup('map');

    // expect(tileSystem.lastResults.size).to.equal(0);
    expect(tileSystem.lastResults.size).equal(0);

    const tile1 = ecs.createEntity({
      Tile: {
        x: 10,
        y: 0,
        level: 0
      }
    });

    const tile2 = ecs.createEntity({
      Tile: {
        x: 11,
        y: 0,
        level: 0
      },
      Hidden: {}
    });

    ecs.runSystemGroup('map');

    // expect(tileSystem.lastResults.size).to.equal(1);
    expect(tileSystem.lastResults.size).equal(1);
    // expect(tileSystem.lastResults.has(tile1)).to.be.true();
    expect(tileSystem.lastResults.has(tile1)).true;

    tile2.removeComponent(tile2.Hidden);

    ecs.runSystemGroup('map');

    // expect(tileSystem.lastResults.size).to.equal(2);
    expect(tileSystem.lastResults.size).equal(2);
    // expect(tileSystem.lastResults.has(tile1)).to.be.true();
    expect(tileSystem.lastResults.has(tile1)).true;
    // expect(tileSystem.lastResults.has(tile1)).to.be.true();
    expect(tileSystem.lastResults.has(tile1)).true;

    tile1.addComponent('Hidden', {});

    ecs.runSystemGroup('map');

    // expect(tileSystem.lastResults.size).to.equal(1);
    expect(tileSystem.lastResults.size).equal(1);
    // expect(tileSystem.lastResults.has(tile2)).to.be.true();
    expect(tileSystem.lastResults.has(tile2)).true;
  });

  // lab.test('multiple has and hasnt', () => {
  it('multiple has and hasnt', () => {
    ecs.registerComponent('Billboard', {});
    ecs.registerComponent('Sprite', {});

    const tile1 = ecs.createEntity({
      Tile: {},
      Billboard: {},
      Sprite: {},
      Hidden: {}
    });

    const tile2 = ecs.createEntity({
      Tile: {},
      Billboard: {},
    });

    const tile3 = ecs.createEntity({
      Tile: {},
      Billboard: {},
      Sprite: {}
    });

    const tile4 = ecs.createEntity({
      Tile: {},
    });

    const tile5 = ecs.createEntity({
      Billboard: {},
    });

    const result = ecs.queryEntities({
      has: ['Tile', 'Billboard'],
      hasnt: ['Sprite', 'Hidden']
    });

    const resultSet = new Set([...result]);

    expect(resultSet.has(tile1)).false;
    expect(resultSet.has(tile2)).true;
    expect(resultSet.has(tile3)).false;
    expect(resultSet.has(tile4)).false;
    expect(resultSet.has(tile5)).false;
  });

  // odys-z@github.com Jan 17, 2020
  // test iffall
  it('multiple any / iffall', () => {
    ecs.registerComponent('Visual', {});
    ecs.registerComponent('Obj3', {});
    ecs.registerComponent('Unknown1', {});
    ecs.registerComponent('Unknown2', {});
    ecs.registerComponent('Unknown3', {});

    const obj1 = ecs.createEntity({
      id: 'obj1',
      Visual: {},
      Obj3: {},
      Unknown1: {},
      Unknown2: {}
    });

    const obj2 = ecs.createEntity({
      id: 'obj2',
      Visual: {},
      Obj3: {},
      Unknown2: {},
      Unknown3: {}
    });

    const exc1 = ecs.createEntity({
      id: 'exc1',
      Visual: {}
    });

	// iff 'Visual', 'Obj3'
    var result = ecs.queryEntities({
      // has: ['Visual'],
      iffall: ['Visual', 'Obj3']
    });

    var resultSet = new Set([...result]);

	expect(resultSet.size).equal(2);
    expect(resultSet.has(obj1)).true;
    expect(resultSet.has(obj2)).true;
    expect(resultSet.has(exc1)).false;

    var result = ecs.queryEntities({
      has: ['Visual'],
      iffall: ['Visual', 'Obj3']
    });

    var resultSet = new Set([...result]);

	expect(resultSet.size).equal(3);
    expect(resultSet.has(obj1)).true;
    expect(resultSet.has(obj2)).true;
    expect(resultSet.has(exc1)).true;

	// any 'Visual'
    result = ecs.queryEntities({
      any: ['Visual'],
      iffall: ['Visual', 'Obj3']
    });
    resultSet = new Set([...result]);

	expect(resultSet.size).equal(3);
    expect(resultSet.has(obj1)).true;
    expect(resultSet.has(obj2)).true;
    expect(resultSet.has(exc1)).true;
  });

  // lab.test('filter by updatedValues', () => {
  it('filter by updatedValues', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('Comp1', {
      properties: {
        greeting: 'hi'
      }
    });

    ecs.tick();

    const entity1 = ecs.createEntity({
      Comp1: {}
    });

    const entity2 = ecs.createEntity({
      Comp1: {
        greeting: 'hullo'
      }
    });

    ecs.tick();
    const ticks = ecs.ticks;
    const results1 = new Set(ecs.queryEntities({ has: ['Comp1'], persist: 'test' }));
    // expect(results1.has(entity1)).to.be.true();
    // expect(results1.has(entity2)).to.be.true();
    expect(results1.has(entity1)).true;
    expect(results1.has(entity2)).true;

    entity1.Comp1.greeting = 'Gutten Tag';

    const results2 = new Set(ecs.queryEntities({ persist: 'test', updatedValues: ticks }));
    expect(results2.has(entity1)).true;
    expect(results2.has(entity2)).false;
  });

  // lab.test('filter by updatedComponents', () => {
  it('filter by updatedComponents', () => {
    const ecs = new ECS.ECS();
    ecs.registerComponent('Comp1', {
      properties: {
        greeting: 'hi'
      }
    });
    ecs.registerComponent('Comp2', {});

    ecs.tick();

    const entity1 = ecs.createEntity({
      Comp1: {}
    });

    const entity2 = ecs.createEntity({
      Comp1: {
        greeting: 'hullo'
      }
    });

    ecs.tick();
    const ticks = ecs.ticks;
    const results1 = new Set(ecs.queryEntities({ has: ['Comp1'], persist: 'test' }));
    // expect(results1.has(entity1)).to.be.true();
    // expect(results1.has(entity2)).to.be.true();
    expect(results1.has(entity1)).true;
    expect(results1.has(entity2)).true;

    entity1.Comp1.greeting = 'Gutten Tag';
    entity2.addComponent('Comp2', {});

    const results2 = new Set(ecs.queryEntities({ persist: 'test', updatedComponents: ticks }));
    // expect(results2.has(entity1)).to.be.false();
    // expect(results2.has(entity2)).to.be.true();
    expect(results2.has(entity1)).false;
    expect(results2.has(entity2)).true;
  });

  // lab.test('destroyed entity should be cleared', () => {
  it('destroyed entity should be cleared', () => {
    const ecs = new ECS.ECS();
    ecs.registerComponent('Comp1', {});

    const entity1 = ecs.createEntity({
      Comp1: {}
    });

    const results1 = new Set(ecs.queryEntities({ has: ['Comp1'], persist: 'test' }));
    // expect(results1.has(entity1)).to.be.true();
    expect(results1.has(entity1)).true;

    entity1.destroy();

    const results2 = new Set(ecs.queryEntities({ persist: 'test' }));
    // expect(results2.has(entity1)).to.be.false();
    expect(results2.has(entity1)).false;
  });
});

// lab.experiment('entity & component refs', () => {
describe('case: [ecs]entity & component refs', () => {
  const ecs = new ECS.ECS();

  // lab.test('Enitity Object', {}, () => {
  it('Enitity Object', () => {
    ecs.registerComponent('BeltSlots', {
      properties: {
        slots: '<EntityObject>',
      }
    });
    ecs.registerComponent('Potion', {});

    const belt = ecs.createEntity({
      BeltSlots: {}
    });

    const slots = ['a', 'b', 'c'];
    const potions = [];
    for (const slot of slots) {
      const potion = ecs.createEntity({
        Potion: {}
      });
      belt.BeltSlots.slots[slot] = potion;
      potions.push(potion);
    }

    const potionf = ecs.createEntity({
      Potion: {}
    });

    // expect(belt.BeltSlots.slots[Symbol.iterator]).to.not.exist();
    // expect(belt.BeltSlots.slots.a).to.equal(potions[0]);
    // expect(belt.BeltSlots.slots.b).to.equal(potions[1]);
    // expect(belt.BeltSlots.slots.c).to.equal(potions[2]);
    expect(belt.BeltSlots.slots[Symbol.iterator]).not.to.exist;
    expect(belt.BeltSlots.slots.a).equal(potions[0]);
    expect(belt.BeltSlots.slots.b).equal(potions[1]);
    expect(belt.BeltSlots.slots.c).equal(potions[2]);

    potions[1].destroy();
    // expect(belt.BeltSlots.slots.b).to.equal(null);
    expect(belt.BeltSlots.slots.b).equal(null);

	// deleteProperty Error, why?
    // delete belt.BeltSlots.slots.c;
    // expect(belt.BeltSlots.slots.c).not.to.exist;

    //assign again
    belt.BeltSlots.slots.a = potions[0];

    //asign by id
    belt.BeltSlots.slots.a = potionf.id;
    expect(belt.BeltSlots.slots.a).equal(potionf);

	// deleteProperty Error, why?
    // delete belt.BeltSlots.slots.d
  });

  // lab.test('Entity Array', {}, () => {
  it('Entity Array', () => {

    ecs.registerComponent('BeltSlots2', {
      properties: {
        slots: '<EntitySet>',
      }
    });

    const belt = ecs.createEntity({
      BeltSlots2: {}
    });

    const slots = ['a', 'b', 'c'];
    const potions = [];
    for (const slot of slots) {
      const potion = ecs.createEntity({
        Potion: {}
      });
      belt.BeltSlots2.slots.add(potion);
      potions.push(potion);
    }

    expect(belt.BeltSlots2.slots[Symbol.iterator]).exist;

    expect(belt.BeltSlots2.slots.has(potions[0])).true;
    expect(belt.BeltSlots2.slots.has(potions[1])).true;
    expect(belt.BeltSlots2.slots.has(potions[2])).true;
  });

  // lab.test('Component Object', {}, () => {
  it('Component Object', () => {

    ecs.registerComponent('Crying', {});
    ecs.registerComponent('Angry', {});

    ecs.registerComponent('ExpireObject', {
      properties: {
        comps: '<ComponentObject>'
      }
    });

    const cryer = ecs.createEntity({
      Crying: {},
      Angry: {}
    });
    cryer.addComponent('ExpireObject', {});
    cryer.ExpireObject.comps.a = cryer.Crying;
    cryer.ExpireObject.comps.b = cryer.Angry.id;

    expect(cryer.ExpireObject.comps[Symbol.iterator]).not.to.exist;
    expect(cryer.ExpireObject.comps.a).equal(cryer.Crying);
    expect(cryer.ExpireObject.comps.b).equal(cryer.Angry);

	// deleteProperty Error, why?
    // delete cryer.ExpireObject.comps.b;
    // expect(cryer.ExpireObject.comps.b).not.to.exist;
    // delete cryer.ExpireObject.comps.c;
  });

  // lab.test('Assign entity ref by id', () => {
  it('Assign entity ref by id', () => {

    ecs.registerComponent('Ref', {
      properties: {
        other: '<Entity>'
      }
    });

    const entity = ecs.createEntity({
      Crying: {}
    });

    const entity2 = ecs.createEntity({
      Ref: { other: entity.id }
    });

    expect(entity2.Ref.other).equal(entity);
  });

  // lab.test('Reassign same entity ref', () => {
  it('Reassign same entity ref', () => {

    const entity = ecs.createEntity({
      Crying: {}
    });

    const entity2 = ecs.createEntity({
      Ref: { other: entity.id }
    });

    entity2.Ref.other = entity;

    expect(entity2.Ref.other).equal(entity);
  });

  // lab.test('Plain Component ref', () => {
  it('Plain Component ref', () => {
    ecs.registerComponent('Mate', {
      properties: {
        other: '<Component>'
      }
    });

    const entity = ecs.createEntity({
      Crying: {},
      Mate: {}
    });

    entity.Mate.other = entity.Crying;

    expect(entity.Mate.other).equal(entity.Crying);
  });

  // lab.test('Plain Component ref by id', () => {
  it('Plain Component ref by id', () => {

    ecs.registerComponent('Mate', {
      properties: {
        other: '<Component>'
      }
    });

    const entity = ecs.createEntity({
      Crying: {},
      Mate: {}
    });

    entity.Mate.other = entity.Crying.id;

    expect(entity.Mate.other).equal(entity.Crying);
  });

  // lab.test('ComponentSet refs', () => {
  it('ComponentSet refs', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('IDontKnow', {
      properties: {
        stuff: '<ComponentSet>'
      }
    });
    ecs.registerComponent('Shit', {});
    ecs.registerComponent('Crap', {});

    const entity = ecs.createEntity({
      IDontKnow: {},
      Shit: {},
      Crap: {}
    });

    entity.IDontKnow.stuff.add(entity.Shit);
    entity.IDontKnow.stuff.add(entity.Crap.id);

    expect(entity.IDontKnow.stuff.has(entity.Shit)).true;
    expect(entity.IDontKnow.stuff.has(entity.Crap)).true;

    entity.IDontKnow.stuff.delete(entity.Shit.id);
    expect(entity.IDontKnow.stuff.has(entity.Shit)).false;
    expect(entity.IDontKnow.stuff.has(entity.Crap)).true;

    entity.IDontKnow.stuff.clear();
    expect(entity.IDontKnow.stuff.has(entity.Crap)).false;
    expect(entity.IDontKnow.stuff.has(entity.Shit)).false;
  });

});

// lab.experiment('entity restore', () => {
describe('caes: [ecs]entity restore', () => {

  // lab.test('restore maped object', {}, () => {
  it('restore maped object', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('Potion');
    ecs.registerComponent('EquipmentSlot', {
      properties: {
        name: 'finger',
        slot: '<Entity>'
      },
      multiset: true,
      mapBy: 'name'
    });


    const potion1 = ecs.createEntity({
      Potion: {}
    });
    const potion2 = ecs.createEntity({
      Potion: {}
    });

    const entity = ecs.createEntity({
      EquipmentSlot: {
        'main': { slot: potion1 },
        'secondary': { slot: potion2 }
      }
    });

    // expect(entity.EquipmentSlot.main.slot).to.equal(potion1);
    // expect(entity.EquipmentSlot.secondary.slot).to.equal(potion2);
    // expect(potion1).to.not.equal(potion2);
    expect(entity.EquipmentSlot.main.slot).equal(potion1);
    expect(entity.EquipmentSlot.secondary.slot).equal(potion2);
    expect(potion1).not.equal(potion2);
  });

  // lab.test('restore unmapped object', {}, () => {
  it('restore unmapped object', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('Potion');
    ecs.registerComponent('EquipmentSlot', {
      properties: {
        name: 'finger',
        slot: '<Entity>'
      },
      multiset: true
    });


    const potion1 = ecs.createEntity({
      Potion: {}
    });
    const potion2 = ecs.createEntity({
      Potion: {}
    });
    const potion3 = ecs.createEntity({
      Potion: {}
    });

    const entity = ecs.createEntity({
      EquipmentSlot: [
        { name: 'slot1', slot: potion1 },
        { name: 'slot2', slot: potion2 }
      ]
    });
    entity.addComponent('EquipmentSlot', {
      name: 'slot3',
      slot: potion3
    });

    const slots = [...entity.EquipmentSlot]

    expect(slots[0].slot).equal(potion1);
    expect(slots[0].name).equal('slot1');
    expect(slots[1].slot).equal(potion2);
    expect(slots[1].name).equal('slot2');
    expect(slots[2].slot).equal(potion3);
    expect(slots[2].name).equal('slot3');
  });

  // lab.test('2nd component on non-multiset component throws', { plan: 1 }, () => {
  it('2nd component on non-multiset component throws', (done) => {
    const ecs = new ECS.ECS();
    ecs.registerComponent('Potion');

    const entity = ecs.createEntity({
      Potion: {}
    });

    try {
      entity.addComponent('Potion', {});
    } catch (err) {
      expect(err).to.be.an('error');
	  done();
    }
  });

  // lab.test('Unregistered component throws', { plan: 1 }, () => {
  it('Unregistered component throws', (done) => {
    const ecs = new ECS.ECS();
    ecs.registerComponent('Potion');

    let entity;
    try {
      entity = ecs.createEntity({
        Posion: {} //misspelled
      });
    } catch (err) {
      expect(err).to.be.an('error');
	  done();
    }
  });

  // lab.test('removeComponentByType single', () => {
  it('removeComponentByType single', () => {
    const ecs = new ECS.ECS();
    ecs.registerComponent('NPC');
    ecs.registerComponent('Cat');

    const entity = ecs.createEntity({
      NPC: {},
      Cat: {}
    });

    expect(entity.Cat).exist;

    entity.removeComponentByType('Cat');
    expect(entity.Cat).not.to.exist;

    entity.removeComponentByType('Cat');
    expect(entity.Cat).not.to.exist;

  });

  // lab.test('removeComponentByName multiset', () => {
  it('removeComponentByName multiset', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('NPC');
    ecs.registerComponent('Other', {
      multiset: true
    });
    ecs.registerComponent('Armor', {
      properties: { 'amount': 5 },
      multiset: true
    });

    const entity = ecs.createEntity({
      NPC: {},
      Armor: [{ amount: 10 }, { amount: 30 }]
    });
    const entity2 = ecs.createEntity({
      Other: [{}],
    });

    expect(entity.NPC).exist;
    expect(entity.Armor).exist;
    expect(entity.Armor.size).equal(2);
    expect([...entity.Armor][0].amount).equal(10);
    expect([...entity.Armor][1].amount).equal(30);

    entity.removeComponentByType('Armor');
    expect(entity.Armor).not.to.exist;

    entity.removeComponent([...entity2.Other][0]);
  });

  // lab.test('remove mapped by id', () => {
  it('remove mapped by id', () => {
    const ecs = new ECS.ECS();
    ecs.registerComponent('NPC');

    const entity = ecs.createEntity({
      NPC: {}
    });
    const id = entity.NPC.id;
    entity.removeComponent(id);

    expect(entity.NPC).not.to.exist;
  });

  // lab.test('remove mapped component', () => {
  it('remove mapped component', () => {
    const ecs = new ECS.ECS();
    ecs.registerComponent('AI', {
      properties: {
        order: 'sun'
      },
      multiset: true,
      mapBy: 'order'
    });
    ecs.registerComponent('EquipmentSlot', {
      properties: {
        name: 'mainhand',
        slot: '<Entity>'
      },
      multiset: true,
      mapBy: 'name'
    });

    const entity = ecs.createEntity({
      EquipmentSlot: {
        righthand: {},
        lefthand: {}
      }
    });

    const entity2 = ecs.createEntity({
      AI: {
        sun: {},
        moon: {}
      },
      EquipmentSlot: {
        righthand: {},
        lefthand: {}
      }
    });

    expect(entity.EquipmentSlot.righthand).exist;
    expect(entity.EquipmentSlot.righthand.name).equal('righthand');
    expect(entity.EquipmentSlot.lefthand.name).equal('lefthand');

    entity.removeComponent(entity.EquipmentSlot.righthand);

    expect(entity.EquipmentSlot.righthand).not.to.exist;

    entity.removeComponent(entity2.EquipmentSlot.lefthand);

    expect(entity.EquipmentSlot.lefthand).exist;
    expect(entity2.EquipmentSlot.righthand).exist;

    entity.removeComponent(entity2.EquipmentSlot.righthand);

    expect(entity.EquipmentSlot.righthand).not.to.exist;
    expect(entity2.EquipmentSlot.righthand).exist;

    entity.removeComponent(entity2.AI.sun);

    expect(entity.EquipmentSlot.lefthand).exist;
    expect(entity2.AI.sun).exist;

    entity.removeComponent(entity.EquipmentSlot.lefthand);

    expect(entity.EquipmentSlot).not.to.exist;
  });

  // lab.test('EntitySet', () => {
  it('EntitySet', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('SetInventory', {
      properties: {
        slots: '<EntitySet>'
      }
    })
    ecs.registerComponent('Bottle', {
     properties: {
      }
    })

    const container = ecs.createEntity({
      SetInventory: {},
    });

    const bottle1 = ecs.createEntity({
      Bottle: {}
    });
    const bottle2 = ecs.createEntity({
      Bottle: {}
    });
    const bottle3 = ecs.createEntity({
      Bottle: {}
    });

    container.SetInventory.slots.add(bottle1);
    container.SetInventory.slots.add(bottle2);

    expect(container.SetInventory.slots.has(bottle1.id)).true;
    expect(container.SetInventory.slots.has(bottle2)).true;
    expect(container.SetInventory.slots.has(bottle3)).false;

    const def = container.getObject();
    const defS = JSON.stringify(def);
    const def2 = JSON.parse(defS);
    delete def2.id;

    const container2 = ecs.createEntity(def2);
    expect(container2.SetInventory.slots.has(bottle1)).true;
    expect(container2.SetInventory.slots.has(bottle2)).true;
    expect(container2.SetInventory.slots.has(bottle3)).false;

    let idx = 0;
    for (const entity of container2.SetInventory.slots) {
      if (idx === 0) {
        expect(entity).equal(bottle1);
      } else if (idx === 1) {
        expect(entity).equal(bottle2);
      }
      idx++;
    }
    expect(idx).equal(2);

    expect(container2.SetInventory.slots.has(bottle1)).true;
    bottle1.destroy();
    expect(container2.SetInventory.slots.has(bottle1)).false;
    expect(container2.SetInventory.slots.has(bottle2)).true;
    container2.SetInventory.slots.delete(bottle2.id);
    expect(container2.SetInventory.slots.has(bottle2)).false;

    expect(container.SetInventory.slots.has(bottle1)).false;
    expect(container.SetInventory.slots.has(bottle2)).true;

    container.SetInventory.slots.clear()
    expect(container.SetInventory.slots.has(bottle2)).false;

  });
});

// lab.experiment('exporting and restoring', () => {
describe('case: [ecs]exporting and restoring', () => {

  // lab.test('get object and stringify component', () => {
  it('get object and stringify component', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('AI', {
      properties: {
        order: 'sun'
      },
      multiset: true,
      mapBy: 'order'
    });

    const entity = ecs.createEntity({
      AI: [{ order: 'moon' }, { order: 'jupiter' }]
    });

    const obj = JSON.parse(entity.AI.moon.stringify());

    expect(obj.type).equal('AI');
    expect(obj.id).equal(entity.AI.moon.id);
  });

  // lab.test('getObject on entity', () => {
  it('getObject on entity', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('EquipmentSlot', {
      properties: {
        name: 'ring',
        slot: '<Entity>'
      },
      multiset: true,
      mapBy: 'name'
    });
    ecs.registerComponent('Bottle', {});
    ecs.registerComponent('AI', {});
    ecs.registerComponent('Effect', {
      properties: {
        name: 'fire'
      },
      multiset: true
    });

    const bottle = ecs.createEntity({ Bottle: {} });
    let npc = ecs.createEntity({
      EquipmentSlot: {
        ring: { slot: bottle }
      },
      Effect: [{ name: 'wet' }, { name: 'annoyed' }],
      AI: {}
    });

    const old = npc.getObject();

    npc.destroy();
    npc = undefined;

    npc = ecs.createEntity(old);

    const old2 = npc.getObject();

    expect(npc.EquipmentSlot.ring.slot).equal(bottle);
    expect(npc.Effect.size).equal(2);
    expect([...npc.Effect][0].name).equal('wet');
    expect([...npc.Effect][1].name).equal('annoyed');
    expect([...npc.Effect][1].id).equal(old.Effect[1].id);
    expect([...npc.Effect][0].id).equal(old.Effect[0].id);
    expect(npc.AI.id).equal(old.AI.id);
  });

  // lab.test('property skipping', () => {
  it('property skipping', () => {

    const ecs = new ECS.ECS();
    ecs.registerComponent('Effect', {
      properties: {
        name: 'fire',
        started: ''
      },
      serialize: {
        skip: false,
        ignore: ['started']
      }
    });
    ecs.registerComponent('AI', {
      properties: {
        name: 'thingy',
      },
      serialize: {
        skip: true,
        ignore: []
      }
    });

    ecs.registerComponent('Liquid', {
      properties: {},
      serialize: {
        ignore: []
      }
    });

    const entity = ecs.createEntity({
      Effect: {
        name: 'fire',
        started: Date.now()
      },
      AI: {},
      Liquid: {}
    });

    const old = entity.getObject();

    const entity2 = ecs.createEntity(old);

    expect(old.AI).not.to.exist;
    expect(old.Effect.started).not.to.exist;
    expect(old.Effect.name).equal('fire');
    expect(old.Liquid).exist;
    expect(entity2.Liquid).exist;
  });
});

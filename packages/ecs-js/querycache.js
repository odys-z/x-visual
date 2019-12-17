class QueryCache {

  // branch ANY
  constructor (ecs, has, hasnt, any) {
    this.ecs = ecs;
    this.has = has;
    this.hasnt = hasnt;
	this.any = any;
	// set results as set of entities subscribed by System.query,
	// e.g results = [entitye{ id = 'xview'}] by CamCtrl.query = [has['UserCmd', 'CmdFlag']]
    this.results = this._initial();
  }

  // branch ANY
  /*
  _initial() {
    if (this.has.length === 1 && this.hasnt.length === 0) {
      const entities = new Set();
      for (const component of this.ecs.getComponents(this.has[0])) {
        entities.add(component.entity);
      }
      return entities;
    }
    const hasSet = [];
    const hasntSet = [];
    for (const cname of this.has) {
      hasSet.push(this.ecs.entityComponents.get(cname));
    }
    hasSet.sort((a, b) => {
      return a.size - b.size;
    });
    for (const cname of this.hasnt) {
      hasntSet.push(this.ecs.entityComponents.get(cname));
    }

    const results = new Set([...hasSet[0]]);
    for (let idx = 1, l = hasSet.length; idx < l; idx++) {
      const intersect = hasSet[idx];
      for (const id of results) {
        if (!intersect.has(id)) {
          results.delete(id);
        }
      }
    }
    for (const id of results) {
      for (const diff of hasntSet) {
        if (diff.has(id)) {
          results.delete(id);
          break;
        }
      }
    }

    return new Set([...results]
      .map(id => this.ecs.entities.get(id))
      .filter(entity => !!entity)
    );
  }

updateEntity(entity) {

    const id = entity.id;
    let found = true;
    for (const cname of this.has) {
      const hasSet = this.ecs.entityComponents.get(cname);
      if (!hasSet.has(id)) {
        found = false;
        break;
      }
    }
    if (!found) {
      this.results.delete(entity);
      return;
    }

    found = false;
    for (const cname of this.hasnt) {
      const hasntSet = this.ecs.entityComponents.get(cname);
      if (hasntSet.has(id)) {
        found = true;
        break;
      }
    }
    if (found) {
      this.results.delete(entity);
      return;
    }
    this.results.add(entity);
  }

  */
  _initial() {
    if (this.has.length === 1 && this.any.length === 0 && this.hasnt.length === 0) {
      const entities = new Set();
      for (const component of this.ecs.getComponents(this.has[0])) {
        entities.add(component.entity);
      }
      return entities;
    }

	// has
    const hasSet = [];
    for (const cname of this.has) {
      hasSet.push(this.ecs.entityComponents.get(cname));
    }
    hasSet.sort((a, b) => {
      return a.size - b.size;
    });

	// results is a set of Entities Ids (mapped later)
    let results; //  = new Set();
	if (hasSet && hasSet.length > 0) {
		results = new Set([...hasSet[0]]);
	}
	else results = new Set();
    for (let idx = 1, l = hasSet.length; idx < l; idx++) {
      const intersect = hasSet[idx];
      for (const id of results) {	// id = EntityId.id, e.g. 'xview'
        if (!intersect.has(id)) {
          results.delete(id);
        }
      }
    }

	// any
    for (const cname of this.any) {
      var c = this.ecs.entityComponents.get(cname);
	  for (const e of c)
      	results.add(e);
    }

	// hasn't
    const hasntSet = [];
    for (const cname of this.hasnt) {
      hasntSet.push(this.ecs.entityComponents.get(cname));
    }
    for (const id of results) {
      for (const diff of hasntSet) {
        if (diff.has(id)) {
          results.delete(id);
          break;
        }
      }
    }

    return new Set([...results]
      .map(id => this.ecs.entities.get(id))
      .filter(entity => !!entity)
    );
  }

  updateEntity(entity) {

    const id = entity.id;
	// any
    let found = false;
	const anySet = new Set();
	for (const cname of this.any) {
      const anyEnts = this.ecs.entityComponents.get(cname);
	  for (const ae in anyEnts) {
		  if (anyEnts.has(id)) {
			  found = true;
			  break;
		  }
	  }
	  if (found) break;
	}

	// has
    // let found = true;
	if (found) {
	    for (const cname of this.has) {
	      const hasSet = this.ecs.entityComponents.get(cname);
	      if (!hasSet.has(id)) {
	        found = false;
	        break;
	      }
	    }
	}

    if (!found) {
      this.results.delete(entity);
      return;
    }

    found = false;
    for (const cname of this.hasnt) {
      const hasntSet = this.ecs.entityComponents.get(cname);
      if (hasntSet.has(id)) {
        found = true;
        break;
      }
    }
    if (found) {
      this.results.delete(entity);
      return;
    }
    this.results.add(entity);
  }

  clearEntity(entity) {

    this.results.delete(entity);
  }

  filter(updatedValues, updatedComponents) {

    let output;
    if (updatedValues > 0) {
      output = [];
      for (const entity of this.results) {
        if (entity.updatedValues >= updatedValues) output.push(entity);
      }
    } else if (updatedComponents > 0) {
      output = [];
      for (const entity of this.results) {
        if (entity.updatedComponents >= updatedComponents) output.push(entity);
      }
    } else {
      return this.results;
    }

    return new Set(output);
  }
}

module.exports = QueryCache;

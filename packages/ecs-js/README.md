see [fritzy/ecs-js readme](https://github.com/fritzy/ecs-js/blob/master/README.md)

# Change Log

- Add ANY, IFFALL query

Let system support query { any: [component-name] } and { iffall: [component-name] }

ANY:

If any of the component presents in an entity, the entity will be included
in the query results.

IFFALL:

If all of the named components present in a entity, it's included in the query
results, no matter what else components in the entity are.

-- System.constructor, condition check:

```
    if (this.constructor.query
		&& (this.constructor.query.has || this.constructor.query.hasnt
         || this.constructor.query.iffall || tthis.constructor.query.any)) {
```

-- ECS.queryEntities() can handle any parameter

```
    const { has, hasnt, any, persist, updatedValues, updatedComponents } = Object.assign({
            ... });
```

-- QueryCache.initial()

```
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

    // iffall (contains)
    const iffSet = [];
    let iffname;
    for (const cname of this.iffall) {
      iffSet.push(this.ecs.entityComponents.get(cname));
      iffname = cname;
      break;
    }
    for (const cname of this.iffall) {
      if (cname === iffname)
        continue;
      const intersect = this.ecs.entityComponents.get(cname);
      for (const id of results) {	// id = EntityId.id, e.g. 'xview'
        if (!intersect.has(id)) {
          results.delete(id);
        }
      }
    }

	// any
    for (const cname of this.any) {
      var c = this.ecs.entityComponents.get(cname);
      if (c === undefined || !(Symbol.iterator in Object(c)))
        continue;
      for (const e of c)
        results.add(e);
    }
```

-- QueryCache.updateEntity() - See source

```
    updateEntity(entity) {

      const id = entity.id;
      // any
      let foundAny = false;
      const anySet = new Set();
      for (const cname of this.any) {
        const anyEnts = this.ecs.entityComponents.get(cname);
        for (const ae in anyEnts) {
            if (anyEnts.has(id)) {
                foundAny = true;
                break;
            }
        }
        if (foundAny) break;
      }

      // iffall
      let foundIffall = true;
      if (!foundAny) {
        for (const cname of this.iffall) {
          const iffSet = this.ecs.entityComponents.get(cname);
    	    if (!iffSet.has(id)) {
    	       foundIffall = false;
    	       break;
    	    }
        }
      }

      // has
      let foundHas = true;
      if (!foundAny && !foundIffall) {
          for (const cname of this.has) {
            const hasSet = this.ecs.entityComponents.get(cname);
            if (!hasSet.has(id)) {
              foundHas = false;
              break;
            }
          }
      }

      if (!foundAny && !foundHas && foundIffall) {
        this.results.delete(entity);
        return;
      }

      let foundHasnt = false;
      for (const cname of this.hasnt) {
        const hasntSet = this.ecs.entityComponents.get(cname);
        if (anyEnts === undefined || !(Symbol.iterator in Object(anyEnts)))
            continue;
        if (hasntSet.has(id)) {
          foundHasnt = true;
          break;
    	}
      }
      if (foundHasnt) {
        this.results.delete(entity);
        return;
      }
      this.results.add(entity);
    }
```

- Trigger component founding events when creating entities

1. Add function ECS.componentTriggered(cmp-names, callback) to set events handler.

2. Modify ECS.createEntity() to trigger events if one of cmp-name been found.

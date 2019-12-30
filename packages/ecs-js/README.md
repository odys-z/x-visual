see [fritzy/ecs-js readme](https://github.com/fritzy/ecs-js/blob/master/README.md)

# Change Log

- Add ANY query

Let system support query {any:[component]}

-- System.constructor, condition check:

```
    if (this.constructor.query
        (this.constructor.query.has || this.constructor.query.hasnt || this.constructor.query.any))
```

-- ECS.queryEntities() can handle any parameter

```
    const { has, hasnt, any, persist, updatedValues, updatedComponents } = Object.assign({
            ... });
```

-- QueryCache.initial() - tested with ecs.html.Cubesys

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

	// any
    for (const cname of this.any) {
      var c = this.ecs.entityComponents.get(cname);
	  for (const e of c)
      	results.add(e);
    }
```

-- QueryCache.updateEntity() - TODO: debug

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

      // has
      // let found = true;
      let foundHas = true;
      if (!foundAny) {
          for (const cname of this.has) {
            const hasSet = this.ecs.entityComponents.get(cname);
            if (!hasSet.has(id)) {
              foundHas = false;
              break;
            }
          }
      }

      if (!foundAny && !foundHas) {
        this.results.delete(entity);
        return;
      }

      let foundHasnt = false;
      for (const cname of this.hasnt) {
        const hasntSet = this.ecs.entityComponents.get(cname);
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

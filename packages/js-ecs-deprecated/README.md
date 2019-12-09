[Source](https://gitlab.com/JestDotty/js-ecs) 
[npm home](https://www.npmjs.com/package/js-ecs)

`npm i --save js-ecs`

## Usage

Node.js: `const ecs = require('js-ecs')`

Browser: include `dist/js-ecs.js` in your load scripts

#### Sample

```js
class Position{
	constructor(x, y){
		this.x = x
		this.y = y
	}
}
class Velocity{
	constructor(x, y){
		this.x = x
		this.y = y
	}
}

class MoveSys extends ecs.System{
	constructor(){
		//stuff
	}
	update(dt){
		let es = this.get('Position', 'Velocity')
		es.forEach(e=>{
			let p = e.get('Position')
			let v = e.get('Velocity')
			p.x += v.x*dt
			p.y += v.y*dt
			//or whatever
		})
	}
}

let engine = new ecs.Engine()
engine.addSystem(new MoveSys())
engine.addEntity(new ecs.Entity(new Position(0, 0), new Velocity(1, 1)))

let lastTime
requestAnimationFrame(time=>{
	if(!lastTime){
		//do first init or something
	}else{
		engine.update((time - lastTime)/1000)
	}
	lastTime = time
})
```

Docs
---

### Entity
A bag of components.

`constructor(...components)`
- Expects instances of components

`add(...components)`
- Expects instances of components

`remove(...componentNames)`
- Expects string names of components (their constructor names)

`get(componentName)`
- Given a component name, returns its instance

`destroy()`
- removes components from linked ECS engine

`ecs`
- Currently attached ECS engine (could be undefined)

### Component
Any class object. Will be named/referenced as its constructor name.

### System
Logic. Gathers components it wants to govern and furthers them.

`update()`
- Should be overriden
- Will forward anything in engine's update call
	- Common standard is to send `dt` which is delta time/time elapsed since last update
- Put your system logic in here to run every tick/frame

`get(...componentNames)`
- Expects string names of components (their constructor names)
- Returns entities that have all the requested components

`attached(engine)`
- Use by overriding. Is called when attached to an ECS engine.
- Put logic here to be run when system is attached to a ECS engine

`dettached(engine)`
- Use by overriding. Is called when attached to an ECS engine.
- Put logic here to be run when system is dettached from a ECS engine

`ecs`
- Currently attached ECS engine (could be undefined)

### Engine
Executes ECS architecture.

`update()`
- Calls all attached systems
- Should be called on every tick/frame
- Will forward any arguments sent to systems update call
	- Common standard is to send `dt` which is delta time/time elapsed since last update

`addSystem(system)`
- will remove from old ecs if one exists

`removeSystem(system)`

`addEntity(entity)`
- will remove from old ecs if one exists

`removeEntity(entity)`

`find(...componentNames)`
- Expects string names of components (their constructor names)
- Returns entities that have all the requested components

`on(event, cb, ...components)`
- events: `add` or `remove`
- cb: function that will be called on the event. Will receive the matching entity.
- components: expects string names of components (their constructor names)

`off(event, cb)`
- events: `add` or `remove`
- cb: function that was assigned to the event

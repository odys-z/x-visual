// module.exports = class Entity{
export default class Entity{
	constructor(){
		this.components = {}
		this.add(...arguments)
	}

	add(...components){
		let process = (this.ecs? this._addAll: this._add).bind(this)
		components.forEach(process)
		if(this.ecs) this.ecs._emit('add', components.map(c=> c.constructor.name), this)
	}
	_add(c){ this.components[c.constructor.name] = c }
	_addAll(c){
		this._add(c)
		this.ecs._addComponent(c.constructor.name, this)
	}

	remove(...components){
		let process = (this.ecs? this._removeAll: this._remove).bind(this)
		components.forEach(process)
		if(this.ecs) this.ecs._emit('remove', components, this)
	}
	_remove(name){ delete this.components[name] }
	_removeAll(name){
		this._remove(name)
		this.ecs._removeComponent(name, this)
	}

	get(name){return this.components[name]}

	_notify(type){this.ecs._emit(type, Object.keys(this.components), this)}
	destroy(){
		if(!this.ecs) return
		this.ecs.removeEntity(this)
	}
}

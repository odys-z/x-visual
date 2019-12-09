export default class Subsystem{
	update(dt){}
	get(){
		if(!this.ecs) return []
		return this.ecs.find(...arguments)
	}
	attached(engine){}
	dettached(engine){}
}

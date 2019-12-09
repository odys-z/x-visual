
import * as ECS from '../../packages/ecs-js/index';

/**
 * Subclass for handling data objects
 */
export default class Obj extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

}

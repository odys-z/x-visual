/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';

/**
 * @class
 */
export default class PostEffects extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

}

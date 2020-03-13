/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';

/**
 * @class
 */
export default class AffineCombiner extends ECS.System {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

}

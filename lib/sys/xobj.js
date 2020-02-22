/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';

/**
 * Sub system's base class for handling data objects.
 * For sample of implementing sub class, see test/xobj.case.js.
 * @class
 */
export default class XSys extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

}

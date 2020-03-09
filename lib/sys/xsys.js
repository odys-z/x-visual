/** @module xv.ecs.sys */

import * as ECS from '@fritzy/ecs';

/**
 * Sub system's base class for handling data objects.
 * For sample of implementing sub class, see example/cube.
 * test: basic-xsys.case.js.
 * @class
 */
export default class XSys extends ECS.System {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}
}

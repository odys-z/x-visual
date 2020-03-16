/** @namespace xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';

/**
 * Sub system's base class for handling data objects.
 * For sample of implementing sub class, see example/cube.
 * test: basic-xsys.case.js.
 * @class XSys
 */
export default class XSys extends ECS.System {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}
}

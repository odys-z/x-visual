/** @module xv.ecs.sys.anim */

import * as ECS from '../../packages/ecs-js/index';

/**
 * Subsystem of rotate animation
 * query: ['UserCmd', 'Tween']
 * @class
 */
class RotXYZAnim extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

}

RotXYZAnim.query = {has: ['Tween']};

/**
 * Subsystem of translate animation
 * @class
 */
class PosAnim extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

}

PosAnim.query = {has: ['Tween']};

/**
 * Subsystem of path moving animation
 * @class
 */
class PathAnim extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

}

PathAnim.query = {has: ['Tween']};

// TODO rename according to design doc
export {RotXYZAnim, PosAnim, PathAnim}

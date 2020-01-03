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

RotXYZAnim.query = {has: ['RotXYZTween']};

/**
 * Subsystem of translate animation
 * @class
 */
class TransAnim extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}
}

TransAnim.query = {has: ['TransTween']};

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

PathAnim.query = {has: ['PathTween']};

// TODO rename according to design doc
export {RotXYZAnim, TransAnim, PathAnim}

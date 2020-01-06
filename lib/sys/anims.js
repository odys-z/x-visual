/** @module xv.ecs.sys.anim */

import * as ECS from '../../packages/ecs-js/index';

// var TWEEN = require('@tweenjs/tween.js');
import TWEEN from '@tweenjs/tween.js';

class TweenAnim extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		// this.tween = new TWEEN.Tween()
		this.ecs = ecs;
	}

	update(tick, entities) {
		console.log(this, tick, entities);
	}
}

const hasRot = {has: ['UserCmd', 'RotaTween']};
/**
 * Subsystem of rotate animation
 * query: ['UserCmd', 'RotaTween']
 * @class
 */
class RotAnim extends TweenAnim {
	constructor(ecs, options) {
		super(ecs, options);
		this.ecs = ecs;
		var ents = ecs.queryEntities(hasRot);
		this.createTweens(ecs, ents);
	}

	update(tick, entities) {
		if (entities)
			entities.forEach(function(e, x) {
				e.RotaTween.tween.update(tick);
			});
	}

	/**
	 * @param {ECS} ecs
	 * @param {[ECS.Entity]} entities
	 */
	createTweens(ecs, entities) {
		if (entities) {
			var onUpdate = this.onTweenUpdate;
			entities.forEach(function(e, x) {
				if (e.RotaTween) {
					var to = [45, 0, 0];
					e.RotaTween.tween =
						new TWEEN.Tween(e.RotaTween.rotation)
								 .to(to, e.RotaTween.duration)
								 .onUpdate(onUpdate)
								 .start();
				}
			});
		}
	}

	onTweenUpdate() {
		// this is rotation?
		console.log(this);
	}

}

RotAnim.query = hasRot;

/**
 * Subsystem of translate animation
 * @class
 */
class TransAnim extends TweenAnim {
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
class PathAnim extends TweenAnim {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

}

PathAnim.query = {has: ['PathTween']};

/**TODO really serious?
 * see https://unboring.net/workflows/animation.html
 */
class BlenderAdapter extends ECS.System {

}

class SkeletonAnim extends BlenderAdapter {

}

// TODO rename according to design doc
export { TweenAnim, RotAnim, TransAnim, PathAnim }

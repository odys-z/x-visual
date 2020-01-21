/** @module xv.ecs.sys.anim */

import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index';

// var TWEEN = require('@tweenjs/tween.js');
import TWEEN from '@tweenjs/tween.js';

import {TweenScript} from '../component/tween';

const hasTween = { has: ['CmpTween'] };

class TweenAnim extends ECS.System {
	constructor(ecs, options, has) {
		super(ecs);
		this.ecs = ecs;
		var ents = ecs.queryEntities(has || hasTween);
		this.createTweens(ecs, ents);
	}

	/**
	 * @param {ECS} ecs
	 * @param {[ECS.Entity]} entities
	 */
	createTweens(ecs, entities) {
		if (entities) {
			var onUpdate = this.onTweenUpdate;
			entities.forEach(function(e, x) {
				if (e.CmpTween) {
					// FIXME this is not ECS
					// We can't take Tween as a component - it's method and data can't be separated
					// but we don't use class as component - needing a tweener system.
					e.CmpTween.tweener = XTweener(e);
				}
			});
		}
	}

	update(tick, entities) {
		if (entities) {
			var stamp = TWEEN.now();
			entities.forEach(function(e, x) {
				if (e.CmpTween.playing) {
					console.log(stamp);
					// FIXME this is not ECS
					e.CmpTween.playing = e.CmpTween.tweener.update(stamp);
				}
			});
		}
	}

	// onTweenUpdate(progress, rot, mesh) {
	// 	console.log(progress, rot);
	// 	if (mesh && typeof mesh.rotateOnAxis === 'function') {
	// 		var axis = new THREE.Vector3(1, 0, 0);
	// 		mesh.rotateOnAxis(axis, rot.deg / 180 * Math.PI);
	// 		// mesh.setRotationFromAxisAngle(axis, rot.geg);
	// 	}
	// }
}

TweenAnim.query = hasTween;

function XTweener(enty, onUpdate) {
	var comp = enty.CmpTween;
	if (comp.animator === TweenScript.ROT_MESH) {
		return new Rotweener(enty, onUpdate);
	}
	else {
		console.log('TODO');
	}
}

class Rotweener {
	constructor(e) {
		const comp = e.CmpTween;
		const scpt = comp.script;
		const meshcmp = e[scpt.meshcomp];
		if (meshcmp){
			const mesh = meshcmp[scpt.meshname];
			if (mesh) {
				this.rotation = {deg: scpt.deg[0]};
				var rot = this.rotation;
				this.tween = new TWEEN.Tween(mesh.rotation)
						// .to(scpt.deg[1], e.CmpTween.duration)
						.to({x: 45 * Math.PI / 180}, e.CmpTween.duration)
						// .onUpdate((prog) => {
						// 	// according to doc, prog is not usable
						// 	onUpdate(prog, rot, mesh);
						//  });
				if (comp.playing) {
					this.tween.start();
				}
			}
			else {
				// mesh could be not initialized by thrender yet
				console.error('Rotweener should initialized after target mesh created.',
					'target mesh: ', scpt.meshcomp, scpt.meshname);
			}
		}
	}

	update(stamp) {
		// should visual handling here?
		return this.tween.update(stamp);
	}

	// onUpdate(prog, deg, mesh) {
	// 	console.log(prog, deg)
	// }
}

class Transweener extends XTweener {
	constructor(target, script) {
	}
}

class Pathweener extends XTweener {
	constructor(target, script) {
	}
}

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
		if (entities) {
			var stamp = TWEEN.now();
			entities.forEach(function(e, x) {
				if (e.RotaTween.playing) {
					console.log(stamp);
					e.RotaTween.playing = e.RotaTween.tween.update(stamp);
					// e.g. e.Visual.mesh.rotation, must have a ratation function
					const target = e[e.RotaTween.target.component][e.RotaTween.target.prop];
					const func = e[e.RotaTween.target.func];
					target[func](e.RotaTween.rotation, e.RotaTween.axis);
				}
			});
		}
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

	onTweenUpdate(progress, deg, mesh) {
		console.log(progress, deg);
		if (mesh && typeof mesh.rotateOnAxis === 'function') {
			var axis = new THREE.Vector3(1, 0, 0);
			mesh.rotateOnAxis(axis, deg.deg);
		}
	}

}

// RotAnim.query = hasRot;

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

export { TweenAnim }

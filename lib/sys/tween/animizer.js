/**Animizers convert spcrits like morphing, model alpha into tween component.
 *
 * For components, see lib/components/tween.js
 *
 * @module xv.ecs.sys.tween */

import * as THREE from 'three';
import * as ECS from '../../../packages/ecs-js/index';

// import TWEEN from '@tweenjs/tween.js';
import {AnimType, ModelSeqs} from '../../component/morph';
import {TWEEN} from './xtweener';

const iffModel = ['Obj3', 'ModelSeqs', 'CmpTween'];

class MorphingAnim extends ECS.System {
	constructor(ecs, options, has) {
		super(ecs);
		this.ecs = ecs;
		// var ents = ecs.queryEntities(has || {iffall: iffModel
		// this.initTweens(ecs, ents);
	}

	/**
	 * @param {ECS} ecs
	 * @param {[ECS.Entity]} entities
	 */
	initTweens(ecs, entities) {
		if (entities) {
			for(const e of entities) {
				if (e.ModelSeqs.script[0] && e.ModelSeqs.script[0][0]) {
					// start the first tween - FIXME how about do this in update?
					if (e.ModelSeqs.script[0][0].mtype === AnimType.OBJ3ROTX) {
						// rotate an Obj3 TODO with axis
						TWEEN.Tween(e.CmpTween, e.Obj3.mesh.rotation)
							.to({x: 45 * Math.PI / 180}, e.CmpTween.duration)
							.start(e.ModelSeqs.script[0][0].start || 0);
					}
				}
			}
		}
	}

	update(tick, entities) {
		if (entities) {
			var stamp = TWEEN.now();
			for (const e of entities) {
				if (e.CmpTween.playing) {
					console.log(stamp);
					// e.CmpTween.playing = e.CmpTween.tweener.update(stamp);
					// TODO explain morphing script to tween?
				}
				else {
				}
			}
		}
	}
}

MorphingAnim.query = { iffall: iffModel };

export { MorphingAnim }
/*
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
*/

/**
 * Subsystem of rotate animation
 * query: ['UserCmd', 'RotaTween']
 * @class
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
	 * /
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
 */

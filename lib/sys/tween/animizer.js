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

const iffModel = ['Obj3', 'ModelSeqs', 'CmpTweens'];

class MorphingAnim extends ECS.System {
	constructor(ecs, options, has) {
		super(ecs);
		this.ecs = ecs;
		var ents = ecs.queryEntities(has || {iffall: iffModel});
		this.initTweens(ecs, ents);
	}

	/**
	 * @param {ECS} ecs
	 * @param {[ECS.Entity]} entities
	 */
	initTweens(ecs, entities) {
		if (entities) {
			for(const e of entities) {
				if (!e.CmpTweens) {
					console.warn(
						"MorphingAnim.initTweens(): found scripts to be be animized but no CmpTweens to save.\n",
						e);
					continue;
				}
				// validate tweens already defined by user
				if (e.CmpTweens.twindx === undefined)
					e.CmpTweens.twindx = [];
				if (e.CmpTweens.tweens === undefined)
					e.CmpTweens.tweens = [];
				if(e.CmpTweens.twindx.length !== e.CmpTweens.tweens.length) {
					console.warn("Animizer.initTweens(): User definded tweens ignored as tween seq current index array length not equals to tweens sequences length:\n",
								e.CmpTweens.twindx, e.CmpTweens.tweens);
					e.CmpTweens.twindx = [];
					e.CmpTweens.tweens = [];
				}
				if (e.ModelSeqs && e.ModelSeqs.script) {
					// Add scripts to tweens
					for (var i = 0; i < e.ModelSeqs.script.length; i++) {
						var cmps = [];
						const seq = e.ModelSeqs.script[i];
						for (var sx = seq.length - 1; sx >= 0; sx--) {
							const s = seq[sx];
							var tween;
							// start the first tween - FIXME how about do this in update?
							if (s.mtype === AnimType.OBJ3ROTX) {
								var cmp = {};
								tween = TWEEN.Tween(cmp, e.Obj3.mesh.rotation)
									.to({x: 45 * Math.PI / 180}, cmp.duration)
									.start(s.paras.start);
								cmps.unshift(cmp);
							}
							else if (s.mtype === AnimType.OBJ3ROTAXIS) {
								var cmp = {};
								tween = TWEEN.Tween(cmp, e.Obj3.mesh.rotation)
									.to({y: 135 * Math.PI / 180}, cmp.duration)
									.start(s.paras.start);
								cmps.unshift(cmp);
							}

							if (sx === seq.length - 1 && s.onComplete ) {
								tween.onComplete(s.onComplete);
							}
							else if (sx < seq.length - 1 && tween && !cmp.chainedTweens) {
								// chain
								// FIXME this is not the same design with twindx
								tween.onComplete( (props, cmp) => {
									// nextween.start(TWEEN.now());
									if ( seq[sx + 1] ) {
										var nextween = seq[sx + 1];
										nextween.start();
									}
									cmp.twindx[i] = sx;
								});
							}
						}

						e.CmpTweens.tweens.push(cmps);
						e.CmpTweens.twindx.push(0);
					}
				}
			}
		}
	}

	update(tick, entities) {
		if (entities) {
			var stamp = TWEEN.now();
			for (const e of entities) {
				if (e.CmdFlag > 0) {
					console.log(stamp);
					// TODO explain morphing script to tween
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

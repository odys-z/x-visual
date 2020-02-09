/**Animizers convert spcrits like morphing, model alpha into tween component.
 *
 * For components, see lib/components/tween.js
 *
 * @module xv.ecs.sys.tween */

import * as THREE from 'three';
import * as ECS from '../../../packages/ecs-js/index';

import {AnimType, ModelSeqs} from '../../component/morph';
import {TWEEN} from './xtweener';
import {XError} from '../../xutils/xcommon'

const iffModel = ['Obj3', 'ModelSeqs', 'CmpTweens'];

class MorphingAnim extends ECS.System {
	get startings() {
		return this.startriggerings;
	}

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
			// cross entity triggering entity-id: script-idx
			this.startriggerings = {};

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
					e.CmpTweens.twindx = new Array(e.ModelSeqs.script.length)
								.fill(Infinity); // index out of bounds for no current playing

					for (var seqx = 0; seqx < e.ModelSeqs.script.length; seqx++) {
						var cmps = [];
						const seq = e.ModelSeqs.script[seqx];
						for (var twnx = seq.length - 1; twnx >= 0; twnx--) {
							const scrpt = seq[twnx];
							var tween, cmp;
							// start the first tween - FIXME how about do this in update?
							if (scrpt.mtype === AnimType.OBJ3ROTX) {
								cmp = {};
								tween = TWEEN.Tween(cmp, e.Obj3.mesh.rotation)
									.to({x: 45 * Math.PI / 180}, scrpt.paras.duration * 1000 || cmp.duration)
									.easing(scrpt.paras.ease)
									;//.start(scrpt.paras.start);
								//debug note: isPlaying = true no matter what time is
								// cmps.unshift(cmp);
							}
							else if (scrpt.mtype === AnimType.OBJ3ROTAXIS) {
								cmp = {};
								tween = TWEEN.Tween(cmp, e.Obj3.mesh.rotation)
									.to({y: 90 * Math.PI / 180}, scrpt.paras.duration * 1000 || cmp.duration)
									.easing(scrpt.paras.ease)
									;//.start(scrpt.paras.start);
								//debug note: isPlaying = true no matter what time is
								// cmps.unshift(cmp);
							}
							else if (scrpt.mtype === AnimType.ALPHA) {
								cmp = {};
								e.Obj3.mesh.material.opacity = scrpt.paras.alpha[0] || 1;
								tween = TWEEN.Tween(cmp, e.Obj3.mesh.material)
									.to({opacity: scrpt.paras.alpha[1] || 0.5}, scrpt.paras.duration * 1000 || cmp.duration)
									.easing(scrpt.paras.ease);
								// cmps.unshift(cmp);
							}
							else if (scrpt.mtype === AnimType.U_VERTS_TRANS) {
								// using tween.js update shader uniforms (Obj3.uniforms)
								if (!e.Obj3.mesh || !e.Obj3.mesh.material) {
									// should be an internal error
									throw new XError(`Animizing vertices needing target Obj3 with mesh and material.\nseqx = ${seqx}, seq = ${seq}`,
										seqx, seq);
								}
								else if (! (e.Obj3.mesh.material instanceof THREE.ShaderMaterial)) {
									// should be an internal error
									throw new XError("Animizer.initTweens(): For AnimType.U_VERTS_TRANS, x-visual currently only support materials with unfiroms property, a.k.a THREE.ShaderMaterail.");
								}
								else if ( !scrpt.paras.uniforms ) {
									// should be an internal error
									throw new XError(`Animizer.initTweens(): For AnimType.U_VERTS_TRANS, No uniforms paras (CmpTweens[${seqx}][${twnx}].paras.uniforms) for ShaderMaterial?`);
								}
								else {
									cmp = {};
									var start = e.Obj3.mesh.material.uniforms;
									var to = {};
									// FIXME use obj2unifors() instead
									for (var u_prop in scrpt.paras.uniforms) {
										start[u_prop] = {value: scrpt.paras.uniforms[u_prop][0]};
										to[u_prop] = {value: scrpt.paras.uniforms[u_prop][1]};
									}
									// Object.assign(cmp, e.Obj3.mesh.material.uniforms,
									// 	{tween: {twn_mpos: 0, twn_wpos: 0}});
									tween = TWEEN.Tween(cmp, e.Obj3.mesh.material.uniforms)
										.to(to, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
									// cmps.unshift(cmp);
								}
							}
							else if (scrpt.mtype === AnimType.UNIFORMS) {
								if (!e.Obj3.mesh || !e.Obj3.mesh.material
									|| !e.Obj3.mesh.material.uniforms) {
									console.error("Animizing uniforms needing target Obj3.mesh with material and it\'s unfiroms.\n",
										"Obj3.mesh:\n", e.Obj3.mesh, "script:\n", seqx, seq);
									// continue;
								}
								else {
									// FIXME common function with the other branch?
									cmp = {};
									var start = e.Obj3.mesh.material.uniforms;
									var to = {};
									for (var u_prop in scrpt.paras.uniforms) {
										start[u_prop] = {value: scrpt.paras.uniforms[u_prop][0]};
										to[u_prop] = {value: scrpt.paras.uniforms[u_prop][1]};
									}
									tween = TWEEN.Tween(cmp, e.Obj3.mesh.material.uniforms)
										.to(to, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
									// cmps.unshift(cmp);
								}
							}
							else {
								console.error("Animizer.initTweens(): unrecognized AnimType: ",
									scrpt.mtype, `entity id: ${e.id}`, e.ModelSeqs);
								// cmps.unshift(undefined);
							}
							cmps.unshift(cmp);

							// trigger startWith
							// started by 'start-with' can only been triggered after this tween is started
							if (scrpt.startWith && Array.isArray(scrpt.startWith)
								&& scrpt.startWith.length > 0) {
								cmp.startWith = scrpt.startWith;
								for (var sw of cmp.startWith) {
									// sw.starter = e.CmpTweens[seqx][twnx];
									sw.starter = cmp;
								}
							}

							cmp.followBy = scrpt.followBy;

							if (twnx === seq.length - 1 && scrpt.onComplete ) {
								tween.onComplete(scrpt.onComplete);
							}

							if (twnx === 0 && (scrpt.paras.start === 0
								|| scrpt.paras.start === undefined || scrpt.paras.start === null)) {
								// start and record to be 'started with'
								tween.start( this.startriggerings );
								e.CmpTweens.twindx[seqx] = 0;
							}
							// FIXME else start delay ignored for other following script?
						}

						e.CmpTweens.tweens.push(cmps);
						// e.CmpTweens.twindx.push(0);
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

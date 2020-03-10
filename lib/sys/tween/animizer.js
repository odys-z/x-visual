/**Animizers convert spcrits like morphing, model alpha into tween component.
 *
 * For components, see lib/components/tween.js
 *
 * @namespace xv.ecs.sys.tween */

import * as THREE from 'three';
import * as ECS from '../../../packages/ecs-js/index';

import {AnimType, ModelSeqs, AnimCate} from '../../component/morph';
import {ShaderFlag, AssetType} from '../../component/visual';
import XTweener from './xtweener';
import {TWEEN, TriggerEvent} from './xtweener';
import {XError} from '../../xutils/xcommon'
import * as xutils from '../../xutils/xcommon'
import {vec3, mat4, radian} from '../../xmath/vec'
import * as xglsl from '../../xutils/xglsl'

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
	 * @param {array<ECS.Entity>} entities
	 */
	initTweens(ecs, entities) {
		if (entities) {
			// cross entity triggering entity-id: script-idx
			this.startriggerings = {};
			var now = TWEEN.now();

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
							var mcate = scrpt.mtype & AnimCate.MASK;
							var mtype = scrpt.mtype;
							if (mcate === AnimCate.COMBINE_AFFINE) {
								cmp = {affineCombine: true};
								// affines is public for all COMBINE_AFFINE
								cmp.affines = [];

								if (mtype === AnimType.ORBIT) {
									var negTrans = new vec3(scrpt.paras.pivot).neg();
									cmp.affines.push({translate: negTrans.arr()});

									// TODO merge this section as a helper
									var axis = scrpt.paras.axis;
									if (!Array.isArray(axis)) {
										console.warn("Animizer.initTweens(): axis (${scrpt.paras.axis}) is not an array.")
										axis = [0, 1, 0];
									}
									var rotate = {rad: radian(scrpt.paras.deg[0]), axis};

									cmp.affines.push({rotate});
									cmp.affines.push({translate: new vec3(scrpt.paras.pivot).arr()});
									tween = TWEEN.Tween(cmp, rotate)
										.to({rad: radian(scrpt.paras.deg[1])}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								else if (mtype === AnimType.ROTAXIS) {
									// e.Obj3.mesh.rotation.y = radian(scrpt.paras.deg[0]);
									// tween = TWEEN.Tween(cmp, e.Obj3.mesh.rotation)
										// .to({y: radian(scrpt.paras.deg[1])}, scrpt.paras.duration * 1000 || cmp.duration)
										// .easing(scrpt.paras.ease);
									var axis = scrpt.paras.axis;
									if (!Array.isArray(axis)) {
										console.warn("Animizer.initTweens(): axis (${scrpt.paras.axis}) is not an array.")
										axis = [0, 1, 0];
									}
									var rotate = {rad: radian(scrpt.paras.deg[0]), axis};

									cmp.affines.push({rotate});
									tween = TWEEN.Tween(cmp, rotate)
										.to({rad: radian(scrpt.paras.deg[1])}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								else if (scrpt.mtype === AnimType.ROTATEX) {
									e.Obj3.mesh.rotation.x = radian(scrpt.paras.deg[0]);
									tween = TWEEN.Tween(cmp, e.Obj3.mesh.rotation)
										.to({x: radian(scrpt.paras.deg[1])}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								else {
									throw new XError(`Entity(${e.id}).script[${seqx}, ${twnx}].mtype is not a supported anim type (COMBINE_AFFINE === 1): 0x${scrpt.mtype.toString(16)}`);
								}
							}
							else if (mtype === AnimType.ROTATEX) {
								cmp = {};
								e.Obj3.mesh.rotation.x = radian(scrpt.paras.deg[0]);
								tween = TWEEN.Tween(cmp, e.Obj3.mesh.rotation)
									.to({x: radian(scrpt.paras.deg[1])}, scrpt.paras.duration * 1000 || cmp.duration)
									.easing(scrpt.paras.ease);
							}
							else if (mtype === AnimType.ALPHA) {
								cmp = {};
								// for points, alpha is handled as uniform
								if (e.Visual && (e.Visual.vtype === AssetType.point
									|| e.Visual.vtype === AssetType.refPoint)) {
									e.Obj3.mesh.material.uniforms.u_alpha = { value: scrpt.paras.alpha[0]};
									tween = TWEEN.Tween(cmp, e.Obj3.mesh.material.uniforms)
										.to({u_alpha: {value: scrpt.paras.alpha[1]} },
											scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								// otherwise alpha as mesh.opacity
								else {
									e.Obj3.mesh.material.opacity = scrpt.paras.alpha[0];
									tween = TWEEN.Tween(cmp, e.Obj3.mesh.material)
										.to({opacity: scrpt.paras.alpha[1]}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
							}
							else if (mtype === AnimType.U_VERTS_TRANS) {
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
									throw new XError(`Animizer.initTweens(): For AnimType.U_VERTS_TRANS, No uniforms paras (ModelSeqs.script[${seqx}][${twnx}].paras.uniforms) for ShaderMaterial?`);
								}
								else {
									cmp = {};
									var {start, to} = xglsl.script2uniforms(scrpt.paras.uniforms, e.Obj3.mesh.material.uniforms);
									tween = TWEEN.Tween(cmp, e.Obj3.mesh.material.uniforms)
										.to(to, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
							}
							else if (mtype === AnimType.UNIFORMS) {
								if (!e.Obj3.mesh || !e.Obj3.mesh.material
									|| !e.Obj3.mesh.material.uniforms) {
									console.error("Animizing uniforms needing target Obj3.mesh with material and it\'s unfiroms.\n",
										"Obj3.mesh:\n", e.Obj3.mesh, "script:\n", seqx, seq);
									// continue;
								}
								else {
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
								}
							}
							else {
								console.error("Animizer.initTweens(): unrecognized AnimType: ",
									scrpt.mtype.toString(16), `entity id: ${e.id}`, e.ModelSeqs);
							}

							if (cmp) {
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
                                else if (twnx === 0 && scrpt.paras.start > 0 && scrpt.paras.start < Infinity){
                                    // start later, after delayed
                                    XTweener.pushTriggerings(TriggerEvent.BEGINNING, now, undefined, this.startriggerings,
                                        [{entity: e.id, start: scrpt.paras.start, seqx}]);
                                }
                            }
						}

						e.CmpTweens.tweens.push(cmps);
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

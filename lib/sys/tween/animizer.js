/**Animizers convert spcrits like morphing, model alpha into tween component.
 *
 * For components, see lib/components/tween.js
 *
 */

import * as THREE from '../../../packages/three/three.module-MRTSupport';
import * as ECS from '../../../packages/ecs-js/index';

import {AnimType, ModelSeqs, AnimCate} from '../../component/morph';
import {Obj3Type} from '../../component/obj3';
import {ShaderFlag, AssetType} from '../../component/visual';
import XTweener from './xtweener';
import {TWEEN, TriggerEvent} from './xtweener';
import {XError} from '../../xutils/xcommon'
import * as xutils from '../../xutils/xcommon'
import {vec3, mat4} from '../../xmath/vec'
import * as xglsl from '../../xutils/xglsl'
import xmath from '../../xmath/math';
import xgeom from '../../xmath/geom';

/**MorphingAnim update query - not used
 * @memberof MorphingAnim */
const iffModel = ['Obj3', 'ModelSeqs', 'CmpTweens'];

/**Change ModelSeqs into tween scripts (CmpTweens) that can be tweened by XTweener.
 * @class MorphingAnim */
class MorphingAnim extends ECS.System {
	/**Get startriggerings.
	 * startriggerings are tween reference that will be started at next update,
	 * by xtweener.
	 * deprecated?
	 * @property {object} startings - object buffer triggerring tweens on next update
	 */
	get startings() {
		return this.startriggerings;
	}

	/**
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {object} has query conditions
	 */
	constructor(ecs, options, has) {
		super(ecs);
		this.ecs = ecs;
		var ents = ecs.queryEntities(has || {iffall: iffModel});
		this.initTweens(ecs, ents);
	}

	/**
	 * Animize script sequences into Tweens
	 * @param {ECS} ecs
	 * @param {array<ECS.Entity>} entities
	 * @member MorphingAnim#initTweens
	 */
	initTweens(ecs, entities) {
		if (entities) {
			// cross entity triggering entity-id: script-idx
			this.startriggerings = new Object();
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
				if (e.CmpTweens.startCmds === undefined)
					e.CmpTweens.startCmds = [];
				if (e.CmpTweens.tweens === undefined)
					e.CmpTweens.tweens = [];
				if(e.CmpTweens.twindx.length !== e.CmpTweens.tweens.length) {
					console.warn("MorphingAnim.initTweens(): User definded tweens ignored as tween seq current index array length not equals to tweens sequences length:\n",
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
							var tween, cmp = undefined;
							var mcate = scrpt.mtype & AnimCate.MASK;
							var mtype = scrpt.mtype;
							if (mcate === AnimCate.COMBINE_AFFINE) {
								cmp = { affineCombine: true };
								// affines is public for all COMBINE_AFFINE
								cmp.affines = [];
								cmp.mf = new mat4(); // see doc for mf, mg

								if (mtype === AnimType.POSITION) {
									var positions = [new vec3(scrpt.paras.translate[0]), new vec3(scrpt.paras.translate[1])];
									var t = {t: 0};

									cmp.affines.push({interpos: {positions, t}, vec3: new vec3()}); // vec3 is a buffer
									tween = TWEEN.Tween(cmp, t)
										.to({t: 1}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								else if (mtype === AnimType.SCALE) {
									var scale = [new vec3(scrpt.paras.scale[0]), new vec3(scrpt.paras.scale[1])];
									var t = {t: 0};

									cmp.affines.push({interpos: {scale, t}, vec3: new vec3()}); // vec3 is a buffer
									tween = TWEEN.Tween(cmp, t)
										.to({t: 1}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								else if (mtype === AnimType.ORBIT) {
									var negTrans = new vec3(scrpt.paras.pivot).neg();
									cmp.affines.push({translate: negTrans.arr()});

									// TODO merge this section as a helper
									var axis = scrpt.paras.axis;
									if (!Array.isArray(axis)) {
										console.warn("Animizer.initTweens(): axis (${scrpt.paras.axis}) is not an array.");
										axis = [0, 1, 0];
									}
									var rotate = {rad: xmath.radian(scrpt.paras.deg[0]), axis};

									cmp.affines.push({rotate});
									cmp.affines.push({translate: new vec3(scrpt.paras.pivot).arr()});
									tween = TWEEN.Tween(cmp, rotate)
										.to({rad: xmath.radian(scrpt.paras.deg[1])}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								else if (mtype === AnimType.ROTAXIS) {
									var axis = scrpt.paras.axis;
									if (!Array.isArray(axis)) {
										console.warn(`Animizer.initTweens(): axis "(${scrpt.paras.axis})" is not an array.`);
										axis = [0, 1, 0];
									}
									let t = {t: 0};
									let deg = [scrpt.paras.deg[0],scrpt.paras.deg[1]];
									let rotate = {deg:deg,axis};
									cmp.affines.push({interpos: {rotate, t}});
									tween = TWEEN.Tween(cmp, t)
										.to({t: 1}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								else if (scrpt.mtype === AnimType.ROTATEX) {
									e.Obj3.mesh.rotation.x = xmath.radian(scrpt.paras.deg[0]);
									// bug
									// FIXME
									// FIXME
									// FIXME why not working with affineCombine = true?
									delete cmp.affineCombine;
									tween = TWEEN.Tween(cmp, e.Obj3.mesh.rotation)
										.to({x: xmath.radian(scrpt.paras.deg[1])}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
								else {
									throw new XError(`Entity(${e.id}).script[${seqx}, ${twnx}].mtype is not a supported anim type (COMBINE_AFFINE === 1): 0x${scrpt.mtype.toString(16)}`);
								}
							}
							else if (mtype === AnimType.U_ALPHA) {
								if ( ( !e.Obj3.mesh || !e.Obj3.mesh.material )
									&& !e.Obj3.mesh.children ) {
									// should be an internal error or wrong spript for object without materials
									throw new XError('Animizing ALPHA needing target Obj3 with mesh and material.\n' +
										`eid = ${e.id}, seqx = ${seqx}, seq = ${seq}`);
								}
								cmp = new Object();
								// for points, alpha is handled as uniform
								// FIXME
								// FIXME Here animizer is asking xglsl that can the uniform been drivable.
								// FIXME It's now crystal clear that tweens are acctually two different things - affine & shader diver
								// FIXME
								if (e.Visual && ( e.Visual.vtype === AssetType.point
												||e.Visual.vtype === AssetType.refPoint
												||e.Visual.vtype === AssetType.GeomCurve
												||e.Visual.vtype === AssetType.DynaSects
												||xglsl.hasUAlpha(e.Visual.shader) ) ) {

									var uniforms;
									if (!e.Obj3.mesh.material) {
										// e.g. an Object3D as group parent, thies no material
										// but children need a shared uniform.u_alpha for tween
										uniforms = new Object();
									}
									else {
										if (!e.Obj3.mesh.material.uniforms)
											e.Obj3.mesh.material.uniforms = new Object();
										// e.Obj3.mesh.material.uniforms.u_alpha = { value: scrpt.paras.alpha[0] };
										uniforms = e.Obj3.mesh.material.uniforms;
									}
									uniforms.u_alpha = { value: scrpt.paras.alpha[0] };
									tween = TWEEN.Tween(cmp, uniforms)
										.to({u_alpha: {value: scrpt.paras.alpha[1]} },
											scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);

									if (scrpt.apply2Children) {
										if (!cmp.appChildUniform)
											cmp.appChildUniform = [];
										// so XTweener will update children's uniform.u_alpha
										cmp.appChildUniform.push('u_alpha');
									}
								}
								// otherwise alpha as mesh.opacity
								else {
									e.Obj3.mesh.material.opacity = scrpt.paras.alpha[0];
									tween = TWEEN.Tween(cmp, e.Obj3.mesh.material)
										.to({opacity: scrpt.paras.alpha[1]}, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
									if (!e.Obj3.mesh.material.uniforms)
										e.Obj3.mesh.material.uniforms = new Object();

									if (scrpt.apply2Children) {
										// frequently found configuration error
										console.error('A morphing script requires applying U_ALPHA to children, but the material is not supported.');
										console.error(e, scrpt);
										console.error('How about using an x-visual shader like colorArray?');
									}
								}
								// can not override visual.paras.tex_alpha
								if (e.Visual && e.Visual.paras && e.Visual.paras.tex_alpha)
									e.Obj3.mesh.material.opacity = e.Visual.paras.tex_alpha;
							}
							else if (mtype === AnimType.U_MORPHi) {
								// using tween.js update shader uniforms (Obj3.uniforms)
								if (!e.Obj3.mesh || !e.Obj3.mesh.material) {
									// should be an internal error
									throw new XError(`Animizing vertices needing target Obj3 with mesh and material.\nseqx = ${seqx}, seq = ${seq}`);
								}
								else if (! (e.Obj3.mesh.material instanceof THREE.ShaderMaterial)) {
									// should be an internal error
									throw new XError("Animizer.initTweens(): For AnimType.U_MORPHi, x-visual currently only support materials as unfiroms property, a.k.a THREE.ShaderMaterail"
										+ "\n(Visual.paras.shader: xv.XComponent.ShaderFlag.colorArray).");
								}
								else if ( !scrpt.paras.uniforms ) {
									// should be an internal error
									throw new XError(`Animizer.initTweens(): For AnimType.U_MORPHi, No uniforms paras (ModelSeqs.script[${seqx}][${twnx}].paras.uniforms) for ShaderMaterial?`);
								}
								else {
									cmp = new Object();
									var {start, to} = MorphingAnim.script2uniforms(scrpt.paras.uniforms, e.Obj3.mesh.material.uniforms);
									tween = TWEEN.Tween(cmp, start)	// start is the uniform, object, a.k.a. Obj3.mesh.material.uniforms
										.to(to, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
							}
							else if ( mtype === AnimType.UNIFORMS
									|| mtype === AnimType.U_t) {
								if (!e.Obj3.mesh || !e.Obj3.mesh.material) {
									console.error("Animizing uniforms needing target Obj3.mesh with material and it\'s unfiroms.\n",
										"Obj3.mesh:\n", e.Obj3.mesh, "script:\n", seqx, seq);
								}
								else {
									// uniforms must presented in mesh.material
									// if (!e.Obj3.mesh.material.uniforms)
									// 	e.Obj3.mesh.material.uniforms = new Object();
									cmp = new Object();
									var tw = e.Obj3.mesh.material.uniforms;
									var to = new Object();
									var ux = 0;
									for (var u_name of scrpt.paras.u_names) {
										tw[u_name] = {value: scrpt.paras.u_ts[ux][0]};
										to[u_name] = {value: scrpt.paras.u_ts[ux][1]};
										ux++;
									}
									// tween = TWEEN.Tween(cmp, e.Obj3.mesh.material.uniforms)
									tween = TWEEN.Tween(cmp, tw)
										.to(to, scrpt.paras.duration * 1000 || cmp.duration)
										.easing(scrpt.paras.ease);
								}
							}
							else if (mtype === AnimType.PATH_MOVE) {
								// Design Notes:
								// For where this path comes from, see Thrender.createCurve()
								if (!e.Obj3.mesh || !e.Obj3.datum
									|| !e.Obj3.datum.path) {
									console.error("Animizing PATH_MOVE needing target Obj3.mesh create and saved a path in Obj3.datum.\n",
										"Obj3.mesh:\n", e.Obj3.mesh, "script:\n", seqx, seq);
								}
								else {
									// FIXME findPath()
									var path = e.Obj3.datum.path; // parent line
									// add some moving points as children of path

									// var {start, to} = createFlowingPoints(path, e.FlowingPath.paras);
									// // https://threejs.org/docs/#api/en/extras/core/Curve.getPointAt
									// e.Obj3.mesh.material.uniforms = Object.assign(e.Obj3.mesh.material.uniforms, start);

									var point;
									var {point, tween, cmp} = MorphingAnim
										.createFlowingParticles(path, e.Visual.paras, scrpt.paras, e.FlowingPath.paras);
									e.Obj3.mesh.add(point);

									tween.easing(scrpt.paras.ease);
								}
							}
							else if (mtype === AnimType.U_PATH_MORPH) {
								var datum = findPath(ecs, scrpt);

								var {tween, cmp} = MorphingAnim.attachShaderPosTween(
												e.Obj3, datum, scrpt.paras, e.Visual.paras);
								tween.easing(scrpt.paras.ease);
							}
							else if (mtype === AnimType.U_PATHn_MORPH) {
								// refence to the path
								var datum = findPath(ecs, scrpt);
								var {tween, cmp} = MorphingAnim.attachShaderPosesTween(
												e.Obj3, datum, e.Visual.paras.follows, scrpt.paras, e.Visual.paras);
								tween.easing(scrpt.paras.ease);
							}
							else if (mtype === AnimType.U_NOW) {
								if (!e.Obj3.mesh || !e.Obj3.mesh.material) {
									throw new XError("Animizing U_NOW needing target Obj3 with mesh and material.\n"
										+ `e = ${e.id}, seqx = ${seqx}, seq = ${seq}`);
								}
								// This is a special type of tween - not exactly tweened
								e.Obj3.mesh.material.uniforms = Object.assign(
									e.Obj3.mesh.material.uniforms || new Object(),
									{ now: { value: 1.56 },
									  speedVert: { value: scrpt.paras.speed === undefined
										  			? [0.001] : [scrpt.paras.speed] },
									  speedFrag: { value: scrpt.paras.speed === undefined
										  			? [0.001] : [scrpt.paras.speed] } } );
								// Debug Note:
								// Add a stub - if cmp used by other branch, it's exists in a new loop.
								// Only script language do things like this?
								cmp = {};
							}
							else {
								console.error("Animizer.initTweens(): unrecognized AnimType: ",
									scrpt.mtype ? scrpt.mtype.toString(16) : 'undefined',
									`, entity id: ${e.id}`, e.ModelSeqs);
							}

							if (cmp) {
								cmps.unshift(cmp);
								cmp.parent = e.CmpTweens;
								cmp.seqx = seqx;

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

								if (twnx === 0 && scrpt.paras.start < Infinity
									&& tween && tween.start) { // FIXME U_NOW is not a tween
									// start 'started with'
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
				if (e.ModelSeqs && e.ModelSeqs.fFinished) {
					e.CmpTweens.eFinished = e.ModelSeqs.fFinished;
				}
				e.CmpTweens.endingFiring = new Array(e.ModelSeqs.script.length)
								.fill(false);
			}
		}

		function findPath(ecs, script) {
			var pathent = ecs.getEntity(script.paras.path);
			if (!pathent) {
				console.error('Can not find entity: ', script.paras.path);
				return;
			}
			return pathent.Obj3.datum;
		}
	}

	/** Current this doesn't actually updating anything.
	 * @param {number} tick
	 * @param {array} entities
	 * @member MorphingAnim#update
	 * */
	update(tick, entities) { }

	/**Create a moving points with tweened animation alone path. The points is a
	 * THREE.Points with material of THREE.ShaderMaterail (ShaderFlag = blinkStar).
	 *
	 * Design Notes: This can be decomposed to shater tweening and material creating
	 * - the correct way of new Twenn.js design.
	 * @param {array<THREE.Vector3>} path e.g. spline supporting positionAt()
	 * @param {object=} visparas parameters of Visual.paras
	 * @param {object=} scriparas parameters of ModelSeqs.paras
	 * @param {object=} pathparas parameters of FlowingPath.paras
	 * @return {object} {point: Mesh, tween: Tween, cmp: CmpTween}
	 * @member MorphingAnim.createFlowingParticles
	 */
	static createFlowingParticles(path, visparas = {}, scriparas = {}, pathparas = {}) {
		if (path) {
			var cmp = new Object();
			var {vertexShader, fragmentShader} = xglsl.xvShader(ShaderFlag.blinkStar, pathparas);
			var pointBuffer = new THREE.Vector3();
			// xglsl.pathPoints(path, paras, pointBuffer);
			cmp.onUpdateHandler = {onUpdate:
				function(obj, t) {
					xgeom.getPointAt(pointBuffer, path, obj.t);
					point.geometry.verticesNeedUpdate = true;
				}};
			var mat = new THREE.ShaderMaterial( {
				uniforms: {wpos: {value: pointBuffer}},
				vertexShader,
				fragmentShader,
				blending: THREE.AdditiveBlending,
				depthTest: true,
				transparent: true,
				// vertexColors: THREE.VertexColors
			} );
			var point = new THREE.Points(xglsl.pointGeom(pointBuffer), mat);
			point.geometry.verticesNeedUpdate = true;
			var t = {t: 0};
			var tween = TWEEN.Tween(cmp, t)
						.to({t: 1}, (pathparas.duration || scriparas.duration) * 1000 || cmp.duration || 1000)

			return {point, tween, cmp}
		}
		else console.error(
			'createFlowingPoints(): can\'t create points for undefined path');
	}

	/**Attatch a moving position with tweened animation alone the path to Obj3.mesh.
	 * The position is a THREE.Vector3 implanted into uniforms, which is supposed
	 * to be used by a shader like ShaderFlag.scaleOrb.
	 *
	 * Design Notes: This can be decomposed to shader tweening and material creating
	 * - the correct way of new Twenn.js design.
	 * @param {Obj3} obj3 e.Obj3
	 * @param {object.<{ref: object}>} refData target data, where ref = {path},
	 * currently only path with points array like been created by geom.generateWayxz.
	 * @param {object=} scriparas parameters of ModelSeqs.paras
	 * @param {object=} vparas parameters of FlowingPath.paras
	 * @return {object} {tween: Tween, cmp: CmpTween}
	 * @member MorphingAnim.attachShaderPosTween
	 */
	static attachShaderPosTween(obj3, refData, scriparas = {}, vparas = {}) {
		// my ref
		obj3.datum = Object.assign( obj3.datum || new Object(), {ref: refData} );

		var cmp = new Object();

		if (obj3.geom === Obj3Type.MapXZRoad) {
			// path points is a Float32Array, see geom.generateWayxz() => points
			cmp.onUpdateHandler = {onUpdate: function(obj, t, cmp, e) {
				if (obj3.datum.ref) {
					var path = obj3.datum.ref.path.points;
					if (obj3.datum && obj3.datum.path
						&& e.Obj3 && e.Obj3.mesh && e.Obj3.mesh.geometry) {
						// wpos is initialized by xglsl.formatUniforms(shader = worldOrbs)
						var mesh = e.Obj3.mesh;
						var p = mesh.material.uniforms.wpos.value;
						xgeom.getWayPointAt(p, undefined, path, obj.t);
						mesh.geometry.verticesNeedUpdate = true;
					}
				}
			}};
		}
		else {
			cmp.onUpdateHandler = {onUpdate: function(obj, t, cmp, e) {
				if (e.Obj3.datum && e.Obj3.datum.ref && e.Obj3.datum.ref.path) {
					var path = e.Obj3.datum.ref.path;
					if (e.Obj3 && e.Obj3.mesh && e.Obj3.mesh.geometry)
						// TODO TO BE TESTED
						var mesh = e.Obj3.mesh;
						var p = mesh.material.uniforms.wpos.value;
						xgeom.getPointAt(p, path.points, obj.t);
				}
			}};
		}
		var t = {t: 0};
		var tween = TWEEN.Tween(cmp, t)
					.to({t: 1}, scriparas.duration * 1000 || cmp.duration)

		return {tween, cmp};
	}

	/**Attatch moving positions with tweened animation alone the path to Obj3.mesh.
	 * The positions are a THREE.Vector3 array implanted into uniforms, which is
	 * supposed to be used by a shader like ShaderFlag.scaleOrb. Each position in
	 * the array is added with offset configured with argument follows.
	 *
	 * Design Notes: This can be decomposed to shader tweening and material creating
	 * - the correct way of new Twenn.js design.
	 * @param {Obj3} obj3 e.Obj3
	 * @param {object.<{ref: object}>} refData see {@link .attachShaderPosTween}
	 * @param {array.<{number}>} follows orb distance following moving direction
	 * @param {object=} paras parameters of ModelSeqs.paras
	 * @param {object=} vparas parameters of FlowingPath.paras
	 * @return {object} {tween: Tween, cmp: CmpTween}
	 * @member MorphingAnim.attachShaderPosTween
	 */
	static attachShaderPosesTween(obj3, refData, follows, scriparas = {}, vparas = {}) {
		// my ref
		obj3.datum = Object.assign( obj3.datum || new Object(), {ref: refData} );

		var cmp = new Object();

		cmp.onUpdateHandler = {onUpdate: function(obj, t, cmp, e) {
			if (obj3.datum.ref) {
				var path = obj3.datum.ref.path.points;
				// u_t, wpos & follows are initialized by xglsl.formatUniforms(shader = orbGroups)
				if (e.Obj3 && e.Obj3.mesh && e.Obj3.mesh.geometry) {
					var mesh = e.Obj3.mesh;
					mesh.material.uniforms.u_t.value = obj.t;
					var wpos = mesh.material.uniforms.wpos.value;
					var wtan = mesh.material.uniforms.wtan.value;
					var follows = mesh.material.uniforms.follows.value;
					for (var ix = 0; ix < wpos.length; ix++) {
						xgeom.getWayPointAt(wpos[ix], wtan[ix], path,
							Math.max(0, Math.min(obj.t - follows[ix] / 100, 1)) );
					}
				}
			}
		}};

		// var t = {t: 0};
		var tmin = 0, tmax = 1;
		for (var f of follows) {
			f /= 100;
			if (f < 0 && f < tmin)
				tmin = f;
			else if (f > 0 && (1 + f) > tmax)
				// a 60 follower makes tweening range (0, 1.6)
				tmax = 1 + f;
		}
		var t = {t: tmin};
		var tween = TWEEN.Tween(cmp, t)
					.to({t: tmax},
					scriparas.duration * 1000 || cmp.duration)

		return {tween, cmp};
	}

	/**Helper for Changing AnimType.POSITION's target position - first translate
	 * transform in the sequence<br>
	 * **Note** This method shouldn't been called during tween is playing. Results
	 * is unkown.<br>
	 *
	 * @param {array<CmpTween>} seq animation sequence index
	 * @param {array|vec3} pos target position
	 * @member MorphingAnim.set1stPos
	 * @function
	 */
	static set1stPos (seq, pos) {
		if (seq && seq.length > 0)
			for (const twn of seq)
				if (twn.affines)
					for (const aff of twn.affines) {
						if (aff.interpos.positions) {
							aff.interpos.positions[1].set(pos);
							return;
						}
					}
	}

	/**Helper for Changing target scale - first scale transform in the sequence<br>
	 * **Note** This method shouldn't been called during tween is playing. Results
	 * is unkown.<br>
	 *
	 * @param {array<CmpTween>} seq animation sequence index
	 * @param {array|vec3} pos target position
	 * @member MorphingAnim.set1stScale
	 * @function
	 */
	static set1stScale (seq, scl) {
		if (seq && seq.length > 0)
			for (const twn of seq)
				if (twn.affines)
					for (const aff of twn.affines) {
						if (aff.interpos.scale) {
							aff.interpos.scale[1].set(scl);
							return;
						}
					}
	}

	/**Helper for Changing AnimType.POSITION's target position - first translate
	 * transform in the sequence. The previous position will be pushed to starting
	 * position, i.e. pos[0] = pos[1]; pos[1] = pos<br>
	 * **Note** This method shouldn't been called during tween is playing. Results
	 * is unkown.<br>
	 *
	 * @param {array<CmpTween>} seq animation sequence index
	 * @param {number} twidx tween index in a sequence
	 * @param {array|vec3} pos target position
	 * @member MorphingAnim.set1stPos
	 * @function
	 */
	static addPos (seq, twidx, pos) {
		if (seq && seq.length > twidx) {
			const twn = seq[twidx];
				if (twn.affines)
					for (const aff of twn.affines) {
						if (aff.interpos.positions) {
							aff.interpos.positions[0].set(aff.interpos.positions[1]);
							aff.interpos.positions[1].add(pos);
							return;
						}
					}
		}
	}

	/**Helper for Changing target scale - first scale transform in the sequence.
	 * The previous scale is pushed into scale[0], then scale[1] = scl.<br>
	 * **Note** This method shouldn't been called during tween is playing. Results
	 * is unkown.<br>
	 *
	 * @param {array<CmpTween>} seq animation sequence index
	 * @param {number} twidx tween index in a sequence
	 * @param {array|vec3} scl target position
	 * @member MorphingAnim.set1stScale
	 * @function
	 */
	static scaleTo (seq, twidx, scl) {
		if (seq && seq.length > twidx) {
			const twn = seq[twidx];
			if (twn.affines)
				for (const aff of twn.affines) {
					if (aff.interpos.scale) {
						aff.interpos.scale[0].set(aff.interpos.scale[1]);
						aff.interpos.scale[1].mul(scl);
						return;
					}
				}
		}
	}

	/**Helper for rotation.
	 *
	 * The previous angle is pushed into deg[0], then deg[1] = deg.<br>
	 * **Note** This method shouldn't been called during tween is playing. Results
	 * is unkown.<br>
	 *
	 * @param {array<CmpTween>} seq animation sequence index
	 * @param {number} twidx tween index in a sequence
	 * @param {number} deg target angle, in degree
	 * @member MorphingAnim.addAngle
	 * @function
	 */
	static addAngle(seq, twidx, deg) {
		if (seq && seq.length > twidx) {
			const twn = seq[twidx];
			if (twn.affines) {
				for (const aff of twn.affines) {
					if(aff.interpos.rotate) {
						var r = aff.interpos.rotate;
						r.deg[0] = r.deg[1];
						if(r.deg[0] >= 360) {
							r.deg[0] = r.deg[0] - 360;
						}
						deg = deg % 360;
						r.deg[1] = r.deg[0] + deg;
					}
				}
			}
		}
	}

	/**Change (thermal) tiles' animation group. This method is appliable to shaders
	 * supporting uniform morflag array, e.g. thermal morphing shader created by
	 * {@link xglsl.thermalTile()}.
	 *
	 * (Animation controlled by Uniform can be changed at anytime)
	 * @param {Obj3} obj3 change the obj's mesh.material.uniforms.morflag[g] = flag
	 * @param {int} g group index
	 * @param {object.<{vert: number, frag: number}>} speed of vertex & fragment shader
	 * @member MorphingAnim.setGroupSpeed
	 * @function
	 */
	static setGroupSpeed(obj3, g, speed) {
		if (obj3.mesh && obj3.mesh.material && obj3.mesh.material.uniforms) {
			var us = obj3.mesh.material.uniforms;
			if (us.speedVert)
				us.speedVert.value[g] = speed.vert;
			if (us.speedFrag)
				us.speedFrag.value[g] = speed.frag;
		}
	}

	/**
	 * Convert script value to THREE.Uniforms format (properties are {value} object).
	 * <br>If properties of svals is an array, only it's first value are used as the
	 * uniforms value - required by Tween.
	 * @param {object} svals script values
	 * @param {Obj3} uniforms buffer
	 * @return {object} {start: svals_i[0], to: value: svals_i[1]}<br>
	 * uniforms for THREE.Mesh - properties are in format of name: {value}
	 * @member MorphingAnim.script2uniforms
	 * @function
	 */
	static script2uniforms(svals, uniforms) {
		var u = new Object();
		var v = new Object();
		for (var p in svals) {
			if (Array.isArray(svals[p])) {
				u[p] = {value: svals[p][0]};
				v[p] = {value: svals[p][1]};
			}
			else if (typeof svals[p] === 'number') {
				u[p] = {value: svals[p]};
				v[p] = {value: svals[p]};
			}
			else throw XError(`MorphingAnim.script2uniforms(): can't convert vals to uniforms: svals[${p}]: ${svlas[p]}`);
		}
		uniforms = Object.assign(uniforms || new Object(), u);
		return {start: uniforms, to: v};
	}
}

MorphingAnim.query = { iffall: iffModel };

export { MorphingAnim }

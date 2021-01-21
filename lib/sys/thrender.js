
import * as THREE from '../../packages/three/three.module-MRTSupport'

import {glConfig} from '../xutils/shaders/glx.glsl';

import { Filterenderer } from '../../packages/three/core/filterenderer'
import { BokehShader } from '../../packages/three/shaders/BokehShader2';
import {Reflector} from '../../packages/three/core/Reflector'
import {EXRLoader} from '../../packages/three/EXRLoader'

import * as ECS from '../../packages/ecs-js/index'

import {XError, ramTexture, paths} from '../xutils/xcommon'
import AssetKeepr from '../xutils/assetkeepr'
import {x} from '../xapp/xworld'
import {AssetType, ShaderFlag} from '../component/visual'
import {Obj3Type} from '../component/obj3'
import * as xutils from '../xutils/xcommon'
import * as xglsl from '../xutils/xglsl'
import GlUniform from '../xutils/gluniform'
import {vec3, mat4} from '../xmath/vec'
import xmath from '../xmath/math'
import xgeom from '../xmath/geom'
import {TWEEN} from './tween/xtweener'

const any = ['Obj3'];

const __tex0__ = AssetKeepr.loadTexure('data:application/x-visual+img,gray-pixel');

/**@class Thrender
 * @classdesc
 * X renderer of ecs subsystem based on Three.js renderer.
 */
export default class Thrender extends ECS.System {
	/**
	 * @param {ECS} ecs
	 * @param {x} x {options, ...}
	 * @constructor Thrender */
	constructor(ecs, x) {
		super(ecs);
		x.xthrender = this;
		this._v3 = new THREE.Vector3();
		this._m4 = new THREE.Matrix4();
		this.ecs = ecs;
		var container = x.container;
		var scn;
		if (typeof container === 'object') {
			var resltx = this.init(container, x)
			scn = resltx.scene;
			this.light = resltx.light; // TODO probably we need another system
			x.light = this.light.options;
		}
		else {
			if (x.log >= 5)
				console.warn('[5] Sys.Thrender: container canvas is incorrect, renderer not initialized. Testing? ')
			else throw new XError('Thrender(): To initialize Thrender, a renderer must been created.');
		}

		// init Obj3 objects ( should be covered by mocha )
		// Business entities like created by Cubesys hasn't been visualized here yet,
		// but will present later when updating.
		var obj3Ents = ecs.queryEntities({any: any, hasnt: ['HudGroup', 'HudChild']});
		Thrender.createObj3s(ecs, scn, this.light.options, x.options.camera, obj3Ents);
	}

	/**Create three.js Object3D
	 *
	 * - create mesh with geometry of Obj3.geom (e.g Obj3Type.BOX).
	 * @param {ECS} ecs
	 * @param {THREE.Scene} scene
	 * @param {object} light light options
	 * @param {object} camera camera options
	 * @param {Array.<Entity>} entities
	 * @member Thrender.createObj3s
	 * @function
	 */
	static createObj3s(ecs, scene, light, camera, entities) {
		// var mes = [];
		entities.forEach(function(e, x) {
			// A typicall orghogonal handling process should be blocks one after another,
			// like material, an generalized case of alp
			let tex, mat;

			// 1. uniforms
			// 1.1 paras for uniforms
			// var uniforms = new Object();
			let uniforms;
			// 1.2 shader's uniforms
			if ( ! e.Visual.material && e.Visual.shader
				// reflectex is a special material + shader ported from Three.js example,
				// Visaul.shader can be ignored
				|| e.Visual.vtype === AssetType.reflectex
				|| e.Visual.vtype === AssetType.reflector3js ) {
				uniforms = GlUniform.init(e.Visual, e.Obj3, light, camera, ecs);
			}
			// 2. TODO merge material handling

			// common paras section
			// FIXME alp is deprcated by xglsl.formatUniforms()
			// - in fact, uniforms should been handled here
			// var alp = e.Visual.paras !== undefined && e.Visual.paras.tex_alpha !== undefined ?
			// 	e.Visual.paras.tex_alpha : 1;
			let alp = GlUniform.uAlpha(e.Visual.paras);

			// tolerate API design error - Visual.asset will be deprecated
			if ((!e.Visual.paras || !e.Visual.paras.u_tex) && e.Visual.asset)
				e.Visual.paras = Object.assign( {u_tex: [e.Visual.asset]}, e.Visual.paras );

			// if (e.Visual.paras && e.Visual.paras.shadowSide !== undefined)
			// 	shadowSide = e.Visual.paras.shadowSide;
			let shadowSide = GlUniform.uShadowSide(e.Visual.paras);


			if (!e.Obj3.datum)
				e.Obj3.datum = new Object();

			// create mesh of AssetType
			switch (e.Visual.vtype) {
				case AssetType.UserMesh:
					// nothing to do
					addObj3(scene, e.Obj3.mesh, e);
					break;
				case AssetType.Extension:
					// some extesion like Canvtex (x-visual v0.3) will handle this
					var g = new THREE.Group();
					// e.Obj3.mesh = g;
					addObj3(scene, g, e);
					break;
				case AssetType.gltf:
					if (!e.Visual.asset)
						throw new XError('Thrender: AssetType.gltf needs Visual.asset parameter.');
					else if (e.Visual.paras && e.Visual.paras.nodes) {
						var nds = e.Visual.paras.nodes;
						if (typeof nds === 'string')
							nds = [nds]
						AssetKeepr.loadGltfNodes(e.Obj3, `assets/${e.Visual.asset}`,
							nds,
							(nodes) => {
								// Too late to push mesh into mes now, add to scene directly
								if (scene && nodes) {
									for (var n of nodes) {
										if (e.Obj3 && e.Obj3.transform) {
											var m4 = new mat4();

											if (e.Visual.paras && e.Visual.paras.withTransform) {
												// Debug Notes:
												// Looks like node's matrix is not the same Matrix in THREE.Matrix used by mat4.
												// n.matrix instanceof THREE.Matrix4 == false
												// But why?
												// 2020.05.17: Is this the asynchronous issue?
												if (typeof n.updateMatrix === 'function')
													n.updateMatrix();
												m4.setByjs(n.matrix);
											}

											for (var trs of e.Obj3.transform)
												m4.appAffine(trs);

											n.matrixAutoUpdate = false;
											m4.put2js(n.matrix);
										}
										e.Obj3.mesh = n;
										scene.add(n);
									}
								}
							});
					}
					else
						AssetKeepr.loadGltf(scene, e.Obj3, `assets/${e.Visual.asset}`);
					break;
				case AssetType.DomCanvas:
					// create texture of canvas
					AssetKeepr.loadCanvtex2(e.Canvas, e.Canvas.options);
					tex = e.Canvas.tex; // should be undefined now

					var side = !e.Visual.paras || e.Visual.paras.side === undefined
								? THREE.DoubleSide : e.Visual.paras.side;

					mat = new THREE.MeshBasicMaterial({
							isMrt: true,
							opacity: alp,
							// debug note!!! This map must created here for later changing
							// map: new THREE.CanvasTexture(document.getElementById(e.Canvas.domId)),
							map: new ramTexture(4, 4, {alpha: 0.5}),

							transparent: true,
							side,
							shadowSide,
						});
					var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
					// can not been used for rendering until html canvas texture is ready,
					// when Canvas.dirty = true
					m.visible = false;
					addObj3(scene, m, e);
					break;
				case AssetType.mesh:
				case AssetType.mesh_basic:
					if (!e.Visual.material) {
						// FIXME material should handled in orthogonal fashion.
						if (e.Visual.shader) {
							// create ShaderMaterial
							mat = Thrender.createXShaderMaterial(e.Visual.shader,
										uniforms, e.Visual.paras, e.Obj3, ecs);
						}
						else {
							var def = { isMrt: true };
							if (e.Visual.asset)
								def.map = AssetKeepr.loadTexure( e.Visual.asset, function() {
									let def_ = def;
									return (texture) => {
										texture.needsUpdate = true;
										def_.map = texture;
									}
								}() );
							else // in case of test and default
								def.map = new ramTexture(4, 4, {alpha: alp});

							var side = !e.Visual.paras || e.Visual.paras.side === undefined
										? THREE.DoubleSide : e.Visual.paras.side;
							var alphaMap = e.Visual.paras && e.Visual.paras.enableAlphaMap ?
										def.map : undefined;
							var blending = e.Visual.paras && e.Visual.paras.blending !== undefined ?
										e.Visual.paras.blending : undefined;

							def = Object.assign( def, {
									opacity: alp,
									transparent: true,
									side,
									shadowSide,
									depthWrite: true,
									depthTest: true } );

							if ( alphaMap ) def.alphaMap = alphaMap;
							if ( blending !== undefined ) def.blending = blending;

							if (e.Visual.paras && e.Visual.paras.color)
								Object.assign (def, {color: e.Visual.paras.color});

							if (e.Visual.vtype === AssetType.mesh)
								mat = new THREE.MeshPhongMaterial(def);
							else // mesh_basic
								mat = new THREE.MeshBasicMaterial(def);
							mat.uniforms = Object.assign(mat.uniforms || new Object(), uniforms);

							Thrender.resolveEnvMap(e.Visual.paras, mat, ecs);
						}
					}

					var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat, e.Visual);
					addObj3(scene, m, e);
					break;
				case AssetType.wireframe:
					var def = {
							isMrt: true,
							opacity: alp,
							transparent: true,
							wireframe: true,
							depthWrite: true,
							depthTest: true,// - for transparent
					};

					if (e.Visual.paras && e.Visual.paras.color)
						Object.assign (def, {color: e.Visual.paras.color});

					mat = e.Visual.material || new THREE.MeshBasicMaterial(def);
					Object.assign(mat, uniforms);

					var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
					addObj3(scene, m, e);
					break;
				case AssetType.point:
					// use Obj3.geom vertices as points
					if (!e.Visual.asset) {
						var modp = e.Visual.paras;
						mat = e.Visual.material
							|| new THREE.ShaderMaterial( { uniforms: GlUniform.obj2uniforms(uniforms) } );
						var mesh = Thrender.createObj3points(e.Obj3,
								e.Obj3.geom ? e.Obj3.geom : Obj3Type.SPHERE, mat);

						addObj3(scene, mesh, e);
					}
					// load model as points
					else if (e.Visual.asset) {
						if (e.Visual.paras.nodes) {
							AssetKeepr.loadGltfNodes(e.Obj3, `assets/${e.Visual.asset}`,
								e.Visual.paras.nodes,
								(nodes) => {
									// change gltf vertices to points buffer
									var m = Thrender.combineGltfPoints(e.Obj3, nodes, e.Visual.paras);
									e.Obj3.mesh = Thrender.applyTransform(m, e.Obj3.transform);

									// Too late to push mesh into mes now, add to scene directly
									addObj3(scene, m, e);
								});
						}
						else
							AssetKeepr.loadGltf(scene, e.Obj3, `assets/${e.Visual.asset}`,
								(scenes) => {
									var nodes;
									if (scenes.scene) nodes = scenes.scene.children;
									if (!nodes) {
										console.error ('No nodes found in gltf assets', e.Visual.asset);
									}
									else {
										// change gltf vertices to points buffer
										var grp = Thrender.replaceMaterials(nodes, e.Visual.paras);
										e.Obj3.mesh = Thrender.applyTransform(grp, e.Obj3.transform);

										// Too late to push mesh into mes now, add to scene directly
										addObj3(scene, grp, e);
									}
								});
					}
					break;
				case AssetType.refPoint:
				case AssetType.cubeVoxel:
					let eref = ecs.getEntity(e.Visual.asset);
					if (!eref) {
						console.error('Thrender.createObj3s(): can\'t find referenced entity: ',
								e.Visual.asset);
					}
					else if (!eref.Obj3.mesh) {
						console.error('Thrender.createObj3s(): can\'t find referenced entity mesh: ',
								e, eref);
					}
					// xglsl create Obj3 particles
					else {
						var pointMesh;
						if (e.Visual.vtype === AssetType.refPoint)
							pointMesh = Thrender.createObj3particles(e.Obj3, eref.Obj3.mesh, e.Visual);
						else if (e.Visual.vtype === AssetType.cubeVoxel)
							pointMesh = Thrender.createCubeVoxel(e.Obj3, e.Visual);
						else throw new XError("shouldn't reaching here!");
						e.Obj3.mesh = pointMesh;

						addObj3(scene, pointMesh, e);
					}
					break;
				case AssetType.GeomCurve:
					// var {curve, path} = Thrender.createCurve(e.Obj3, e.Visual.paras);
					// addObj3(scene, curve, e);
					mat = Thrender.xlineMaterial(uniforms, e.Visual.paras);
					var {curve, path} = Thrender.createObj3Line(e.Obj3, e.Visual.paras, mat);
					addObj3(scene, curve, e);
					e.Obj3.datum.path = path;
					break;
				case AssetType.DynaSects:
					// TODO: this branch shows the only difference of DynaSects with GeomCurve is geometry type.
					// var {group, points} = Thrender.createDynaSects(e.Obj3, e.Visual.paras);
					mat = Thrender.xlineMaterial(uniforms, e.Visual.paras);
					var {curve, points} = Thrender.createObj3Line(e.Obj3, e.Visual.paras, mat);
					e.Obj3.mesh = curve;
					if (!e.Obj3.datum)
						e.Obj3.datum = new Object();
					e.Obj3.datum.points = points;
					addObj3(scene, curve, e);
					break;
				case AssetType.PathTube:
					if (!e.Visual.material) {
						// FIXME material should handled in orthogonal fashion.
						// FIXME see also createObj3particles(), AssetType.mesh
						if (e.Visual.shader) {
							// create ShaderMaterail
							mat = Thrender.createXShaderMaterial(e.Visual.shader, uniforms, e.Visual.paras, e.Obj3);
						}
						else {
							var def = { isMrt: true };
							if (e.Visual.asset)
								def.map = AssetKeepr.loadTexure( e.Visual.asset, function() {
									let def_ = def;
									return (texture) => {
										texture.needsUpdate = true;
										def_.map = texture;
									}
								}() );
							else // in case of test and default
								def.map = new ramTexture(4, 4, {alpha: alp});
							var side = !e.Visual.paras || e.Visual.paras.side === undefined
										? THREE.DoubleSide : e.Visual.paras.side;
							var alphaMap = e.Visual.paras && e.Visual.paras.enableAlphaMap ?
										def.map : undefined;
							def = Object.assign(def, {
									// map: tex,
									alphaMap,
									opacity: alp,
									side,
									shadowSide,
									transparent: true,
									depthWrite: true,
									depthTest: true,
									blending: THREE.AdditiveBlending } );

							if (e.Visual.paras && e.Visual.paras.color)
								Object.assign (def, {color: e.Visual.paras.color});

							if (e.Visual.vtype === AssetType.mesh)
								mat = new THREE.MeshPhongMaterial(def);
							else // mesh_basic
								mat = new THREE.MeshBasicMaterial(def);
							mat.uniforms = Object.assign(mat.uniforms || new Object(), uniforms);
						}
					}
					if (e.Visual.paras && e.Visual.paras.nodes) {
						// TODO branch canvasys task: svg path
						// TODO branch canvasys task: svg path
						// TODO branch canvasys task: svg path
						// TODO branch canvasys task: svg path
						Thrender.svgPathTube(e.Obj3, e.Visual.paras, mat,
							(meshes, group, paths) => {
								if (e.ModelSeqs) {
									if (!e.Obj3.datum)
										e.Obj3.datum = new Object();
									e.Obj3.datum.paths = paths;
								}

								addObj3(scene, group, e);
							});
					}
					else {
						// path from Visual.points
						var {mesh, path} = Thrender.createPathTube(e.Obj3, e.Visual.paras, mat);
						if (!!e.Obj3.invisible) tube.visible = false;
						addObj3(scene, mesh, e);

						// Design MEMO
						// what's the better practice for this in ECS pattern?
						e.Obj3.datum.path = path;
					}
					break;
				case AssetType.Arrow:
					var dir = new THREE.Vector3( e.Visual.paras.dir[0],
								e.Visual.paras.dir[1], e.Visual.paras.dir[2]);
					var org = new THREE.Vector3( e.Visual.paras.origin[0],
								e.Visual.paras.origin[1], e.Visual.paras.origin[2]);
					/*
					ArrowHelper(dir : Vector3, origin : Vector3, length : Number, hex : Number, headLength : Number, headWidth : Number )
					dir -- direction from origin. Must be a unit vector.
					origin -- Point at which the arrow starts.
					length -- length of the arrow. Default is 1.
					hex -- hexadecimal value to define color. Default is 0xffff00.
					headLength -- The length of the head of the arrow. Default is 0.2 * length.
					headWidth -- The width of the head of the arrow. Default is 0.2 * headLength.
					*/
					var a = new THREE.ArrowHelper( dir, org,
								e.Visual.paras.length, e.Visual.paras.color,
							 	e.Visual.paras.headLength, e.Visual.paras.headWidth);
					e.Obj3.mesh = a;
					addObj3(scene, a, e);
					break;
				case AssetType.skyBox:
					mat = Thrender.create3Material(uniforms, e.Visual.vtype,
							e.Visual.paras, e.Obj3, scene);
					//var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat, e.Visual);
					// addObj3(scene, m, e);
					scene.background = mat.map;
					scene.background.isEquirect = mat.isEquirect;
					// var ambient = new THREE.AmbientLight( 0xff0000 );
					// scene.add( ambient );
					break;
				case AssetType.reflector3js:
					var g = Thrender.geometryCase(e.Obj3.geom, e.Obj3.box,
									e.Visual.paras, e.Obj3);
					var m = new Reflector( g, { isMrt: true } );
					e.Obj3.mesh = m;
					addObj3(scene, m, e);
					break;
				case AssetType.reflectex:
					var g = Thrender.geometryCase(e.Obj3.geom, e.Obj3.box,
									e.Visual.paras, e.Obj3);
					var shader = xglsl.xvShader( ShaderFlag.reflectex, e.Visual.paras );
					var m = new Reflector( g, {
								isMrt: true,
								shader,
								receiveShadow: e.Obj3.mesh.receiveShadow } );
					// otherwise WebGLRenderer.initMaterial won't set light uniforms
					m.material.lights = true;
					Object.assign(m.material.uniforms, uniforms);

					// var m = new Reflector(g);
					e.Obj3.mesh = m;
					addObj3(scene, m, e);
					break;
				default:
					console.error('TODO AssetType: ', e.Visual.vtype);
			}

			Thrender.applyTransform(e.Obj3.mesh, e.Obj3.transform);

			if (Array.isArray(e.Obj3.channels)) {
				// e.Obj3.mesh.layers = 1;
				for (var ch of e.Obj3.channels) {
					e.Obj3.mesh.layers.enable( ch );
				}
			}
		});

		function addObj3(scene, mesh, e) {
			if (scene) {
				scene.add(mesh);
				if ( e.Obj3 && (!e.Obj3.mesh
					|| !e.Obj3.mesh.matrix && !e.Obj3.mesh.material) )
					e.Obj3.mesh = Object.assign(mesh, e.Obj3.mesh);

				if (e.Obj3.group) {
					const g = ecs.getEntity(e.Obj3.group);
					if (g.Obj3.mesh)
						g.Obj3.mesh.add(mesh);
					else {
						console.error('Can not find entity\'s parent group: ', e);
						console.error('x-visual can only add child to parent that already has been created.');
					}
				}
				else {
					if (mesh.type === 'Group')
						mesh.xscene = scene; // for convenience laterly
				}
			}
			else if (x.log >= 5) { // testing
				console.warn('[5] undefined scene with Obj3 meshes: ', mes.length);
			}
		}
	}

	/**Set affine transform to mesh's local matrix.
	 * @param {THREE.Mesh} mesh
	 * @param {array} transf transformations
	 * @return {THREE.Mesh} mesh
	 * @member Thrender.applyTransform
	 * @function
	 */
	static applyTransform (mesh, transf) {
		if (mesh && transf) {
			var m4 = new mat4();
			for (var trs of transf)
				m4.appAffine(trs);

			mesh.matrixAutoUpdate = false;

			m4.put2js(mesh.matrix);
		}
		return mesh;
	}

	static resolveEnvMap (vparas, mat, ecs) {
		if (vparas && vparas.envMap) {
			let eref = ecs.getEntity(vparas.envMap);
			if (eref) {
				if (eref.Obj3.datum.env) {
					mat.envMap = eref.Obj3.datum.env;
					mat.uniforms.envMap = { value: eref.Obj3.datum.env };
				}
				else {
					if (!eref.Obj3.datum.registers)
						eref.Obj3.datum.registers = [];
					eref.Obj3.datum.registers.push(mat);
				}
			}
			else
				console.warn ('[3] referencing undefined envMap entity.',
					'Tip: referenced and referencing objects\' creating order matter');
		}
	}

	/**
	 * @param {ShaderFlag} shaderflag
	 * @param {object} uniforms Mesh.material.uniforms
	 * @param {object} vparas visual paras
	 * @param {Obj3} obj3 Entity Obj3
	 * @return {THREE.ShaderMaterial} material for x-shaders
	 * @member Thrender.createXShaderMaterial
	 * @function
	 */
	static createXShaderMaterial( shaderflag, uniforms = {}, vparas, obj3, ecs ) {
		if (shaderflag === ShaderFlag.colorArray) {
			if (vparas && vparas.u_texWeight !== undefined) {
				uniforms.u_texWeight = {value: vparas.u_texWeight};
			}

			if (vparas && vparas.colors && vparas.colors.length > 0) {
				var clrs = [];
				for (var i = 0; i < vparas.colors.length; i++) {
					clrs.push( new THREE.Vector3(...vparas.colors[i]) );
				}
				uniforms.u_colors = {value: clrs};
			}
			// TODO merge with GlUniform .init()
			if (vparas && vparas.u_tex && vparas.u_tex.length > 0) {
				var texs = [];
				for (var i = 0; i < vparas.u_tex.length; i++) {
					var tex = new ramTexture( i + 1, i + 1, { alpha: 0.5 } );
					// suppres RanderPass warning - but not working
					tex.needsUpdate = false;
					texs.push( tex );

					AssetKeepr.loadTexure( vparas.u_tex[i],
						( function() {
							var j = i;
							return (texture) => {
								texture.needsUpdate = true;
								texs[j] = texture;
							}
						} )() );
				}
				uniforms.u_tex = { value: texs };

				if (!vparas || !vparas.colors || vparas.colors.length === 0) {
					// no diffuse colors
					vparas.colors = [[0, 0, 0]];
					uniforms.u_texWeight = {value: 1};
				}
			}
		}

		if ( obj3.mesh && obj3.mesh.receiveShadow )
			vparas.dirShadow = true;
		let {vertexShader, fragmentShader} = xglsl.xvShader( shaderflag, vparas );

		let side = !vparas || vparas.side === undefined
					? THREE.FrontSide : vparas.side;

		// TODO should this been moved to GlUniform?
		if ( obj3.mesh && obj3.mesh.receiveShadow ) {
			// Three.js directional light and map co-orperate with a few special
			// materials' uniforms
			uniforms = Object.assign(uniforms, THREE.ShaderLib.shadow.uniforms);

			delete uniforms.vertexShader;
			delete uniforms.fragmentShader;
		}

		let mat = new THREE.RawShaderMaterial ( {
			glslVersion: THREE.GLSL3,
			uniforms,
			vertexShader,
			fragmentShader,
			depthTest: true,
			transparent: true,
			depthWrite: true,
			side,
			shadowSide: vparas && vparas.shadowSide !== undefined ?
				vparas.shadowSide : THREE.BackSide,
		} );

		// This makes renderer update object's shadow map
		// see WebGLRenderer.materialNeedsLights() called by initMaterial()
		if ( obj3.mesh && obj3.mesh.receiveShadow )
			mat.lights = true;

		if (shaderflag === ShaderFlag.discard)
			// Debug Notes: avoid error message:
			// glDrawElements "buffer format and fragment output variable type incompatible"
			// see
			// https://stackoverflow.com/questions/57535605/three-js-custom-shader-error-on-chrome-gl-invalid-operation-active-draw-buffers
			// https://github.com/mrdoob/three.js/issues/17805
			mat.colorWrite = false;

		Thrender.resolveEnvMap(vparas, mat, ecs);
		return mat;
	}

	// TODO merge with mesh branch after debugged
	static create3Material(uniforms = {}, vtype, vparas, obj3, scene) {
		let def = {isMrt: true};
		let u_tex = GlUniform.uTex(vparas);

		def.map = GlUniform.tex0();

		let side = !vparas || vparas.side === undefined
					? THREE.DoubleSide : vparas.side;
		let alphaMap = vparas && vparas.enableAlphaMap ?
					def.map : undefined;
		let blending = vparas && vparas.blending !== undefined ?
					vparas.blending : undefined;
		let alp = GlUniform.uAlpha(vparas);
		let shadowSide = GlUniform.uShadowSide(vparas);

		def = Object.assign( def, {
				opacity: alp,
				transparent: true,
				side,
				shadowSide,
				depthWrite: true,
				depthTest: true } );

		if ( alphaMap ) def.alphaMap = alphaMap;
		if ( blending !== undefined ) def.blending = blending;

		if (vparas && vparas.color)
			Object.assign (def, {color: vparas.color});

		let mat;

		if (vtype === AssetType.mesh)
			mat = new THREE.MeshPhongMaterial(def);
		else if (vtype === AssetType.skyBox) {  // cub texture
			mat = new THREE.MeshBasicMaterial(def);
			if (Array.isArray(u_tex) && u_tex.length > 1) {
				obj3.datum.flipx = -1;
				let textureCube = new THREE.CubeTextureLoader().load(u_tex);
				textureCube.format = THREE.RGBFormat;
				textureCube.mapping = THREE.CubeReflectionMapping;
				textureCube.encoding = THREE.sRGBEncoding;

				scene.background = textureCube;
				obj3.datum.env = textureCube;
				mat.map = textureCube;
			}
			else { // Equirectangle
				mat.isEquirect = true;
				obj3.datum.flipx = 1;
				let pth = paths(u_tex);
				if (AssetKeepr.isExr(pth)) { // exr
					new EXRLoader()
						// .setDataType( THREE.FloatType )
						.load( pth, onEnvLoad(scene, obj3, mat, def));
				}
				else { // pic
					let loader = new THREE.TextureLoader();
					let texture = loader
						.load( pth, onEnvLoad(scene, obj3, mat, def));
				}
			}
		}
		else // mesh_basic
			mat = new THREE.MeshBasicMaterial(def);

		mat.uniforms = Object.assign(mat.uniforms || new Object(), uniforms);
		return mat;

		function onEnvLoad(scene, obj3, mat, matDef) {
			let _obj3 = obj3;
			let _def = matDef;
			let _mat = mat;
			let _scene = scene;
			return function ( rt ) {

				/* mipmpa is neccesary for LOD, used for roughness
				 * only mipmap with correct min-filter can be enabled.
				 * See three.js docs: https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.envMap
				 * disscussion: https://discourse.threejs.org/t/using-mipmaps-with-datatexture/5748
				 * and https://github.com/mrdoob/three.js/issues/11452 */
				rt.isEquirect = true;
				rt.minFilter = THREE.LinearMipmapLinearFilter ;
				rt.generateMipmaps = true;

				if (_scene)
					_scene.background = rt;

				_obj3.datum.env = rt.texture;
				if (_obj3.datum.registers) {
					for (let mt of _obj3.datum.registers) {
						mt.uniforms.envMap = { value: rt };
						mt.needsUpdate = true;
					}
				}
			}
		}
	}

	/**Create a line material either one of xv.ShaderFlag.colorLine or the THREE.
	 * LineDashedMaterial, depends on wither dashSize or gapSize presented in vparas.
	 *
	 * Three.js LineBasicMaterial opacity works but has issues. We tried and seems
	 * it's not transparent. See also <a href='https://discourse.threejs.org/t/change-opacity-using-fat-lines-example/5523/7'>
	 * discussion: Change opacity using fat lines example for line opacity</a>
	 * @param {object} uniforms
	 * @param {object} vparas
	 * @return {object} {curve, path, points}
	 * @member Thrender.xlineMaterial
	 * @function
	 */
	static xlineMaterial( uniforms = new Object(), vparas ) {

		if (vparas.dashSize !== undefined || vparas.dashSize !== undefined) {
			var color = 0;
			if (Array.isArray(vparas.color)) {
				color = new THREE.Color(...vparas.color);
			}
			else if (vparas.color !== undefined) {
				color = new THREE.Color(vparas.color);
			}
			else
				color = 0xffff00;

			return new THREE.LineDashedMaterial( {
				isMart: true,
				glslVersion: THREE.GLSL3,
				color,
				linewidth: vparas.linewidth,
				scale: vparas.scale,
				dashSize: vparas.dashSize,
				gapSize: vparas.gapSize,
			} );
		}
		// use xline to control u_alpha
		else {
			var {vertexShader, fragmentShader} = xglsl.xvShader(
						ShaderFlag.colorLine, vparas);

			// add vec3 u_color
			if (Array.isArray(vparas.color)) {
				uniforms.u_color = { value: new THREE.Vector4(...vparas.color) };
			}
			else if (vparas.color !== undefined) {
				var c = new THREE.Color(vparas.color);
				uniforms.u_color = { value: new THREE.Vector4(c.r, c.g, c.b, c.a) };
			}
			else
				uniforms.u_color = {value: new THREE.Vector4(1, 1, 0, 1) };

			uniforms.u_alpha = { value: 1 };
			// uniforms.opacity = { value: 1 };

			var matOpt = {
				isMart: true,
				glslVersion: THREE.GLSL3,
				uniforms,
				vertexShader,
				fragmentShader,
				depthTest: true,
				transparent: true,
				depthWrite: true };

			if (vparas.linewidth !== undefined)
				matOpt.linewidth = vparas.linewidth;

			var mat = new THREE.ShaderMaterial( matOpt );

			return mat;
		}
	}

	/**
	 * Generate line, segments or curve, e.g Obj3.geom =
	 * RandomCurve, RandomSects, PointSects, CatmullRom, Spline from
	 * {@link XComponent.Obj3Type}.
	 *
	 * 1. use {@link xgeom.generateCurve} to generate points
	 * 2. create the THREE.Line or LineSegments,
	 * @param {Obj3} obj3
	 * @param {object} paras Visual.paras, @see {@link xgeom.generateCurve}
	 * @param {Material} material
	 * @return {object} {curve, path, points}
	 * @member Thrender.createObj3Line
	 * @function
	 */
	static createObj3Line( obj3, paras, material ) {
		var {geomCurve, points} = xgeom.generateCurve(obj3, paras);
		var line;
		// FIXME we can ask xgeom here to make sure how to create line buffer
		// or let xgeom handle all of this?
		if (obj3.geom === Obj3Type.PointSects) {
			line = new THREE.LineSegments( geomCurve, material );
		}
		else {
			line = new THREE.Line( geomCurve, material );
		}
		line.computeLineDistances();
		return {curve: line, path: points, points};
	}

	/**Create THREE.Points from cmpObj3.mesh.
	 *
	 * Difference to createObj3particles which createing vertices from referenced
	 * mesh, this method create points according to Obj3.geomType ({@link Obj3Type})
	 * with Obj3.box as constructor parameters.
	 * @param {Obj3} cmpObj3 Obj3 for the mesh
	 * @param {AssetType} geomType Visual.vtype
	 * @param {THREE.Material} material [optional] default is THREE.ShaderMaterail.
	 * @return {THREE.Mesh} mesh (already set in cmpObj3)
	 * @member Thrender.createObj3points
	 * @function
	 */
	static createObj3points(cmpObj3, geomType, material) {
		if (cmpObj3) {
			var g = Thrender.geometryCase(geomType, cmpObj3.box);
			var m = new THREE.Points( g,
				material || new THREE.ShaderMaterial( { color: 0x888888 } ));
			if (!!cmpObj3.invisible) m.visible = false;

			cmpObj3.mesh = m;
			return m;
		}
		else console.error(
			'createObj3points(): can\'t create Obj3 for undefined Obj3 component. type: ',
			geomType);
	}

	/**Create object mesh, put int *cmpObj3*.
	 * @param {Obj3} cmpObj3
	 * @param {Obj3Type} geomType
	 * @param {THREE.Materail} material
	 * @param {object} [visual] Visual with additional paras, such as points of [[x, y, z]] for creating path, road, polygon, etc.
	 * @member Thrender.createObj3mesh
	 * @function
	 */
	static createObj3mesh(cmpObj3, geomType, material, visual) {
		if (cmpObj3) {
			var g = Thrender.geometryCase(geomType, cmpObj3.box,
							visual ? visual.paras : undefined, cmpObj3);
			var m = new THREE.Mesh( g, material );
			if (!!cmpObj3.invisible) m.visible = false;

			if (cmpObj3.geom == Obj3Type.SPHERE) {
				if (typeof g.mergeVertices === 'function')
					g.mergeVertices();
				g.computeVertexNormals();
			}
			// cmpObj3.mesh = m;
			return m;
		}
		else console.error(
			'createObj3mesh(): can\'t create Obj3 for undefined Obj3 component. type: ',
			geomType);
	}

	/**Create object mesh, put int *cmpObj3*.
	 * This method handle only AssetType.PathTube.
	 * @see Thrender.createObj3mesh
	 * @param {Obj3} cmpObj3 {geom: Obj3Type.GeomCurve (with future sects?)}
	 * @param {object} paras Visual.paras, @see xgeom.generateCurve
	 * @param {THREE.Materail} material
	 * @return {object} {tube, path}, where geomCurve is THREE.BufferGeometry,
	 * @member Thrender.createObj3mesh
	 * @function
	 */
	static createPathTube(cmpObj3, paras, material) {
		var {tube, path} = xgeom.generateDirTube(cmpObj3, paras);
		var m = new THREE.Mesh( tube, material );

		cmpObj3.mesh = m;
		return {mesh: m, path};
	}

	static svgPathTube(cmpObj3, paras, material, onload) {
		if (!paras.points && paras.nodes && paras.nodes.length > 0)
			// load points from assets (FIXME currently only SVG)
			AssetKeepr.loadSvgPath('assets/' + paras.asset, paras.nodes,
				(paths) => {
					var pathgrp = [];
					var grp = new THREE.Group();
					for (var p of paths) {
						paras.points = p;
						var {tube, path} = xgeom.generateDirTube(cmpObj3, paras);
						var m = new THREE.Mesh( tube, material );
						pathgrp.push(m);
						grp.add(m);
					}
					onload( {meshes: pathgrp, group: grp, paths} );
				});
	}

	/**<div id='api-geometryCase'>Create geometry for different cases.</div>
	 * @param {XComponent.Obj3Type} geomType Obj3Type (geom types)
	 * @param {array<number>} geomParaArr geometry parameters for the given type.
	 * See {@link XComponent.Obj3Type Obj3Type} for parameters details.
	 * @param {object} vpara Visual.para - shouldn't been here once the orthogonal way is redesigned
	 * @param {ModelSeqs} [modelSeqs] path will be saved in modelSeqs.cache
	 * - Design Memo: when geometry handling became a separate process, this parameters should replaced by component?
	 * @return {THREE.BufferGeometry} any subclass of three-js BufferGeometry.
	 * @member Thrender.geometryCase
	 * @function
	 */
	static geometryCase(geomType, geomParaArr, vparas, obj3) {
		var len = geomParaArr.length;

		var {x, y, z, u, v, w, s, t} = Object.assign({
			x: geomParaArr[0], y: geomParaArr[1],
			z: len > 2 ? geomParaArr[2] : 1,
			u: len > 3 ? geomParaArr[3] : 1, v: len > 4 ? geomParaArr[4] : 1,
		 	w: len > 5 ? geomParaArr[5] : 1,
		 	s: len > 6 ? geomParaArr[6] : 0, t: len > 7 ? geomParaArr[7] : 0
		});

		var g;
		if (geomType === Obj3Type.BOX) {
			g = new THREE.BoxBufferGeometry( x, y, z );
		}
		else if (geomType === Obj3Type.PLANE) {
			g = new THREE.PlaneBufferGeometry( x, y, z );
		}
		else if (geomType === Obj3Type.SPHERE) {
			// g = new THREE.SphereBufferGeometry( x, y, z );
			g = new THREE.SphereGeometry( x, y, z );
		}
		else if (geomType === Obj3Type.TORUS) {
			// g = new THREE.TorusBufferGeometry(10, 3, 16, 100); // x, y, z, u );
			z = len > 2 ? geomParaArr[2] : 8;
			u = len > 3 ? geomParaArr[3] : 6;
			v = len > 4 ? geomParaArr[4] : Math.PI * 2;
			// radius - Radius of the torus, from the center of the torus to the center of the tube. Default is 1.
			// tube — Radius of the tube. Default is 0.4.
			// radialSegments — Default is 8
			// tubularSegments — Default is 6.
			// arc — Central angle. Default is Math.PI * 2.
			g = new THREE.TorusBufferGeometry( x, y, z, u, v );
		}
		else if (geomType === Obj3Type.CONE) {
			g = new THREE.ConeBufferGeometry( x, y, z );
		}
		else if (geomType === Obj3Type.Cylinder) {
			// Why so many restrictiong?
			// Because visualized is essential to debug.
			u = Math.max(3, u);
			if (v === 0 || v === undefined) v = 1;
			if (w === 0) w = undefined;
			if (s === 0) s = undefined;
			if (t === 0) t = undefined;
			// radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
			g = new THREE.CylinderBufferGeometry( x, y, z, u, v, w, s, t );
		}
		else if (geomType === Obj3Type.SHAPE) {
			var shape = new THREE.Shape();
			shape.moveTo( x, y );
			for (var i = 2; i < len; i += 2) {
				shape.bezierCurveTo( geomParaArr[i], geomParaArr[i + 1] );
			}
			g = new THREE.ShapeBufferGeometry( shape );
		}
		else if (geomType === Obj3Type.RING) {
			g = new THREE.RingBufferGeometry( x, y, z, u, v, w );
		}
		else if (geomType === Obj3Type.Lathe) {
			g = new THREE.LatheBufferGeometry( x, y, z, u );
		}
		else if (geomType === Obj3Type.MapXZRoad) {
			if (vparas && vparas.features) {
				var {geom, path} = xgeom.generateWayxz( vparas.features,
					  vparas ? vparas.y0 || geomParaArr[0] || 0 : geomParaArr[0] || 0,
					  vparas ? vparas.origin : undefined,
					  vparas ? vparas.geostyle : undefined );
				g = geom;
			}
			else if (vparas && vparas.uri) {
				// path0 is a place holder for creating the new geometry latter.
				// Design Notes: is place holder a solution of asynchronous loading?
				var path0 = AssetKeepr.geojsonPaths(vparas.uri,
					new Object(),
					(paths) => {
						if (obj3.mesh) {
							// only created mesh needing new vertices
							var {geom, path} = xgeom.generateWayxz( paths,
								 vparas ? vparas.y0 || geomParaArr[0] || 0 : geomParaArr[0] || 0,
								 vparas ? vparas.origin : undefined,
								 vparas ? vparas.geostyle : undefined );
							if (obj3.mesh.geometry)
								obj3.mesh.geometry.dispose();
							obj3.mesh.geometry = geom;
							obj3.mesh.geometry.verticesNeedUpdate = true;
						}
						obj3.datum.path = path;
						// will trigger animizer rebuild AnimType.U_PATHn_MORPH, reset by animizer
						obj3.datum.dirty = true;
					} );
				var {geom, path} = xgeom.generateWayxz( path0,
					  vparas ? vparas.y0 || geomParaArr[0] || 0 : geomParaArr[0] || 0,
					  vparas ? vparas.origin : undefined,
					  vparas ? vparas.geostyle : undefined );
				g = geom;
			}
			obj3.datum.path = path;
			obj3.datum.dirty = true;
		}
		else if (geomType === Obj3Type.Hexatile) {
			if (vparas && vparas.features) {
				var {geom, points} = AssetKeepr.geoHexaprism( vparas.features, {
						radius: vparas.geostyle ? vparas.geostyle.radius || 1 : 1,
						height: vparas.geostyle ? vparas.geostyle.height || 1 : 1,
						geoScale: vparas.geostyle ? vparas.geostyle.scale || 1 : 1,
						geoCentre: vparas.origin || [0, 0, 0],
						onGroup: vparas.geostyle ? vparas.geostyle.onGroup : undefined
					} );
				g = geom;
				obj3.datum.locations = points;
				obj3.datum.dirty = true;
			}
			else if (vparas && vparas.uri) {
				var {geom} = AssetKeepr.geoHexaprismAsync(vparas.uri,
					{	count: vparas.count || 1,
						radius: vparas.geostyle ? vparas.geostyle.radius || 1 : 1,
						height: vparas.geostyle ? vparas.geostyle.height || 1 : 1,
						heightName: vparas.heightName || 'height',
						geoScale: vparas.geostyle ? vparas.geostyle.scale || 1 : 1,
						geoCentre: vparas.origin || [0, 0, 0],
						onGroup: vparas.geostyle ? vparas.geostyle.onGroup : undefined
					},
					(geom, points, count) => {
						if (obj3.mesh) {
							// only created mesh needing new vertices
							if (obj3.mesh.geometry)
								obj3.mesh.geometry.dispose();
							obj3.mesh.geometry = geom;
							obj3.mesh.geometry.verticesNeedUpdate = true;
						}
						obj3.datum.locations = points;
						obj3.datum.dirty = true;
					} );
				g = geom;
			}
		}
		else if (geomType === Obj3Type.GeoPrism) {
			// synchrodous
			if (vparas && vparas.features) {
				var opts = xgeom.formatPrismOption(obj3, vparas);
				var {geom, points} = AssetKeepr.geoTexturePrism( vparas.features, opts );
				g = geom;
				obj3.datum.locations = points;
				obj3.datum.dirty = true;
			}
			// asynchronous
			else if (vparas && vparas.uri) {
				var opts = xgeom.formatPrismOption(obj3, vparas);
				opts.obj3 = obj3;
				var {geom} = AssetKeepr.geoPrismAsync(vparas.uri, opts,
					(geom, points, count, opts) => {
						var obj = opts.obj3;
						if (obj.mesh) {
							// only created mesh needing new vertices
							if (obj.mesh.geometry)
								obj.mesh.geometry.dispose();
							obj.mesh.geometry = geom;
							obj.mesh.geometry.verticesNeedUpdate = true;
						}
						obj.datum.locations = points;
						obj.datum.dirty = true;
					} );
				g = geom;
			}
		}
		else {
			if (y > 5) {
				console.warn('geometryCase(): maximum for IcosahedronGeometry detail is 5',
					`argument value ${y} is ignored.`);
				y = 5;
			}
			if (geomType === Obj3Type.Tetrahedron) {
				g = new THREE.TetrahedronBufferGeometry( x, y, z );
			}
			else if (geomType === Obj3Type.Dodecahedron) {
				g = new THREE.DodecahedronBufferGeometry( x, y );
			}
			else if (geomType === Obj3Type.Octahedron) {
				g = new THREE.OctahedronBufferGeometry( x, y );
			}
			else if (geomType === Obj3Type.Icosahedron) {
				g = new THREE.IcosahedronBufferGeometry( x, y );
			}
			else
				throw new XError('TODO GEOM Type: ', geomType);
		}
		return g;
	}

	/**Clone and combine gltf nodes' geometry[position] buffer - the modules vertices.
	 *
	 * This method can only handling Visual.vtype == AssetType.point, making
	 * points (vertices) can basically rendered.
	 *
	 * This is not enough. Animizer would added more components to animize points.
	 *
	 * @param {xv.Components.Obj3}
	 * @param {array} nodes nodes loaded from gltf.
	 * @param {paras} Visual.paras, define, size, color...
	 * @return {THREE.Points} points
	 * @member Thrender.combineGltfPoints
	 * @function
	 */
	static combineGltfPoints(cmpObj3, nodes, paras) {
		if (cmpObj3 && nodes) {
			/* for city/scene.gltf, paras.nodes = ['Tree-1-3'],
			 * nodes[0].children[0].type == 'Mesh',
			 * nodes[0].children[0].geometry is a BufferGeometry, with array of
			 * BufferAttributes as 'attributes'.
			 * nodes[0].children[0].geometry.attributes['position'] ==
				length: 2772
				dynamic: false
				name: ""
				array: Float32Array(2772) [135.61163330078125, 31.193208694458008, -2.098475694656372, …]
				itemSize: 3
				count: 924
				normalized: false
				usage: 35044
				updateRange: {offset: 0, count: -1}
				version: 0
			*/

			// get count first - seems no better way
			// see Three.js example - dynamic points
			var count = 0;
			for (const node of nodes) {
				if (node.type === 'Mesh') {
					var buffer = node.geometry.attributes[ 'position' ];
					count += buffer.array.length;
				}
				for (const child of node.children) {
					if (child.type === 'Mesh') {
						var buffer = child.geometry.attributes[ 'position' ];
						count += buffer.array.length;
					}
				}
			}

			var combined = new Float32Array( count );
			let offset = 0;

			for (const node of nodes) {
				if (node.type === 'Mesh') {
					var buffer = node.geometry.attributes[ 'position' ];
					combined.set( buffer.array, offset );
					offset += buffer.array.length;
				}
				for (const child of node.children) {
					if (child.type === 'Mesh') {
						var buffer = child.geometry.attributes[ 'position' ];
						combined.set( buffer.array, offset );
						offset += buffer.array.length;
					}
				}
			}
			var attrPos = new THREE.BufferAttribute( combined, 3 );
			var geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', attrPos );
			// geometry.setAttribute( 'initialPos', attrPos.clone() );
			geometry.attributes.position.setUsage( THREE.DynamicDrawUsage );
			var mesh = new THREE.Points( geometry, new THREE.PointsMaterial( {
					size: paras.size, color: paras.color || xutils.randomColor() } ) );

			return mesh;
		}
	}

	static replaceMaterials(mesh, vparas, materl) {
		// Design Memo: TODO verify that sharing material is safe
		// FIXME is this the reason of the issue (bug)?
		if (!materl) {
			// TODO support ShaderFlag?
			materl = new THREE.PointsMaterial( {
							size: vparas.size,
							color: vparas.color || xutils.randomColor() } );
		}

		var grp = new THREE.Object3D();

		if (Array.isArray(mesh)) {
			for (var m of mesh)
				rebuildPoints(grp, m, materl, vparas);
		}
		else if (mesh instanceof THREE.Mesh) {
			// mesh.material = materl;
			rebuildPoints(grp, mesh, materl, vparas);
		}
		return grp;

		function rebuildPoints(root, oldMesh, materl, vparas) {
			var mesh = new THREE.Points( oldMesh.geometry, materl );
			mesh.quaternion.copy(oldMesh.quaternion);
			mesh.position.copy(oldMesh.position);
			mesh.scale.copy(oldMesh.scale);
			root.add(mesh);
			if (vparas.keepMaterial && oldMesh.material) {
				root.add(oldMesh);
				Object.assign(oldMesh.material, vparas.keepMaterial);
				oldMesh.material.transparent = true;
			}

			if (oldMesh.children && oldMesh.children.length > 0) {
				for (var child of oldMesh.children) {
					rebuildPoints(mesh, child, materl, vparas);
				}
			}
			return root;
		}
	}

	/**
	 * Create particles (THREE.Points) from vertices of mesh.
	 * @param {Obj3} cmpObj3 this enitiy's Obj3 component, uniforms merged to target mesh
	 * @param {THREE.Mesh} fromesh referencing mesh
	 * @param {Visual} cmpVisual this entity's Visual component.
	 * cmVisual.paras.u_tex: texture path
	 * cmVisual.shader: parameters for generate vertex and framgment shaders. see xglsl.xvShader().
	 * @return {THREE.Points} where geometry is generated by {@link xglsl.particlesGeom()},
	 * material is THREE.ShaderMaterial.
	 * @member Thrender.createObj3particles
	 * @function
	 */
	static createObj3particles(cmpObj3, fromesh, cmpVisual) {
		let m0 = fromesh.geometry.attributes[ 'position' ];
		let uniforms = new Object();
		if (cmpVisual.paras && cmpVisual.paras.u_tex) {
			uniforms = {
				// FIXME we should use AssetKeepr.loadTexure(), but it's supposed asynchronous
				// So we need notifying events deep into shaders?
				u_tex: { value: new THREE.TextureLoader().load(`assets/${cmpVisual.paras.u_tex}`) }
			};
		}
		else if ((cmpVisual.shader & ShaderFlag.defaultex) === ShaderFlag.defaultex) {
			uniforms = {
				u_tex: { value: AssetKeepr.defaultex() }
			};
		}

		Object.assign(uniforms, GlUniform.obj2uniforms(cmpObj3.uniforms));
		let material = Thrender.createXShaderMaterial(cmpVisual.shader, uniforms, cmpVisual.paras, cmpObj3);

		let destEnt;
		if (cmpVisual.vtype === AssetType.refPoint
			&& (!cmpVisual.paras || (!cmpVisual.paras.a_dest && !cmpVisual.paras.dest))) {
			console.error('Thrender.createObj3particles(): refPoints doesn\'t have a morphing a_dest.',
						  cmpObj3.entity);
		}
		else {
			destEnt = x.ecs.getEntity( cmpVisual.paras.a_dest || cmpVisual.paras.dest );
		}
		if ((cmpVisual.asset || cmpVisual.paras.dest || cmpVisual.paras.a_dest)
			&& !destEnt)
			console.error("The entity referenced by Visual.asset or Visual.paras.dest not found.");
		else {
			let geometry = xglsl.particlesGeom(cmpVisual.paras, m0,
					destEnt ? destEnt.Obj3.mesh.geometry.attributes['position'] : undefined);
			let mesh = new THREE.Points( geometry, material );
			return mesh;
		}
	}

	/**
	 * Create cube voxel. (points evenly dividing in cube).
	 *
	 * Return mesh object can be rendered by {@link Thrender}.<br>
	 * {@link AssetType}: AssetType.refPoint; AssetType.cubeVoxel
	 * @param {Obj3} cmpObj3
	 * @param {Visual} cmpVisual
	 * @return {THREE.Mesh}
	 * @member Thrender.createCubeVoxel
	 * @function
	 */
	static createCubeVoxel(cmpObj3, cmpVisual) {
		// FIXME can this uniforms been orthogonal handled?

		var uniforms = GlUniform.init(cmpVisual, cmpObj3);

		var {vertexShader, fragmentShader} = xglsl.xvShader(cmpVisual.shader, cmpVisual.paras);

		for (var bx = 0; bx < cmpVisual.paras.uniforms.u_cubes.length; bx++) {
			var destcube = cmpVisual.paras.uniforms.u_cubes[bx];
			if (!destcube) {
				console.error(`The visual paras.u_cubes[${destcube}] entity can't been found:\n`, cmpVisual);
				continue;
			}
			var entCube = x.ecs.getEntity(destcube);
			if (destcube && (!entCube || !entCube.Obj3.mesh || !entCube.Obj3.mesh.geometry.attributes['position'])) {
				console.error(`The visual paras.u_cubes element is ${destcube}, but no target mesh was found.`);
				continue;
			}
			else if ( !(entCube.Obj3.mesh.geometry instanceof THREE.BoxBufferGeometry)
				&& !(entCube.Obj3.mesh.geometry instanceof THREE.BoxGeometry) ) {
				if (x.log >= 3)
					console.warn(`[3] Can't create cube voxel from geometry other than box. Visual.paras.a_cube = ${destcube}`);
			}

			var u_boxi = `u_box${bx}`;
			var u_transi = `u_trans${bx}`;
			uniforms[u_boxi] = {value: new vec3(entCube.Obj3.box)};
			uniforms[u_transi] = {value: mat4.js(entCube.Obj3.mesh.matrix)};
		}

		var material = new THREE.ShaderMaterial( {
			uniforms,
			vertexShader,
			fragmentShader,
			blending: THREE.AdditiveBlending,
			depthTest: true,
			transparent: true,
		} );

		var geometry = xglsl.cubeVoxelGeom(cmpVisual.paras.uniforms);
		var mesh = new THREE.Points( geometry, material );
		return mesh;
	}

	/**Setup light of <a href='https://threejs.org/docs/index.html#api/en/lights/DirectionalLight'>
	 * THREE.DirectionalLight</a> &amp; <a href='https://threejs.org/docs/index.html#api/en/lights/shadows/DirectionalLightShadow'>
	 * THREE.DirectionalLightShadow</a>.<br>
	 * For parameters' example, see test/html/ecs-basics/light.html
	 * @param {object} options
	 * @param {object} [options.light]
	 * @param {number} [otpions.light.skyColor=0xffffbb]
	 * @param {number} [options.light.groundColor=0x080820]
	 * @param {array} [options.light.pos=[0, 1, 0.56]]
	 * @param {number} [options.light.intensity=1.1]
	 * @param {number} [otpions.light.castShadow=true]
	 * @param {object} [options.shadow]
	 * @param {object} [options.shadow.mapSize={width: glConfig.shadow.w, height: glConfig.shadow.h}]
	 * @param {object} [options.shadow.camera={near: 50, far: 2000}]
	 * @param {number} [options.shadow.size=20] The shadow cull space size,
	 * scaled to default THREE.shadowCamera.width, height, like:<pre>
	light.shadow.camera.left *= size;
	light.shadow.camera.right *= size;
	light.shadow.camera.bottom *= size;
	light.shadow.camera.top *= size;</pre>

	 * @param {object} [cam] {near, far}, camera's near, far
	 * @return {THREE.DirectionalLight} with options = arg-options
	 * @member Thrender.createCubeVoxel
	 * @function
	 */
	static createLight (options = {}, cam = {}) {
		var s = options.shadow || {}; // for short
		var l = options.light || {};

		var sky = l.skyColor || 0xffffbb;
		var ground = l.groundColor || 0xffffbb;
		l.diffuse = xutils.cssColor(sky);
		l.ambient = xutils.cssColor(ground);

		var light = new THREE.DirectionalLight ( sky, l.u_lightIntensity );
		light.groundColor = ground;

		light.castShadow = true;
		light.shadow.mapSize = Object.assign( {
			x: glConfig.shadow.w,
			y: glConfig.shadow.h,
			width: glConfig.shadow.w,
			height: glConfig.shadow.h
		}, s.mapSize);

		light.shadow.bias = s.bias === undefined ? 0.00001 : s.bias;

		light.shadow.camera = Object.assign(light.shadow.camera,
			Object.assign(
				{ near: s.near === undefined ? cam.near == undefined ? 1 : cam.near : s.near,
				  far: s.far === undefined ? cam.far == undefined ? 20000 : cam.far : s.far },
			) );

		if (s.size === undefined || typeof s.size === 'number') {
			let ssz = s.size !== undefined ? s.size : 20;
			light.shadow.camera.left *= ssz;
			light.shadow.camera.right *= ssz;
			light.shadow.camera.top *= ssz;
			light.shadow.camera.bottom *= ssz;
		}
		else if (Array.isArray(s.size)) {
			light.shadow.camera.left *= s.size[0] || 20;
			light.shadow.camera.right *= s.size[1] || 20;
			light.shadow.camera.top *= s.size[2] || 20;
			light.shadow.camera.bottom *= s.size[3] || 20;
		}
		else if (typeof s.size === 'object') {
			light.shadow.camera.left *= s.size.left || 20;
			light.shadow.camera.right *= s.size.right || 20;
			light.shadow.camera.top *= s.size.top || 20;
			light.shadow.camera.bottom *= s.size.bottom || 20;
		}

		light.shadow.camera.zoom = s.zoom !== undefined ? s.zoom : 0.5;

		light.shadow.radius = s.radius === undefined ? 8 : s.radius;

		if (l && l.position) {
			light.position.x = l.position[0];
			light.position.y = l.position[1];
			light.position.z = l.position[2];
		}
		else {
			light.position.x = 100;
			light.position.y = 100;
			light.position.z = 56;
		}
		l.pos = l.position;

		light.layers.enableAll();

		light.options = l;
		light.options.hemisphere = light;
		return light;
	}

	setFocuse(offsetx, offsety) {
		let u = this.filterQuad.material.uniforms.focusCoords.value;
		this.renderer.getSize(u);
		u.x = offsetx / u.x;
		u.y = 1 - offsety / u.y;
		return this;
	}

	setFilter(options = {}) {
		let fq = this.filterQuad.material.uniforms;
		if (options.f > 0) fq.focalLength.value = Number(options.f);
		if (options.F > 0) fq.F.value = Number(options.F);
		if (options.debugBokeh !== undefined) fq.showFocus.value = Boolean(options.debugBokeh);
		if (options.blurAlpha !== undefined) fq.blurAlpha.value = Number(options.blurAlpha);
	}

	/**
	 * @param {Canvas} canvas
	 * @param {x} x {options, ...}
	 * @member Thrender#init
	 * @function
	 */
	init(canvas, x) {
		this.camera = x.xcam.XCamera.cam;
		// renderer
		let opt = Object.assign(
				  { canvas: canvas, alpha: true, antialias: true },
					x.options.renderer )
		var renderer = new THREE.WebGLRenderer( opt ); // note 122: isMrtBackground defualt true
		renderer.autoClearDepth = false;

		renderer.shadowMap.enabled = true;
		if ( !x.options.shadow )
			x.options.shadow = {};

		if ( x.options.shadow ) {
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = x.options.shadow.type === undefined ?
						THREE.PCFSoftShadowMap : x.options.shadow.type;
		}

		if ( x.log >= 3 )
			logGlInfo(renderer);
		if ( x.log >= 6 )
			THREE.WebGLProgram.debug = true;

		var wh;
		if ( x.options.canvasize ) {
			wh = x.options.canvasize;
		}
		else {
			wh = [800, 400]
			x.options.canvasize = wh;
		}
		renderer.setSize( wh[0],  wh[1] );

		// scene
		var scene = new THREE.Scene();
		scene.layers.enableAll();
		scene.background = x.options.background || new THREE.Color('black');

		// light
		var light = Thrender.createLight(x.options);
		x.light = light;
		scene.add(light);

		if ( x.options.shadow && x.options.shadow.helper ) {
			var helper = new THREE.CameraHelper( light.shadow.camera, true );
			scene.add( helper );
		}

		this.scene = scene;
		this.renderer = renderer;
		x.scene = scene;
		x.renderer = renderer;

		/* no longer working in MRT
		// RenderPass for final composer
		var composer
			= new EffectComposer( this.renderer );
			var renderPass = new RenderPass( scene, this.camera );
			composer.addPass( renderPass );

		if ( x.options.outlinePass ) {
			composer = composer ? composer : new EffectComposer( this.renderer );
			this.outlinePass = new OutlinePass( new THREE.Vector2( wh[0], wh[1] ), scene, this.camera );
			this.outlinePass.selectedObjects = [];
			// composer.addPass( this.outlinePass );
			this.composer = composer;
		}

		x.thrender = composer; */

		let finalOpt = x.options.finalQuad || {} // for short

		// MRT Support
		this.mrt = new THREE.WebGLMultiRenderTarget(
			glConfig.xbuffer.w, glConfig.xbuffer.h,
			THREE.WebGLProgram.mrt_num,
			{
				// format: THREE.RGBAFormat,
				minFilter: THREE.LinearMipmapLinearFilter,
				magFilter: THREE.LinearMipmapLinearFilter,
				generateMipmaps: true,

				type: THREE.FloatType,
				stencilBuffer: false,
				depthBuffer: true
			}
		);

		// filters
		this.filterScene = new THREE.Scene();
		this.orthoCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

		this.filterBuffer = new THREE.WebGLMultiRenderTarget(
			glConfig.xfilter.w, glConfig.xfilter.h,
			2,      // [outline, h-blur, ...]
			{
				// format: THREE.RGBAFormat,
				minFilter: THREE.LinearMipmapLinearFilter,
				magFilter: THREE.LinearMipmapLinearFilter,
				type: THREE.FloatType,
				generateMipmaps: true,
				stencilBuffer: false,
				depthBuffer: true
			}
		);
		// filter: h-blure, lens flare
		let {vertexShader, fragmentShader} = xglsl.xvShader(ShaderFlag._filters,
			x.options, undefined, !!finalOpt.debug);

		let filterDefaults = {
				u_blurRadius: finalOpt.blur && finalOpt.blur.radius !== undefined
							? finalOpt.blur.radius : 4,
				u_blurIntense: finalOpt.blur && finalOpt.blur.intense !== undefined
							? finalOpt.blur.intense : 1.,
			  };

		if ( finalOpt.ssao && finalOpt.ssao.radius > 0 && finalOpt.ssao.intense > 0) {
			filterDefaults.u_ssaoRadius = finalOpt.ssao.radius;
			filterDefaults.u_ssaoIntense = finalOpt.ssao.intense;
			filterDefaults.u_ssaoLOD = finalOpt.ssao.depthLOD !== undefined
							? finalOpt.ssao.depthLOD : 1.
		}
		// else filter shader is been toggled off

		let filterUniforms = Object.assign( filterDefaults,
			  { xFragColor: this.mrt.textures[ 0 ],
				xColor: this.mrt.textures[ 1 ],
				xEnvSpecular: this.mrt.textures[ 2 ],
				xBokehDepth: this.mrt.textures[ 3 ],
				u_texsize: new THREE.Vector2(...wh),
				u_flareUv: new THREE.Vector2(1.0),
				directionalLights: [{
					color: light.color,
					direction: new THREE.Vector3().copy(light.position).normalize(),// light.position.normalize(),
					intensity: light.intensity }],
				u_time: { value: 0},
				u_campos: new THREE.Vector3(),
				u_camlook: new THREE.Vector3(0, 0, -1), // dir
				u_testex: __tex0__ ,

				// see UniformsLib.lights
				directionalLightShadows: [ {
					shadowBias: 0.0, // shouldn't have any offset
					shadowNormalBias: 0.001,
					shadowRadius: 0.1,
					shadowMapSize: new THREE.Vector2(1024, 1024)
				} ],

				directionalShadowMap: [],
				directionalShadowMatrix: [new THREE.Matrix4()],
			} );

		this.filterQuad = new THREE.Mesh(
			new THREE.PlaneGeometry( 2, 2 ),
			new THREE.RawShaderMaterial( {
				vertexShader, fragmentShader,
				uniforms: GlUniform.obj2uniforms(filterUniforms, BokehShader.uniforms),
				lights: false
			} ) );
		this.filterScene.add( this.filterQuad );
		this.filterenderer = new Filterenderer(renderer, opt);

		// post collection
		this.postScene = new THREE.Scene();
		this.postCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		this.postCamera.position.set( 0, 0, 1 );

		let finalShader = xglsl.xvShader( finalOpt.shader ?
				finalOpt.shader : ShaderFlag._finalQuad,
				Object.assign( {lodMagnitude: finalOpt.lodMagnitude }, finalOpt.ssao ),
				undefined, !!finalOpt.debug);

		this.finalQuad = new THREE.Mesh(
			new THREE.PlaneGeometry( 2, 2 ),
			new THREE.RawShaderMaterial( {
				vertexShader: finalShader.vertexShader,
				fragmentShader: finalShader.fragmentShader,
				uniforms: {
					xFragColor: { value: this.mrt.textures[ 0 ] },
					xColor: { value: this.mrt.textures[ 1 ] },
					xEnvSpecular: { value: this.mrt.textures[ 2 ] },
					xBokehDepth: { value: this.mrt.textures[ 3 ] },
					xOutline: { value: this.filterBuffer.textures[ 1 ] },
					xBlurH: {   value: this.filterBuffer.textures[ 0 ] },
					u_time: { value: 0},
					u_texsize: { value: new THREE.Vector2(...wh) },
				},
				lights: false
			} )
		);
		this.postScene.add( this.finalQuad );

		return x;
	}

	/**1. Show picked object outline.<br>
	 * 2. Render with composer or scene render.
	 * @param {Number} tick
	 * @param {Array.<Entity>} entities
	 * @member Thrender#update
	 * @function
	 */
	update(tick, entities) {
		if (this.outlinePass) {
			this.outlinePass.selectedObjects.splice(0);
			for (var e of entities) {
				var pk = e.GpuPickable;
				if (pk && pk.picktick > 0 && pk.picked) {
					this.outlinePass.selectedObjects.push(e.Obj3.mesh);
					break;
				}
			}
		}

		this.camera.updateProjectionMatrix();
		this.camera.updateMatrixWorld();

		this.renderer.setRenderTarget(this.mrt);
		this.renderer.clearDepth();
		this.renderer.render(this.scene, this.camera);

		// FIXME filter is a separate system?
		this._v3.copy(this.light.position);
		this._v3 = vec3.dir2Uv(this._v3, this.camera);

		let time = TWEEN.now();
		this.filterQuad.material.uniforms.u_time.value = time;
		this.filterQuad.material.uniforms.u_flareUv.value.x = this._v3.x;
		this.filterQuad.material.uniforms.u_flareUv.value.y = this._v3.y;
		this.filterQuad.material.uniforms.directionalShadowMatrix.value[0].copy(this.light.shadow.matrix);
		this.filterQuad.material.uniforms.directionalShadowMap.value[0] = this.light.shadow.map.texture;
		if (x.light.flare > 0) {
			// update light & shadow
			let uniforms = this.filterQuad.material.uniforms;
			uniforms.u_campos.value = this.camera.position;
			vec3.q2nzJs(uniforms.u_camlook.value, this.camera.quaternion);
			uniforms.u_testex.value = __tex0__;

			uniforms.directionalLights.value[0].color = this.light.color;
			uniforms.directionalLights.value[0].direction.copy(this.light.position).normalize();
			uniforms.directionalLights.value[0].intensity = this.light.intensity;
		}

		this.filterenderer.setRenderTarget(this.filterBuffer);
		this.filterenderer.renderQuad(this.filterScene, this.orthoCamera);

		this.finalQuad.material.uniforms.u_time.value = time;

		this.renderer.setRenderTarget(null);
		this.renderer.render( this.postScene, this.postCamera );
	}
}

Thrender.query = {any};

function logGlInfo (renderer) {
	if (renderer.capabilities.isWebGL2)
		console.log('[3] WebGl2');
	else console.warn('[3] No WebGl2');
	var gl = renderer.getContext();
	console.log('[3]', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
	console.log('[3] THREE.Revision', THREE.REVISION);
}


import * as THREE from 'three'
import {EffectComposer} from '../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../packages/three/postprocessing/RenderPass'
import {OutlinePass} from '../../packages/three/postprocessing/OutlinePass'

import * as ECS from '../../packages/ecs-js/index'

import {XError, ramTexture} from '../xutils/xcommon'
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

const any = ['Obj3'];

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
		Thrender.createObj3s(ecs, scn, this.light.options, obj3Ents);
	}

	/**Create three.js Object3D
	 *
	 * - create mesh with geometry of Obj3.geom (e.g Obj3Type.BOX).
	 * @param {ECS} ecs
	 * @param {THREE.Scene} scene
	 * @param {THREE.Light} light
	 * @param {Array.<Entity>} entities
	 * @member Thrender.createObj3s
	 * @function
	 */
	static createObj3s(ecs, scene, light, entities) {
		// var mes = [];
		entities.forEach(function(e, x) {
			// A typicall orghogonal handling process should be blocks one after another,
			// like material, an generalized case of alp
			let tex, mat;
			let shadowSide = null;

			// 1. uniforms
			// 1.1 paras for uniforms
			var uniforms = new Object();
			// 1.2 shader's uniforms
			if (!e.Visual.material && e.Visual.shader) {
				// TODO test
				// uniforms = xglsl.formatUniforms(e.Visual, e.Obj3, light);
				uniforms = GlUniform.init(e.Visual, e.Obj3, light);
			}
			// 2. TODO merge material handling

			// common paras section
			// FIXME alp is deprcated by xglsl.formatUniforms()
			// - in fact, uniforms should been handled here
			var alp = e.Visual.paras !== undefined && e.Visual.paras.tex_alpha !== undefined ?
				e.Visual.paras.tex_alpha : 1;

			// tolerate API design error - Visual.asset will be deprecated
			if ((!e.Visual.paras || !e.Visual.paras.u_tex) && e.Visual.asset)
				e.Visual.paras = Object.assign(e.Visual.paras || {}, {u_tex: [e.Visual.asset]});

			if (e.Visual.paras && e.Visual.paras.shadowSide !== undefined)
				shadowSide = e.Visual.paras.shadowSide;

			if (!e.Obj3.datum)
				e.Obj3.datum = new Object();

			// create mesh of AssetType
			switch (e.Visual.vtype) {
				case AssetType.Extension:
					// some extesion like Canvtex (x-visual v0.3) will handle this
					var g = new THREE.Group();
					// e.Obj3.mesh = g;
					addObj3(scene, g, e);
					break;
				case AssetType.gltf:
					if (!e.Visual.asset)
						throw XError('Thrender: AssetType.gltf needs Visual.asset parameter.');
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
							opacity: alp,
							// debug note!!! This map must created here for later changing
							// map: new THREE.CanvasTexture(document.getElementById(e.Canvas.domId)),
							map: new ramTexture(3, 4, {alpha: 0.5}),

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
							mat = Thrender.createXShaderMaterial(e.Visual.shader, uniforms, e.Visual.paras);
						}
						else {
							var def = {};
							if (e.Visual.asset)
								def.map = AssetKeepr.loadTexure( e.Visual.asset, function() {
									let def_ = def;
									return (texture) => {
										texture.needsUpdate = true;
										def_.map = texture;
									}
								}() );
							else // in case of test and default
								def.map = new ramTexture(3, 4, {alpha: alp});

							var side = !e.Visual.paras || e.Visual.paras.side === undefined
										? THREE.DoubleSide : e.Visual.paras.side;
							var alphaMap = e.Visual.paras && e.Visual.paras.enableAlphaMap ?
										def.map : undefined;
							var blending = e.Visual.paras && e.Visual.paras.blending !== undefined ?
										e.Visual.paras.blending : undefined;

							def = Object.assign( def, {
									// map: tex,
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
						}
					}

					var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat, e.Visual);
					addObj3(scene, m, e);
					break;
				case AssetType.wireframe:
					var def = {
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
					var eref = ecs.getEntity(e.Visual.asset);
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
						else throw XError("shouldn't reaching here!");
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
							mat = Thrender.createXShaderMaterial(e.Visual.shader, uniforms, e.Visual.paras);
						}
						else {
							var def = {};
							if (e.Visual.asset)
								def.map = AssetKeepr.loadTexure( e.Visual.asset, function() {
									let def_ = def;
									return (texture) => {
										texture.needsUpdate = true;
										def_.map = texture;
									}
								}() );
							else // in case of test and default
								def.map = new ramTexture(3, 4, {alpha: alp});
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
				case AssetType.UserMesh:
					// nothing to do
					addObj3(scene, e.Obj3.mesh, e);
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
				// if (e.Obj3 && !e.Obj3.mesh)
				// 	e.Obj3.mesh = mesh;
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

	/**
	 * @param {ShaderFlag} shaderflag
	 * @param {object} uniforms Mesh.material.uniforms
	 * @param {object} vparas visual paras
	 * @return {THREE.ShaderMaterial} material for x-shaders
	 * @member Thrender.createXShaderMaterial
	 * @function
	 */
	static createXShaderMaterial( shaderflag, uniforms = new Object(), vparas ) {
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
			// TODO merge with glsl.formatUniforms()
			if (vparas && vparas.u_tex && vparas.u_tex.length > 0) {
				var texs = [];
				for (var i = 0; i < vparas.u_tex.length; i++) {
					var tex = new ramTexture(i+1, i+1, {alpha: 0.5});
					// suppres RanderPass warning - but not working
					tex.needsUpdate = false;
					texs.push(tex);

					AssetKeepr.loadTexure(vparas.u_tex[i],
						(function() {
							var j = i;
							return (texture) => {
								texture.needsUpdate = true;
								texs[j] = texture;
							}
						})());
				}
				uniforms.u_tex = {value: texs};

				if (!vparas || !vparas.colors || vparas.colors.length === 0) {
					// no diffuse colors
					vparas.colors = [[0, 0, 0]];
					uniforms.u_texWeight = {value: 1};
				}
			}
		}

		var {vertexShader, fragmentShader} = xglsl.xvShader(
					shaderflag, vparas);

		var side = !vparas || vparas.side === undefined
					? THREE.FrontSide : vparas.side;

		var mat = new THREE.ShaderMaterial( {
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

		if (shaderflag === ShaderFlag.discard)
			// Debug Notes: avoid error message:
			// glDrawElements "buffer format and fragment output variable type incompatible"
			// see
			// https://stackoverflow.com/questions/57535605/three-js-custom-shader-error-on-chrome-gl-invalid-operation-active-draw-buffers
			// https://github.com/mrdoob/three.js/issues/17805
			mat.colorWrite = false;
		return mat;
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

			var matOpt = {	uniforms,
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
			g = new THREE.SphereBufferGeometry( x, y, z );
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
		var m0 = fromesh.geometry.attributes[ 'position' ];
		// var material;
		var uniforms = new Object();
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
		var material = Thrender.createXShaderMaterial(cmpVisual.shader, uniforms, cmpVisual.paras);

		var destEnt;
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
			var geometry = xglsl.particlesGeom(cmpVisual.paras, m0,
					destEnt ? destEnt.Obj3.mesh.geometry.attributes['position'] : undefined);
			var mesh = new THREE.Points( geometry, material );
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

		// TODO test
		// var uniforms = xglsl.formatUniforms(cmpVisual, cmpObj3);
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

	/**
	 * @param {object} options
	 * skyColor: number, default 0ffffbb<br>
	 * groundColor: number, defualt 0x080820<br>
	 * pos: array, defualt [0, 1, 0.56]<br>
	 * intensity: number, default 1.1<br>
	 * See Three.js docs: HemisphereLight
	 * @return {THREE.HemisphereLight} with options = arg-options
	 * @member Thrender.createCubeVoxel
	 * @function
	 */
	static createLight (options = {}) {
		var s = options.shadow || {}; // for short
		var l = options.light || {};

		var sky = l.skyColor || 0xffffbb;
		var ground = l.groundColor || 0xffffbb;
		l.diffuse = xutils.cssColor(sky);
		l.ambient = xutils.cssColor(ground);

		// var light = new THREE.HemisphereLight( sky, ground, options.u_lightIntensity );
		var light = new THREE.DirectionalLight ( sky, l.u_lightIntensity );
		light.groundColor = ground;

		light.castShadow = true;
		light.shadow.mapSize.width = 1024;  // default
		light.shadow.mapSize.height = 1024; // default

		light.shadow.camera.near = s.near !== undefined ? s.near : 50;
		light.shadow.camera.far  = s.far  !== undefined ? s.far : 2000;

		let ssz = s.size !== undefined ? s.size : 20;
		light.shadow.camera.left *= ssz;
		light.shadow.camera.right *= ssz;
		light.shadow.camera.bottom *= ssz;
		light.shadow.camera.top *= ssz;

		light.shadow.camera.zoom = s.zoom !== undefined ? s.zoom : 0.5;

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
		var renderer = new THREE.WebGLRenderer( opt );

		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		// renderer.shadowMapCullFace = THREE.CullFaceBack;
		if (opt.shadow) {
			renderer.shadowMap.enabled = !!opt.shadow.enabled;
			renderer.shadowMap.type = opt.shadow.type || THREE.PCFSoftShadowMap;
			// renderer.shadowMapCullFace = opt.shadow.CullFace || THREE.CullFaceBack;
		}

		if (x.log >= 3)
			logGlInfo(renderer);

		var wh;
		if (x.options.canvasize) {
			wh = x.options.canvasize;
		}
		else {
			wh = [800, 400]
			x.options.canvasize = wh;
		}
		renderer.setSize( wh[0],  wh[1] );

		// document.body.appendChild( renderer.domElement );
		// scene
		var scene = new THREE.Scene();
		scene.layers.enableAll();
		scene.background = x.options.background || new THREE.Color('black');

		// light
		var light = Thrender.createLight(x.options);
		x.light = light;
		scene.add(light);

		if (x.options.shadow && x.options.shadow.helper) {
			var helper = new THREE.CameraHelper( light.shadow.camera );
			scene.add( helper );
		}

		this.scene = scene;
		this.renderer = renderer;
		x.scene = scene;
		x.renderer = renderer;

		// RenderPass for final composer
		var composer
			= new EffectComposer( this.renderer );
			var renderPass = new RenderPass( scene, this.camera );
			composer.addPass( renderPass );

		if (x.options.outlinePass) {
			composer = composer ? composer : new EffectComposer( this.renderer );
			this.outlinePass = new OutlinePass( new THREE.Vector2( wh[0], wh[1] ), scene, this.camera );
			this.outlinePass.selectedObjects = [];
			composer.addPass( this.outlinePass );
			this.composer = composer;
		}

		x.thrender = composer;	// why not this?
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
			for (var e of entities) { // high light picking, any better way?
				var pk = e.GpuPickable;
				if (pk && pk.picktick > 0 && pk.picked) {
					this.outlinePass.selectedObjects.push(e.Obj3.mesh);
					break;
				}
			}
		}

		if (this.camera) {
			this.camera.updateProjectionMatrix();
			if (!this.composer)
				this.renderer.render(this.scene, this.camera);
			else // with outlinePass
				this.composer.render();
		}
		else if (x.log >= 5)
			console.warn('[5] Thrender.update(): No camera, testing?');
	}
}

Thrender.query = {any};

function logGlInfo (renderer) {
	var gl = renderer.getContext();
	console.log('[3]', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
	console.log('[3] THREE.Revision', THREE.REVISION);
}

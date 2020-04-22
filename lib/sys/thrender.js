
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
import {vec3, mat4} from '../xmath/vec'
import xmath from '../xmath/math'
import xgeom from '../xmath/geom'

const any = ['Obj3'];

/**X renderer of ecs subsystem based on Three.js renderer.
 * @class Thrender
 */
export default class Thrender extends ECS.System {
	/**
	 * @param {ECS} ecs
	 * @param {x} x {options, ...}
	 * @constructor Thrender */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
		var container = x.container;
		var scn;
		if (typeof container === 'object') {
			var resltx = this.init(container, x)
			scn = resltx.scene;
		}
		else {
			if (x.log >= 5)
				console.warn('[5] Sys.Thrender: container canvas is incorrect, renderer not initialized. Testing? ')
		}

		// init Obj3 objects ( should be covered by mocha )
		// Business entities like created by Cubesys hasn't been visualized here yet,
		// but will present later when updating.
		var obj3Ents = ecs.queryEntities({any: any, hasnt: ['HudGroup', 'HudChild']});
		Thrender.createObj3s(ecs, scn, obj3Ents);
	}

	/**Create three.js Object3D - create mesh of Obj3.geom (e.g Obj3Type.BOX).
	 * @param {ECS} ecs
	 * @param {THREE.Scene} scene
	 * @param {array<ECS.Entity>} entities
	 * @member Thrender.createObj3s
	 */
	static createObj3s(ecs, scene, entities) {
		var mes = [];
		entities.forEach(function(e, x) {
			// https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
			if (e.Visual.vtype === AssetType.gltf) {
				AssetKeepr.loadGltf(scene, e.Obj3, `assets/${e.Visual.asset}`);
			}
			else{
				// texture and mesh types
				var tex, mat;
				var uniforms = Object.assign({}, e.Obj3.uniforms);
					uniforms = Object.assign(uniforms, e.Visual.uniforms);
				switch (e.Visual.vtype) {
					case AssetType.DomCanvas:
						var alp = e.Visual.paras !== undefined && e.Visual.paras.tex_alpha !== undefined ?
							e.Visual.paras.tex_alpha : 1;
						// create texture of canvas
						AssetKeepr.loadCanvtex2(e.Canvas);
						tex = e.Canvas.tex; // should be undefined now
						mat = new THREE.MeshBasicMaterial({
								opacity: alp,
								// debug note!!! This map must created here for later changing
								// map: new THREE.CanvasTexture(document.getElementById('stub')),
								map: new THREE.CanvasTexture(document.getElementById(e.Canvas.domId)),
								transparent: true,
								side: THREE.DoubleSide,
							});
						// mat.setUniforms(mat, uniforms);
						// Object.assign(mat, uniforms);
						var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
						// can not been used for rendering until html canvas texture is ready,
						// when Canvas.dirty = true
						m.visible = false;
						mes.push(m);
						// add_push(mes, m, e, ecs);
						break;
					case AssetType.mesh:
						var alp = e.Visual.paras !== undefined
								&& e.Visual.paras.tex_alpha !== undefined ?
								e.Visual.paras.tex_alpha : 1;

						if (e.Visual.asset)
							tex = new THREE.TextureLoader().load( `assets/${e.Visual.asset}` );
						else // test and default
							tex = new ramTexture(3, 4, {alpha: alp});

						var def = { map: tex,
									opacity: alp,
									transparent: true,
									side: THREE.DoubleSide,
									depthWrite: true,
									depthTest: true
								};// - for transparent

						if (e.Visual.paras && e.Visual.paras.color)
							Object.assign (def, {color: e.Visual.paras.color});

						mat = e.Visual.material || new THREE.MeshPhongMaterial(def);
						Object.assign(mat, uniforms);

						var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
						mes.push(m);
						// add_push(mes, m, e, ecs);
						break;
					case AssetType.wireframe:
						var alp = e.Visual.paras !== undefined && e.Visual.paras.tex_alpha !== undefined ?
							e.Visual.paras.tex_alpha : 1;

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
						mes.push(m);
						// add_push(mes, m, e, ecs);
						break;
					case AssetType.point:
						// use Obj3.geom vertices as points
						if (!e.Visual.asset) {
							var modp = e.Visual.paras;
							var mat = e.Visual.material
								|| new THREE.ShaderMaterial( { uniforms: xglsl.obj2uniforms(uniforms) } );
							var mesh = Thrender.createObj3points(e.Obj3,
									e.Obj3.geom ? e.Obj3.geom : Obj3Type.SPHERE, mat);
							// FIXME FIXME FIXME must be a bug, add a test case
							mes.push(m);
							// add_push(mes, mesh, e, ecs);
						}
						// load model as points?
						else if (e.Visual.asset) {
							AssetKeepr.loadGltfNodes(`assets/${e.Visual.asset}`,
								e.Visual.paras.nodes,
								(nodes) => {
									// change gltf vertices to points buffer
									var m = Thrender.combineGltfPoints(e.Obj3, nodes, e.Visual.paras);
									// Too late to push mesh into mes now, add to scene directly
									if (scene && m) scene.add(m);
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
							mes.push(pointMesh);
							// add_push(mes, pointMesh, e, ecs);
						}
						break;
					case AssetType.GeomCurve:
						var {curve, path} = Thrender.createCurve(e.Obj3, e.Visual.paras);
						mes.push(curve);
						// add_push(mes, curve, e, ecs);
						if (e.ModelSeqs) {
							// For geomCurve, it's hightly likely this path is needed by MorphingAnim & XTweener
							// Design MEMO
							// what's the better practice for this in ECS pattern?
							if (!e.ModelSeqs.cache)
								e.ModelSeqs.cache = {};
							e.ModelSeqs.cache.path = path;
						}
						break;
					case AssetType.arrow:
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
						mes.push(a);
						// add_push(mes, a, e, ecs);
						break;
					case AssetType.UserMesh:
						// nothing to do
						// TODO support Visual.shader?
						mes.push(e.Obj3.mesh);
						break;
					default:
						console.error('TODO AssetType: ', e.Visual.vtype);
				}

				if (e.Obj3.mesh && e.Obj3.transform) {
					var m4 = new mat4();
					for (var trs of e.Obj3.transform)
						m4.appAffine(trs);

					// if (!e.HudGroup)
						e.Obj3.mesh.matrixAutoUpdate = false;

					m4.put2js(e.Obj3.mesh.matrix);
				}
			}

			if (Array.isArray(e.Obj3.channels)) {
				// e.Obj3.mesh.layers = 1;
				for (var ch of e.Obj3.channels) {
					e.Obj3.mesh.layers.enable( ch );
				}
			}
		});

		if (scene) {
			mes.forEach(function(m, x) {
				scene.add(m);
			});
		}
		else if (x.log >= 5) { // testing
			console.warn('[5] undefined scene with Obj3 meshes: ', mes.length);
		}
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
	 */
	static createObj3points(cmpObj3, geomType, material) {
		if (cmpObj3) {
			var g = Thrender.threeGeometryCase(geomType, cmpObj3.box);
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

	/**1. use {@link xgeom.generateCurve} to generate points
	 * 2. create the THREE.line,
	 * 3. set line to Obj3.mesh
	 * @param {Obj3} cmpObj3
	 * @param {object} paras Visual.paras, @see {@link xgeom.generateCurve}
	 * @return {object} {curve, path}
	 * @member Thrender.createCurve
	 */
	static createCurve(cmpObj3, paras) {
		// var points = xmath.generateCurve(paras);
		// var spline = new THREE.CatmullRomCurve3( points );
		// var samples = spline.getPoints( points.length * 6 ) // subdivisions: 6;
		// var geometrySpline = new THREE.BufferGeometry().setFromPoints( samples );
		var {geomCurve, points} = xgeom.generateCurve(cmpObj3, paras);

		// line = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0x0f0f0f, dashSize: 1, gapSize: 0.05 } ) );
		var line = new THREE.Line( geomCurve, new THREE.LineBasicMaterial( {
				color: paras.color === undefined ? 0x0f7f8f : paras.color,
			 	dashSize: paras.dashSize,
				gapSize: paras.gapSize } ) );
		line.computeLineDistances();

		cmpObj3.mesh = line;
		return {curve: line, path: points};
	}

	/**Create object mesh, put int *cmpObj3*.
	 * @param {Obj3} cmpObj3
	 * @param {Obj3Type} geomType
	 * @param {THREE.Materail} material
	 * @member Thrender.createObj3mesh
	 */
	static createObj3mesh(cmpObj3, geomType, material) {
		if (cmpObj3) {
			var g = Thrender.threeGeometryCase(geomType, cmpObj3.box);
			var m = new THREE.Mesh( g, material );
			if (!!cmpObj3.invisible) m.visible = false;

			cmpObj3.mesh = m;
			return m;
		}
		else console.error(
			'createObj3mesh(): can\'t create Obj3 for undefined Obj3 component. type: ',
			geomType);
	}

	/**<div id='api-threeGeometryCase'>Create geometry for different cases.</div>
	 * @param {Obj3Type} geomType {@link Obj3Type}
	 * @param {array<number>} geomParaArr geometry parameters for the given type.
	 * See {@link Obj3Type} for parameters details.
	 * @return {THREE.BufferGeometry} any subclass of three-js BufferGeometry.
	 * @member Thrender.threeGeometryCase
	 */
	static threeGeometryCase(geomType, geomParaArr) {
		var len = geomParaArr.length;
		if (len < 2) {
			console.error('threeGeometryCase(): Geometry needing at least 2 argument such as w/h.')
			return new THREE.BoxBufferGeometry( 2, 2, 2 );
		}

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
		else if (geomType === Obj3Type.CORN) {
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
		else {
			if (y > 5) {
				console.warn('threeGeometryCase(): maximum for IcosahedronGeometry detail is 5',
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
				throw XError('TODO GEOM Type: ', geomType);
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
	 * @member Thrender.createObj3points
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

	/**
	 * Create particles (THREE.Points) from vertices of mesh.
	 * @param {Obj3} cmpObj3 this enitiy's Obj3 component, uniforms merged to target mesh
	 * @param {THREE.Mesh} fromesh referencing mesh
	 * @param {Visual} cmpVisual this entity's Visual component.
	 * cmVisual.paras.u_tex: texture path
	 * cmVisual.shader: parameters for generate vertex and framgment shaders. see xglsl.xvShader().
	 * @member Thrender.createObj3particles
	 */
	static createObj3particles(cmpObj3, fromesh, cmpVisual) {
		var m0 = fromesh.geometry.attributes[ 'position' ];
		var material;
		var uniforms = {};
		if (cmpVisual.paras && cmpVisual.paras.u_tex) {
			uniforms = {
				// pointTexture: { value: new THREE.TextureLoader().load( "./spark1.png" ) }
				u_tex: { value: new THREE.TextureLoader().load(`assets/${cmpVisual.paras.u_tex}`) }
			};
		}
		else if ((cmpVisual.shader & ShaderFlag.defaultex) === ShaderFlag.defaultex) {
			uniforms = {
				u_tex: { value: AssetKeepr.defaultex() }
			};
		}
		var {vertexShader, fragmentShader} = xglsl.xvShader(cmpVisual.shader, cmpVisual.paras);
		var shadr = cmpVisual.shader & ShaderFlag.mask;
		if (shadr === ShaderFlag.randomParticles
			|| shadr === ShaderFlag.testPoints) {
			Object.assign(uniforms, xglsl.obj2uniforms(cmpObj3.uniforms));

			material = new THREE.ShaderMaterial( {
				uniforms,
				vertexShader,
				fragmentShader,
				blending: THREE.AdditiveBlending,
				depthTest: true,
				transparent: true,
				// vertexColors: THREE.VertexColors
			} );
		}

		var destEnt = x.ecs.getEntity(cmpVisual.asset || cmpVisual.paras.dest || cmpVisual.paras.a_dest);
		if ((cmpVisual.asset || cmpVisual.paras.dest || cmpVisual.paras.a_dest)
			&& !destEnt)
			console.error("The entity referenced by Visual.asset or Visual.paras.dest not foound.");
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
	 * {@link AssetType}: AssetType.refPoint; AssetType.cubeVoxel
	 * @param {Obj3} cmpObj3
	 * @param {Visual} cmpVisual
	 * @return {THREE.Mesh} mesh object can be rendered by {@link Thrender}.
	 * @member Thrender.createCubeVoxel
	 */
	static createCubeVoxel(cmpObj3, cmpVisual) {
		// Design Memo: Adding uniforms without respect to shader type.
		// Is this means Obj3.uniforms is orthogonal to Visual.shader?
		var uniforms = xglsl.formatUniforms(cmpVisual, cmpObj3);

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
	 * @param {Canvas} canvas
	 * @param {x} x {options, ...}
	 * @member Thrender#init
	 */
	init(canvas, x) {
		this.camera = x.xcam.XCamera.cam;
		// renderer
		var renderer = new THREE.WebGLRenderer(
						Object.assign(
						  { canvas: canvas, alpha: true, antialias: true },
							x.options.renderer ) );
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
		var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1.2 );
		light.layers.enableAll();

		scene.add(light);

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
			this.outlinePass.selectedObjects = []
			composer.addPass( this.outlinePass );
			this.composer = composer;
		}

		x.thrender = composer;
		return x;
	}

	/**1. Show picked object outline.<br>
	 * 2. Render with composer or scene render.
	 * @param {number} tick
	 * @param {array<ECS.Entity>} entities
	 * @member Thrender#update
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
}

/**Add the mesh into *arr*, the buffer of objects to be added into main scene, or
 * add as a chuild into the group, if the child entity has a 'group' paras in Obj3.
 * @param {array} arr objects buffer
 * @param {THREE.Mesh} mesh
 * @param {Entity} chld
 * @param {ECS} ecs
 * @return {array} arr
 * @exception {XError} arguments invalid
 * @member Thrender.add_push
 * @function
 * @deprecated
 */
function add_push(arr, mesh, chld, ecs) {
	if (typeof chld.Obj3.group === 'string') {
		const g = ecs.getEntity(chld.Obj3.group);
		g.Obj3.mesh.add(mesh);
	}
	else if (Array.isArray(arr)) {
		// simply push mesh int buffer (array)
		arr.push(mesh);
	}
	else throw new XError('Mesh can not been appended. Arguments invalid:', arr, mesh, chld);
	return arr;
}

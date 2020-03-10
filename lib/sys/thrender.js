/** @namespace xv.ecs.sys */

import * as THREE from 'three';
import {EffectComposer} from '../../packages/three/postprocessing/EffectComposer';
import {RenderPass} from  '../../packages/three/postprocessing/RenderPass';
import {OutlinePass} from '../../packages/three/postprocessing/OutlinePass';

import * as ECS from '../../packages/ecs-js/index';

import {AssetType, ShaderFlag} from '../component/visual';
import {Obj3Type} from '../component/obj3';

import {x} from '../xapp/xworld';
import {ramTexture} from '../xutils/xcommon';
import * as xutils from '../xutils/xcommon';
import AssetKeepr from '../xutils/assetkeepr';
import {vec3, mat4} from '../xmath/vec';
import * as xglsl from '../xutils/xglsl';

const any = ['Obj3'];

/**X renderer of ecs subsystem based on Three.js renderer.
 * @class
 */
export default class Thrender extends ECS.System {
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
		var obj3Ents = ecs.queryEntities({any: any});
		Thrender.createObj3s(ecs, scn, obj3Ents);
	}

	/**Create three.js Object3D - create mesh of Obj3.geom (e.g Obj3Type.BOX).
	 * @param {ECS} ecs
	 * @param {THREE.Scene} scene
	 * @param {array<ECS.Entity>} entities
	 */
	static createObj3s(ecs, scene, entities) {
		var mes = [];
		entities.forEach(function(e, x) {
			// https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
			if (e.Visual.vtype === AssetType.gltf) {
				AssetKeepr.loadGltf(scene, `assets/${e.Visual.asset}`);
			}
			else{
				// texture and mesh types
				var tex, mat;
				var uniforms = Object.assign({}, e.Obj3.uniforms);
				var uniforms = Object.assign(uniforms, e.Visual.uniforms);
				switch (e.Visual.vtype) {
					// if (e.Visual.vtype === AssetType.canvas) {
					case AssetType.canvas:
						// create texture of canvas
						AssetKeepr.loadCanvtex(e.Canvas);
						tex = e.Canvas.tex; // should be undefined now
						mat = new THREE.MeshBasicMaterial({
								// debug note!!! This map must created here for later changing
								map: new THREE.CanvasTexture(document.getElementById('stub')),
								transparent: true,
								side: THREE.DoubleSide,
							});
						// Thrender.setUniforms(mat, uniforms);
						Object.assign(mat, uniforms);
						var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
						mes.push(m);
						break;
					// else if (e.Visual.vtype === AssetType.mesh) {
					case AssetType.mesh:
						var alp = e.Visual.paras !== undefined && e.Visual.paras.tex_alpha !== undefined ?
							e.Visual.paras.tex_alpha : 1;

						if (e.Visual.asset)
							tex = new THREE.TextureLoader().load( `assets/${e.Visual.asset}` );
						else // test and default
							tex = new ramTexture(3, 4, alp);

						var def = { map: tex,
									opacity: alp,
									transparent: true,
									side: THREE.DoubleSide,
									depthWrite: true,
									depthTest: true
								};// - for transparent

						if (e.Visual.paras.color)
							Object.assign (def, {color: e.Visual.paras.color});

						mat = new THREE.MeshPhongMaterial(def);
						Object.assign(mat, uniforms);

						var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
						mes.push(m);
						break;
					// else if (e.Visual.vtype === AssetType.wireframe) {
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

						if (e.Visual.paras.color)
							Object.assign (def, {color: e.Visual.paras.color});

						mat = new THREE.MeshBasicMaterial(def);
						Object.assign(mat, uniforms);

						var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
						mes.push(m);
						break;
					// else if (e.Visual.vtype === AssetType.point) {
					case AssetType.point:
						// use Obj3.geom vertices as points
						if (!e.Visual.asset) {
							var modp = e.Visual.paras;
							var mat = new THREE.ShaderMaterial( { uniforms: xglsl.obj2uniforms(uniforms) } );
							var mesh = Thrender.createObj3points(e.Obj3,
									e.Obj3.geom ? e.Obj3.geom : Obj3Type.SPHERE, mat);
							mes.push(m); // FIXME FIXME FIXME must be a bug, add a test case
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
					// else if (e.Visual.vtype === AssetType.refPoint
					// || e.Visual.vtype === AssetType.cubeVoxel) {
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
						}
						break;
					case AssetType.geomCurve:
						var curv = Thrender.createCurve(e.Obj3, e.Visual.paras);
						// scene.add(curv);
						mes.push(curv);
						break;
					default:
						console.error('TODO AssetType: ', e.Visual.vtype);
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
	 * Difference to createObj3particles: createObj3points create points according
	 * to <i>geomType<i> and Obj3.box.
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

	static createCurve(cmpObj3, paras) {
		// TODO it's parameterized here
		// TODO
		// TODO
		// TODO
		// TODO
		var points = [];
		var r = 800;
		for ( var i = 0; i < paras.segments; i ++ ) {
			var x = Math.random() * r - r / 2;
			var y = Math.random() * r - r / 2;
			var z = Math.random() * r - r / 2;
			points.push( new THREE.Vector3( x, y, z ));
			// TODO add other attributes like colour here
		}
		var spline = new THREE.CatmullRomCurve3( points );
		var samples = spline.getPoints( points.length * 6 ) // subdivisions: 6;
		var geometrySpline = new THREE.BufferGeometry().setFromPoints( samples );
		// line = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( { color: 0x0f0f0f, dashSize: 1, gapSize: 0.05 } ) );
		var line = new THREE.Line( geometrySpline, new THREE.LineBasicMaterial( { color: 0x0f7f8f } ) );
		line.computeLineDistances();
		cmpObj3.mesh = line;
		return line;
	}

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

	static threeGeometryCase(geomType, geomParaArr, mat) {
		var len = geomParaArr.length;
		if (len < 2) {
			console.error('threeGeometryCase(): Geometry needing at least 2 argument such as w/h.')
			return new THREE.BoxBufferGeometry( 2, 2, 2 );
		}

		var {x, y, z, u, v, w} = Object.assign({
			x: geomParaArr[0], y: geomParaArr[1],
			z: len > 2 ? geomParaArr[2] : 1,
			u: len > 3 ? geomParaArr[3] : 1, v: len > 4 ? geomParaArr[4] : 1,
		 	w: len > 5 ? geomParaArr[5] : 1});

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
		else if (geomType === Obj3Type.CYLINDER) {
			g = new THREE.CylinderBufferGeometry( x, y, z, u );
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
		else if (geomType === Obj3Type.LATHE) {
			g = new THREE.LatheBufferGeometry( x, y, z, u );
		}
		else {
			if (y > 5) {
				console.warn('threeGeometryCase(): maximum for IcosahedronGeometry detail is 5',
					`argument value ${y} is ignored.`);
				y = 5;
			}
			if (geomType === Obj3Type.TETRAHEDRON) {
				g = new THREE.TetrahedronBufferGeometry( x, y, z );
			}
			else if (geomType === Obj3Type.DODECAHEDRON) {
				g = new THREE.DodecahedronBufferGeometry( x, y );
			}
			else if (geomType === Obj3Type.OCTAHEDRON) {
				g = new THREE.OctahedronBufferGeometry( x, y );
			}
			else if (geomType === Obj3Type.ICOSAHEDRON) {
				g = new THREE.IcosahedronBufferGeometry( x, y );
			}
			else
				throw XError('TODO GEOM Type: ', geomType);
		}
		return g;
	}

	/**Clone and combine gltf nodes' geometry[position] buffer - the modules vertices.
	 * This only handling Visual.vtype == AssetType.point, making points (vertices)
	 * can basically rendered.
	 * Usually this not enough. The animizer will add more components to animize
	 * points.
	 * @param {xv.Components.Obj3}
	 * @param {array} nodes nodes loaded from gltf.
	 * @param {paras} Visual.paras, define, size, color...
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

		var destEnt = x.ecs.getEntity(cmpVisual.paras.dest || cmpVisual.paras.a_dest);
		if ((cmpVisual.paras.dest || cmpVisual.paras.a_dest)
			&& (!destEnt || !destEnt.Obj3.mesh || !destEnt.Obj3.mesh.geometry.attributes['position']))
			console.error("The visual paras.a_dest is true, but no target mesh was found.");
		else {
			var geometry = xglsl.particlesGeom(cmpVisual.paras, m0,
					destEnt ? destEnt.Obj3.mesh.geometry.attributes['position'] : undefined);
			var mesh = new THREE.Points( geometry, material );
			return mesh;
		}
	}

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
			// vertexColors: THREE.VertexColors
		} );

		var geometry = xglsl.cubeVoxelGeom(cmpVisual.paras.uniforms);
		var mesh = new THREE.Points( geometry, material );
		return mesh;
	}

	init(canvas, x) {
		this.camera = x.xcam.XCamera.cam;
		// renderer
		var renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true});
		var wh;
		if (x.options.canvasize) {
			wh = x.options.canvasize;
		}
		else {
			wh = [800, 400]
			x.options.canvasize = wh;
		}
		renderer.setSize( wh[0],  wh[1] );

		document.body.appendChild( renderer.domElement );
		// scene
		var scene = new THREE.Scene();
		scene.background = x.options.background || new THREE.Color('black');
		// light
		var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1.2 );

		scene.add(light);

		this.scene = scene;
		this.renderer = renderer;
		x.scene = scene;
		x.renderer = renderer;

		// no final composer, needing a RenderPass
		var composer;
		// if (!x.options.effects && !x.options.postEffects) {
			composer = new EffectComposer( this.renderer );
			var renderPass = new RenderPass( scene, this.camera );
			composer.addPass( renderPass );
		// }


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

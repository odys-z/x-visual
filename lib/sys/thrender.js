/** @module xv.ecs.sys */

import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index';
import {AssetType, ShaderFlag} from '../component/visual';
import {Obj3Type} from '../component/obj3';

import {x} from '../xapp/xworld';
import {ramTexture} from '../xutils/xcommon';
import AssetKeepr from '../xutils/assetkeepr';
import * as xutils from '../xutils/xcommon';
import * as xglsl from '../xutils/xglsl';

const has = ['Visual'];

/**X renderer of ecs subsystem based on Three.js renderer.
 * @class
 */
export default class Thrender extends ECS.System {
	constructor(ecs, container, x) {
		super(ecs);
		this.ecs = ecs;
		var scn;
		if (typeof container === 'object') {
			var resltx = this.init(container, x)
			scn = resltx.scene;
		}
		else {
			if (x.log >= 5)
				console.warn('[log 5] Sys.Thrender: container canvas is incorrect, renderer not initialized. Testing? ')
		}

		// init Obj3 objects ( should be covered by mocha )
		// Business entities like created by Cubesys hasn't been visualized here yet,
		// but will present later when updating.
		var obj3Ents = ecs.queryEntities({any: has});
		Thrender.createObj3s(ecs, scn, obj3Ents);
	}

	/**Create three.js Object3D - create mesh of Obj3.geom (e.g Obj3Type.BOX).
	 * @param {ECS} ecs
	 * @param {THREE.Scene} scene
	 * @param {[ECS.Entity]} entities
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
				if (e.Visual.vtype === AssetType.canvas) {
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
				}
				else if (e.Visual.vtype === AssetType.mesh) {
					if (e.Visual.asset)
						tex = new THREE.TextureLoader().load( `assets/${e.Visual.asset}` );
					else // test and default
						tex = new ramTexture(1, 1, {r: 0.2, g: 0.3, b: 0.5});
					mat = new THREE.MeshBasicMaterial({
							map: tex,
							transparent: true,
							side: THREE.DoubleSide,
						});
					Object.assign(mat, uniforms);
					// mat.opacity = 0.6;
					var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
					mes.push(m);
				}
				else if (e.Visual.vtype === AssetType.point) {
					if (!e.Visual.asset) {
						// use Visual.options.Box vertices as points
						var modp = e.Visual.paras;
						// var mat = new THREE.ShaderMaterial( {
						// 	size: modp.size ? modp.size : 10,
						// 	color: modp.color ?
						// 	 	modp.color : xutils.randomColor() } ) ;
						var mat = new THREE.ShaderMaterial( { uniforms: Thrender.toUniforms(uniforms) } );
						var mesh = Thrender.createObj3points(e.Obj3,
								e.Obj3.geom ? e.Obj3.geom : Obj3Type.SPHERE, mat);
						mes.push(m);
					}
					else if (e.Visual.asset) {
						// load model as points?
						AssetKeepr.loadGltfNodes(`assets/${e.Visual.asset}`,
							e.Visual.paras.nodes,
							(nodes) => {
								// change gltf vertices to points buffer
								var m = Thrender.combineGltfPoints(e.Obj3, nodes, e.Visual.paras);
								// Too late to push mesh into mes now, add to scene directly
								if (scene && m) scene.add(m);
							});
					}
				}
				else if (e.Visual.vtype === AssetType.refPoint) {
					var eref = ecs.getEntity(e.Visual.asset);
					if (!eref) {
						console.error('Thrender.createObj3s(): can\'t find referenced entity: ',
								e.Visual.asset);
					}
					else if (!eref.Obj3.mesh) {
						console.error('Thrender.createObj3s(): can\'t find referenced entity mesh: ',
								e, eref);
					}
					else {
						var pointMesh = Thrender.createObj3particles(e.Obj3, eref.Obj3.mesh, e.Visual);
						e.Obj3.mesh = pointMesh;
						mes.push(pointMesh);
					}
				}
				else {
					console.error('TODO AssetType: ', e.Visual.vtype);
				}
			}

			if (e.GpuPickable) {
				// e.GpuPickable.pickid = e.id;
				if (typeof e.GpuPickable.pickid !== 'number') {
					console.error("No pickable id found.",
					       "It's the creators, a.k.a. business handler's responsibility to create a globally unique id (number) for handling GPU pickables.",
						   "Check entity: ", e);
				}
				e.GpuPickable.geom = g;
				e.GpuPickable.tex = tex;
				e.GpuPickable.pos = new THREE.Vector3().copy(m.position);
				e.GpuPickable.rot = new THREE.Vector3().copy(m.rotation);
				e.GpuPickable.scl = new THREE.Vector3().copy(m.scale);
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
			g = new THREE.TorusBufferGeometry( x, y, z, u );
		}
		else if (geomType === Obj3Type.CORN) {
			g = new THREE.ConeBufferGeometry( x, y, z );
		}
		else if (geomType === Obj3Type.CYLINDER) {
			g = new THREE.CylinderBufferGeometry( x, y, z, u );
		}
		else if (geomType === Obj3Type.TETRAHEDRON) {
			g = new THREE.TetrahedronBufferGeometry( x, y, z );
		}
		else if (geomType === Obj3Type.DODECAHEDRON) {
			g = new THREE.DodecahedronBufferGeometry( x, y );
		}
		else if (geomType === Obj3Type.OCTAHEDRON) {
			g = new THREE.OctahedronBufferGeometry( x, y );
		}
		else if (geomType === Obj3Type.ICOSAHEDRON) {
			if (y > 5) {
				console.warn('threeGeometryCase(): maximum for IcosahedronGeometry detail is 5',
					`argument value ${y} is ignored.`);
				y = 5;
			}
			g = new THREE.IcosahedronBufferGeometry( x, y );
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
			// CYLINDER
			console.error('TODO GEOM Type: ', geomType);
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
		if ((cmpVisual.shader & ShaderFlag.texture) === ShaderFlag.texture) {
			uniforms = {
				// pointTexture: { value: new THREE.TextureLoader().load( "./spark1.png" ) }
				u_tex: { value: new THREE.TextureLoader()
							.load( `./asset/${cmpVisual.asset}` ) }
			};
		}
		var {vertexShader, fragmentShader} = xglsl.xvShader(cmpVisual.shader, cmpVisual.paras);
		if (cmpVisual.shader === ShaderFlag.randomParticles
			|| cmpVisual.shader === ShaderFlag.testPoints
			|| cmpVisual.shader === ShaderFlag.uniformParticles) {
			// uniforms.u_morph = 0; // for particle and translate(a_targetpos) compitability
			Object.assign(uniforms, xglsl.obj2uniforms(cmpObj3.uniforms));

			material = new THREE.ShaderMaterial( {
				vertexShader,
				fragmentShader,
				blending: THREE.AdditiveBlending,
				depthTest: true,
				transparent: true,
			} );
			// works for debugging:
			// material = new THREE.PointsMaterial( {size: 20} );
		}

		var sizes = [];
		var colors = [];
		var noise = [];
		var count = m0.count / 3 / m0.itemSize;
		for (var c = 0; c < count; c++) {
			var color = xutils.randomRGB();
			colors.push( color.r, color.g, color.b );
			sizes.push( (Math.random() * 2 - 1 ) );
			if (cmpVisual.noise > 0)
				noise.push( (Math.random() * cmpVisual.noise - cmpVisual.noise / 2 ) );
		}

		var geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', m0.clone(), 3 );
		// geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
		// geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 )
					// .setUsage( THREE.DynamicDrawUsage ) );
		// geometry.setAttribute( 'a_noise', new THREE.Float32BufferAttribute( noise, 1 )
		// 			.setUsage( THREE.DynamicDrawUsage ) );
		var mesh = new THREE.Points( geometry, material );
		return mesh;
	}

	init(canvas, x) {
		this.camera = x.xcam.XCamera.cam;
		// renderer
		var renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true});
		if (x.options.canvasize) {
			renderer.setSize( x.options.canvasize[0], x.options.canvasize[1] );
		}
		else {
			renderer.setSize( 800,  720 );
		}
		// console.log('renderer size: ', renderer.getSize());

		document.body.appendChild( renderer.domElement );
		// scene
		var scene = new THREE.Scene();
		scene.background = x.options.background || new THREE.Color('black');
		// light
		var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );

		scene.add(light);

		this.scene = scene;
		this.renderer = renderer;
		x.scene = scene;
		x.renderer = renderer;
		return x;
	}

	update(tick, entities) {
		if (this.camera) {
			this.camera.updateProjectionMatrix();
			this.renderer.render(this.scene, this.camera);
		}
		else if (x.log >= 5)
			console.warn('[log 5] Thrender.update(): No camera, testing?');
	}
}

Thrender.query = {any: has};

/** @module xv.ecs.sys */

import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index';
import {AssetType} from '../component/visual';
import {Obj3Type} from '../component/obj3';
import {ramTexture} from '../xutils/xcommon';
import AssetKeepr from '../xutils/assetkeepr';

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
			console.warn('Sys.Thrender: container canvas is incorrect, renderer not initialized. Testing? ')
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
					var m = createObj3mesh(e.Obj3, e.Obj3.geom);
					mes.push(m);
				}
				else if (e.Visual.vtype === AssetType.mesh) {
					if (e.Visual.asset !== null)
						tex = new THREE.TextureLoader().load( `assets/${e.Visual.asset}` );
					else // test and default
						tex = new ramTexture(1, 1, {r: 0.2, g: 0.3, b: 0.5});
					mat = new THREE.MeshBasicMaterial({
							map: tex,
							transparent: true,
							side: THREE.DoubleSide,
						});
					var m = createObj3mesh(e.Obj3, e.Obj3.geom);
					mes.push(m);
				}
				else if (e.Visual.vtype === AssetType.point) {
					if (e.Visual.asset === null && e.Visual.options.model) {
						// use Visual.options.Box vertices as points
						var mesh = createObj3mesh(e.Obj3, e.Obj3.geom);
						verts = new Float32Array( )
					}
					else if (e.Visual.asset !== null) {
						// load model as points?
						AssetKeepr.loadGltf(undefined, `assets/${e.Visual.asset}`,
								(gltf) => {
									// TODO change gltf vertices to points buffer
									var m = createObj3mesh(e.Obj3, e.Obj3.geom);
									mes.push(m);
								});
					}
					return;	// continue
				}
				else {
					console.error('TODO AssetType: ', e.Visual.vtype);
				}

//				var {w, h, d} = Object.assign({w: e.Obj3.box[0], h: e.Obj3.box[1], d: e.Obj3.box[2]});
//
//				var g;
//				if (e.Obj3 && e.Obj3.geom === Obj3Type.BOX) {
//					g = new THREE.BoxBufferGeometry( w, h, d );
//				}
//				else if (e.Obj3 && e.Obj3.geom === Obj3Type.PLANE) {
//					g = new THREE.PlaneBufferGeometry( w, h, d );
//				}
//				else {
//					console.error('TODO GEOM Type: ', e.Obj3.geom);
//				}
//
//				var m = new THREE.Mesh( g, mat );
//				if (!!e.Obj3.invisible) m.visible = false;
//
//				e.Obj3.mesh = m;

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
		else { // testing
			console.warn('undefined scene with Obj3 meshes: ', mes.length);
		}
	}
	
	createObj3Meshh(cmpObj3, obj3geom) {
		var {w, h, d} = Object.assign({w: cmpObj3.box[0], h: cmpObj3.box[1], d: cmpObj3.box[2]});

		var g;
		if (cmpObj3 && obj3geom === Obj3Type.BOX) {
			g = new THREE.BoxBufferGeometry( w, h, d );
		}
		else if (e.Obj3 && obj3geom === Obj3Type.PLANE) {
			g = new THREE.PlaneBufferGeometry( w, h, d );
		}
		else {
			console.error('TODO GEOM Type: ', obj3geom);
		}

		var m = new THREE.Mesh( g, mat );
		if (!!cmpObj3.invisible) m.visible = false;
		return m;
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
		else console.warn('Thrender.update(): No camera, testing?');
	}
}

// TODO docs: this is not used for scene is not updated with entities
Thrender.query = {any: has};

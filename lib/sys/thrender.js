/** @module xv.ecs.sys */

import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index';
import {AssetType} from '../component/visual'

const has = ['Visual', 'Obj3'];

/**X renderer of ecs subsystem based on Three.js renderer.
 * @class
 */
export default class Thrender extends ECS.System {
	constructor(ecs, container, options) {
		super(ecs);
		this.ecs = ecs;
		var scn;
		if (typeof container === 'object') {
			var resltopts = this.init(container, options)
			scn = resltopts.x.scene;
		}
		else {
			console.warn('Sys.Thrender: container canvas is incorrect, renderer not initialized. Testing? ')
		}

		// init Obj3 objects ( should be covered by mocha )
		// Business entities like created by Cubesys hasn't been visualized here yet,
		// but will present later when updating.
		var obj3Ents = ecs.queryEntities({has});
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
			if (e.Visual.vtype !== AssetType.mesh)
				console.error('TODO AssetType: ', e.Visual.vtype);
			var tex = new THREE.TextureLoader().load( `assets/${e.Visual.asset}` );
			var mat = new THREE.MeshBasicMaterial({ map: tex,
						transparent: true,
						side: THREE.DoubleSide,
					 });

			var {w, h, d} = Object.assign({w: e.Obj3.box[0], h: e.Obj3.box[1], d: e.Obj3.box[2]});
			var g = new THREE.BoxBufferGeometry( w, h, d );	// TODO switch with options
			var m = new THREE.Mesh( g, mat );
			mes.push(m);

			if (e.GpuPickable) {
				e.GpuPickable.eid = e.id;
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
			console.warn('undefined scene with Obj3 meshes: ', mes.length());
		}
	}

	init(canvas, opts) {
		this.camera = opts.x.xcam.XCamera.cam;
		// renderer
		var renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true});
		if (opts.canvasize) {
			renderer.setSize( opts.canvasize[0], opts.canvasize[1] );
		}
		else {
			renderer.setSize( 800, 720 );
		}
		document.body.appendChild( renderer.domElement );
		// scene
		var scene = new THREE.Scene();
		// light
		var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );

		scene.add(light);

		this.scene = scene;
		this.renderer = renderer;
		opts.x.scene = scene;
		opts.x.renderer = renderer;
		return opts;
	}

	update(tick, entities) {
		if (this.camera) {
			this.camera.updateProjectionMatrix();
			this.renderer.render(this.scene, this.camera);
		}
		else console.warn('Thrender.update(): No camera, testing?');
	}
}

// Thrender.query = {has: ['Visual', 'Obj3']};
Thrender.query = {has};

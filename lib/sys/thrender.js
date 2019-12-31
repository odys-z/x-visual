/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';

import * as THREE from 'three';

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
			// this.createObj3d(ecs, scn);
		}
		else {
			console.warn('Sys.Thrender: container canvas is incorrect, renderer not initialized. Testing? ')
		}

		// init Obj3 objects, should be covered by mocha
		// Business entities like created by Cubesys hasn't been here yet,
		// but will present later when updating.

		// var obj3Ents = ecs.queryEntities({has: ['Visual', 'Obj3']});
		var obj3Ents = ecs.queryEntities({has});
		this.createObj3s(ecs, scn, obj3Ents);
	}

	/**Create three.js Object3D - create mesh of Obj3.geom (e.g Obj3Type.BOX).
	 * @param {ECS} ecs
	 * @param {THREE.Scene} scene
	 * @param {[ECS.Entity]} entities
	 */
	createObj3s(ecs, scene, entities) {
		var mes = [];
		entities.forEach(function(e, x) {
			var tex = new THREE.TextureLoader().load( 'assets/ruler256.png' );
			var mat = new THREE.MeshBasicMaterial({ map: tex });
			var m = new THREE.Mesh(
						new THREE.BoxBufferGeometry( 200, 120, 320 ),	// TODO switch with options
						mat );
			mes.push(m);
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
		// console.log('rendering scene: ', this.scene.uuid);
		// var removings = [];
		// var es = this.entities;
		// entities.forEach(function(e, x) {
		// 	if (!es[e.id]) {
		// 		es[e.id] = e;
		// 	}
		// });

		if (this.camera) {
			this.camera.updateProjectionMatrix();
			// FIXME This is not ECS
			this.renderer.render(this.scene, this.camera);
		}
		else console.warn('Testing Thrender.update()?');
	}
}

// Thrender.query = {has: ['Visual', 'Obj3']};
Thrender.query = {has};

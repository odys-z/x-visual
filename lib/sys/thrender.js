/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';

import * as THREE from 'three';

/**
 * @class
 */
export default class Thrender extends ECS.System {
	constructor(ecs, container, options) {
		super(ecs);
		this.ecs = ecs;
		if (typeof container === 'object') {
			var s = this.init(container, options)
			this.scene = s.scene;
			this.renderer = s.renderer;
			this.camera = options.x.xcam.XCamera.cam;
			options.x.scene = s.scene;
			options.x.renderer = s.renderer;
		}
		else {
			console.warn('Sys.Thrender: container canvas is incorrect, renderer not initialized. Testing? ')
		}
	}

	init(canvas, opts) {
		// var canvas = document.querySelector(opts.canvId);
		// renderer
		var renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true});
		renderer.setSize( 800, 720 );
		document.body.appendChild( renderer.domElement );
		// scene
		var scene = new THREE.Scene();
		// light
		// light = new THREE.DirectionalLight(0xffffff, 0.5);
		var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );

		scene.add(light);
		console.log('created scene: ', scene.uuid);
		return {scene, renderer}
	}

	update(tick, entities) {
		// console.log('rendering scene: ', this.scene.uuid);
		if (this.camera) {
			this.camera.updateProjectionMatrix();
			// FIXME This is not ECS
			this.renderer.render(this.scene, this.camera);
		}
		else console.warn('Testing Thrender.update()?');
	}
}

Thrender.query = {has: ['Visual']};

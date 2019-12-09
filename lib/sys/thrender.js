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
		var s = this.init(options)
		this.scene = s.scene;
		this.renderer = s.renderer;
	}

	init(canvas, opts) {
	    // var canvas = document.querySelector(opts.canvId);
	    // renderer
	    var renderer = new THREE.WebGLRenderer({canvas: canvas, alpha: true});
	    // scene
	    var scene = new THREE.Scene();
	    // light
	    // light = new THREE.DirectionalLight(0xffffff, 0.5);
	    var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );

	    scene.add(light);
		return {scene, renderer}
	}

	update(tick, entities) {
	}
}

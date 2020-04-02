/** @namespace xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';
import * as THREE from 'three';
// import * as Ctrls from 'three-orbitcontrols';
import {XMapControls, XOrbitControls} from '../../packages/three/orbit-controls'

/**
 * @class
 */
export default class Mapctrl extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// camera
		if (options && options.renderer && options.renderer.domElement) {
			// var w = options.renderer.domElement.width;
			// var h = options.renderer.domElement.height;
			// this.cam = new THREE.PerspectiveCamera(90, 2, 0.1, 5000);
			// this.cam.position.z = 400;
			//
			// // controls
			// this.contrl = new THREE.MapControls(options.camera, options.renderer.domElement);
			this.contrl = new XMapControls(options.camera, options.renderer.domElement);
		}
		else {
			console.warn('Sys.Mapctrl: options.renderer.domElement is undefined, testing?');
		}
	}

	update(tick, entities) {
		// move camera only response to user's commands
		var v = x.xview;
		if (v.flag === 0)
			return;

		v.cmds.forEach( function(c, x) {
			if (x.log >= 5)
				// it's actually done by OrbitControl etc.
				console.log('[5] moving camera: ', c.cmd);
		} );
	}
}

Mapctrl.query = {
  any: ['Input']
};

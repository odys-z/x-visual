import * as ECS from '../../packages/ecs-js/index';
import * as THREE from 'three';
import {XMapControls, XOrbitControls} from '../../packages/three/orbit-controls'

import {vec3} from '../xmath/vec';

/**
 * @class Mapctrl
 */
export default class Mapctrl extends ECS.System {
	/**
	 * @constructor Mapctrl
	 */
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// camera
		if (options && options.renderer && options.renderer.domElement) {
			// this.contrl = new THREE.MapControls(options.camera, options.renderer.domElement);
			this.contrl = new XMapControls(options.camera, options.renderer.domElement);
			if (options.lookAt instanceof vec3)
				this.contrl.target = options.lookAt.js();
		}
		else {
			console.warn('Sys.Mapctrl: options.renderer.domElement is undefined, testing?');
		}
	}

	update(tick, entities) {
		// move camera only responsing to user's commands
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

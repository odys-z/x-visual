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
		// commands are subscribed with 'UserCmd'
		if (entities) {
	    	for (const v of entities) {
				// v = xview
				if (v.id !== 'xview' || v.CmdFlag.flag === 0)
					// move camera
					continue;

				v.UserCmd.cmds.forEach(function(c, x){
					if (c.cmd === 'up')
						console.log('camera is moving up...');
					else if (c.cmd === 'left')
						console.log('camera is moving left...');
					else if (c.cmd === 'down')
						console.log('camera is moving down...');
					else if (c.cmd === 'right')
						console.log('camera is moving right...');
				});
			}
		}

		// why not working?
		for (const change of this.changes) {
			console.log('SysCamera.update(): change = ', change);
		}
	}
}

Mapctrl.query = {
  has: ['UserCmd', 'CmdFlag']
};

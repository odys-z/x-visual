/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';
import * as THREE from 'three';
import * as Ctrls from 'three-orbitcontrols';

/**
 * @class
 */
export default class CamCtrl extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// camera
		var w = options.renderer.domElement.width;
		var h = options.renderer.domElement.height;
		this.cam = new THREE.PerspectiveCamera(90, w / h, 0.1, 5000);

		// controls
		this.contrl = new THREE.MapControls(this.cam, options.renderer.domElement);
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
				});
			}
		}

		// why not working?
		for (const change of this.changes) {
			console.log('SysCamera.update(): change = ', change);
		}
	}
}

CamCtrl.query = {
  has: ['UserCmd', 'CmdFlag']
};

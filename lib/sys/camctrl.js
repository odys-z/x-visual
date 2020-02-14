/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';
import {XMapControls} from './opensource/orbit-controls'
import {x} from '../xapp/xworld'

/**
 * @class
 */
export default class CamCtrl extends ECS.System {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// camera
		if (options && options.renderer && options.renderer.domElement) {
			// this.contrl = new THREE.MapControls(options.camera, options.renderer.domElement);
			this.contrl = new XMapControls(options.camera, options.renderer.domElement);
		}
		else {
			if (x.log >= 5)
				console.warn('[5] Sys.Camctrl: options.renderer.domElement is undefined, testing?');
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

CamCtrl.query = {
  has: ['UserCmd', 'CmdFlag']
};

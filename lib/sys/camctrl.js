
import * as ECS from '../../packages/ecs-js/index';
import {XMapControls} from '../../packages/three/orbit-controls'
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
			this.contrl = new XMapControls(options.camera, options.renderer.domElement);
		}
		else {
			if (x.log >= 5)
				console.warn('[5] Sys.Camctrl: options.renderer.domElement is undefined, testing?');
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

CamCtrl.query = {
  has: ['Input']
};

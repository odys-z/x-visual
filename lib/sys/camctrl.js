
import * as ECS from '../../packages/ecs-js/index';
import {XMapControls} from '../../packages/three/orbit-controls'
import {x} from '../xapp/xworld'

/**Default camera contorl.
 *
 * Query: {has: ['Input']}
 * @class CamCtrl
 */
export default class CamCtrl extends ECS.System {
	/**
	 * @param {ECS} ecs
	 * @param {x} x {options, ...}
	 * @constructor CamCtrl */
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// camera
		if (options && options.renderer && options.renderer.domElement) {
			this.contrl = new XMapControls(options.camera, options.renderer.domElement);
		}
		else {
			if (x.log >= 5)
				console.warn('[5] Sys.CamCtrl: options.renderer.domElement is undefined, testing?');
		}
		x.control = this;
	}

	/**
	 * @param {int} tick
	 * @param {Array.<Entity>} entities
	 * @member CamCtrl#update
	 * @function
	 */
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

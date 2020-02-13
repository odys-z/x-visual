/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';
import GpuPicker from './opensource/gpupicker';
import {x} from '../xapp/xworld';

const iffall = ['UserCmd', 'CmdFlag'];

/**
 * <h4>User inputs handler.</h4>
 * This sybsystem registers multiple UserCmd compoments, listening to all user
 * inputs and interpret events into UserCmds.
 *
 * <h5>1. Commands Handling Process</h5>
 * This class doesn't update by frame. Each time updated, the UI evencts buffered
 * will be converted to commands in xview Entity. The next time updating, the commands
 * will be cleared.
 *
 * User can set interpret and pick functions to handle UI events and convert to
 * commands which will be broadcasted by xview.
 *
 * <h5>2. About Gpu Picking</h5>
 * This class implement a GPU picker for picking object. This requires a THREE.renderer
 * for handling picking process.
 * So, <i>Input</i> needing a THREE.rendere by default.
 * If GPU picking not needed, provide x parameter of constructor a dummy mouse
 * event handler.
 *
 * @class
 */
export default class Input extends ECS.System {
	/**
	 * Create Input handler of 'xview'.
	 * @param {ECS} ecs
	 * @param {object} x xworld.x
	 */
	constructor(ecs, x) {
		super(ecs);
		var wind = x.window;
		this.xview = ecs.getEntity('xview')
		if (typeof this.xview !== 'object') {
			console.error('Sys.Input need an xview to work!')
			return
		}

		var qcmd = []
		var interpretor = typeof x.interpretor === 'function'?
						x.inerpretor : this.interpret;

		// by default, picker is function returned by gpuPicker()

		if (x.picker === undefined) {
			x.gpuPicker = new GpuPicker(x, x.renderer);
			x.picker = this.gpuPicker(x);
		}

		if (wind && wind.addEventListener) {
			wind.addEventListener('keydown', (e) => {
				this.dirty = true;
				var cmd = interpretor('key', e);
				qcmd.push(cmd);
			});

			var mousehandler = (e) => {
				this.dirty = true;
				var cmd = x.picker('mouse', e)
				qcmd.push(cmd);
			};
			wind.addEventListener('mousemove', mousehandler);
			wind.addEventListener('mouseup', mousehandler);
		}
		else {
			if (x.log >= 5)
			console.warn('[5] Sys.Input: window object is not correct, testing?');
		}

		this.qcmd = qcmd;
		this.dirty = false; // waiting inputs
	}

	update(tick, entities) {
		if (!this.dirty) return;

		var e = entities.values().next().value; // xview
		var cmds = e.UserCmd.cmds;
		if (cmds.length > 0) {
			cmds.splice(0, cmds.length);
			e.CmdFlag.flag = 0;
			this.dirty = false;
		}
		if (this.qcmd.length > 0) {
			this.dirty = true;
			this.qcmd.forEach(function(cmd, cx) {
				cmds.push(cmd);
			});
			this.qcmd.splice(0, this.qcmd.length);
			e.CmdFlag.flag = cmds.length;
		}
	}

	interpret(code, e) {
		var cmd = {code, 'key': e.keyCode};
		if (e.keyCode === 0x57 || e.keyCode === 0x77) // w
			cmd.cmd = 'up';
		else if (e.keyCode === 0x41 || e.keyCode === 0x61) // a
			cmd.cmd = 'left';
		else if (e.keyCode === 0x53 || e.keyCode === 0x73) // s
			cmd.cmd = 'down';
		else if (e.keyCode === 0x44 || e.keyCode === 0x64) // d
			cmd.cmd = 'right';

		return cmd;
	}

	gpuPicker(x) {
		const camera = x.xcam.XCamera.cam;
		const renderer = x.renderer;
		const scene = x.scene;
		const gpicker = x.gpuPicker;

		return function (code, e) {
			// var cmd = {code, 'button': evt.button, e: evt};
			// return cmd;
			if (code === 'mouse') {
				// var oid = gpicker.pickTest([e.clientX, e.clientY], scene, camera);
				var oid = gpicker.pickTest([e.clientX, e.clientY], camera);
				// console.log("picking: ", oid);
				var cmd = {code, 'cmd': oid, e};
				return cmd;
			}
		};
	}
}

Input.query = { iffall };

/** @namespace xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';
// import GpuPicker from './opensource/gpupicker';
import {x} from '../xapp/xworld';
import {XError} from '../xutils/xcommon';

const iffall = ['Input', 'UserCmd', 'CmdFlag'];

/**
 * <h4>User inputs handler.</h4>
 * This sybsystem registers multiple UserCmd compoments, listening to all user
 * inputs and interpret events into UserCmds.
 *
 * <h5>1. Commands Handling Process</h5>
 * This class also updated by ECS frame. Each time updated, the UI evencts buffered
 * will be converted to commands in xview Entity. The next time updating, the commands
 * will be cleared.
 *
 * <h5>2. About Gpu Picking</h5>
 * If there is a GpuPickable component in an entity, his class also put mouse
 * position into it.
 * TODO If GPU picking is not needed, user should provide x parameter of constructor
 * a dummy mouse event handler.
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

		// if (x.picker === undefined) {
		// 	x.gpuPicker = new GpuPicker(x, x.renderer);
		// 	x.picker = this.gpuPicker(x);
		// }

		if (wind && wind.addEventListener) {
			var me = this;
			wind.addEventListener('keydown', (e) => {
				me.dirty = true;
				var cmd = interpretor('key', e);
				qcmd.push(cmd);
			});

			var mousehandler = (e) => {
				me.dirty = true;
				if (x.picker) {
					// shouldn't reach here befor v1.0
					var cmd = x.picker('mouse', e)
				}
				else {
					var cmd = interpretor('mouse', e);
				}
				if (cmd)
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

		// var e = entities.values().next().value;
		// var cmds = e.UserCmd.cmds;
		// if (cmds.length > 0) {
		// 	cmds.splice(0, cmds.length);
		// 	e.CmdFlag.flag = 0;
		// 	this.dirty = false;
		// }
		// if (this.qcmd.length > 0) {
		// 	this.dirty = true;
		// 	this.qcmd.forEach(function(cmd, cx) {
		// 		cmds.push(cmd);
		// 	});
		// 	this.qcmd.splice(0, this.qcmd.length);
		// 	e.CmdFlag.flag = cmds.length;
		// }

		// suppose there are multiple view
		for (var v of entities) {
			var cmds = v.UserCmd.cmds;
			if (cmds.length > 0 & v.Input.tick < tick) {
				cmds.splice(0, cmds.length);
				v.Input.tick = tick;
				v.CmdFlag.flag = 0;
			}
		}

		if (!this.dirty) return;

		for (var v of entities) {
			var cmds = v.UserCmd.cmds;
			if (this.qcmd.length > 0) {
				this.qcmd.forEach(function(cmd, cx) {
					cmds.push(cmd);
				});
				v.CmdFlag.flag = cmds.length;
			}
		}

		if (this.qcmd.length > 0)
			this.qcmd.splice(0, this.qcmd.length);
		this.dirty = false;
	}

	interpret(code, e) {
		var cmd;
		if (code === 'key') {
			cmd = {code, 'key': e.keyCode};
			if (e.keyCode === 0x57 || e.keyCode === 0x77) // w
				cmd.cmd = 'up';
			else if (e.keyCode === 0x41 || e.keyCode === 0x61) // a
				cmd.cmd = 'left';
			else if (e.keyCode === 0x53 || e.keyCode === 0x73) // s
				cmd.cmd = 'down';
			else if (e.keyCode === 0x44 || e.keyCode === 0x64) // d
				cmd.cmd = 'right';
		}
		else if (code === 'mouse') {
			if (e.clientX === clientxy.x && e.clientY === clientxy.y)
				console.log(e.clientX, e.clientY)
			else {
				clientxy.x = e.clientX;
				clientxy.y = e.clientY;
				cmd = {code, client: [e.clientX, e.clientY], e};
			}
		}
		else throw new XError(`Input(): what's here for code ${code}`);

		return cmd;
	}

	// gpuPicker(x) {
	// 	const camera = x.xcam.XCamera.cam;
	// 	const renderer = x.renderer;
	// 	const scene = x.scene;
	// 	const gpicker = x.gpuPicker;
	//
	// 	return function (code, e) {
	// 		// var cmd = {code, 'button': evt.button, e: evt};
	// 		// return cmd;
	// 		if (code === 'mouse') {
	// 			// var oid = gpicker.pickTest([e.clientX, e.clientY], scene, camera);
	// 			var oid = gpicker.pickTest([e.clientX, e.clientY], camera);
	// 			// console.log("picking: ", oid);
	// 			var cmd = {code, 'cmd': oid, e};
	// 			return cmd;
	// 		}
	// 	};
	// }
}

const clientxy = {};

Input.query = { iffall };

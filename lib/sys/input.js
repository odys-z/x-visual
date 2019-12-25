/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';

/**
 * <h4>User inputs handler.</h4>
 * This sybsystem registers multiple UserCmd compoments, listening to all user
 * inputs and interpret events into UserCmds.
 *
 * This class doesn't update by frame. Each time updated, the UI evencts buffered
 * will be converted to commands in xview Entity. The next time updating, the commands
 * will be cleared.
 *
 * User can set interpret and pick functions to handle UI events and convert to
 * commands which will be broadcasted by xview.
 * @class
 */
export default class Input extends ECS.System {
	constructor(ecs, window, options) {
		super(ecs);
		this.xview = ecs.getEntity('xview')
		if (typeof this.xview !== 'object') {
			console.error('Sys.Input need an xview to work!')
			return
		}

		var qcmd = []
		var interpretor = options !== undefined && typeof options.interpretor === 'function'?
			options.inerpretor : this.interpret;

		var picker = options !== undefined && typeof options.picker === 'function'?
			options.picker : this.pick;

		if (window && window.addEventListener) {
			window.addEventListener('keydown', (e) => {
				this.dirty = true;
				var cmd = interpretor('key', e);
				qcmd.push(cmd);
			});

			var mousehandler = (e) => {
				this.dirty = true;
				var cmd = picker('mouse', e)
				qcmd.push(cmd);
			};
			window.addEventListener('mousemove', mousehandler);
			window.addEventListener('mouseup', mousehandler);
		}
		else {
			console.warn('Sys.Input: window object is not correct, testing?');
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

	pick(code, e) {
		var cmd = {code, 'button': e.button, e};
		return cmd;
	}
}

Input.query = {
  has: ['UserCmd', 'CmdFlag']
};

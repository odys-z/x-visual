import * as ECS from '../../packages/ecs-js/index';
import {x} from '../xapp/xworld';
import {XError} from '../xutils/xcommon';

const any = ['Input'];

/**
 * <h4>User inputs handler.</h4>
 * This sybsystem registers Input compoments, listening to all user inputs and
 * interpret events into UserCmds.
 *
 * <h5>1. Commands Handling Process</h5>
 * This class is always updated by x-visual frame. Each time updated, the buffering
 * UI events will be converted to commands and saved in xview's command queue.
 * The next time updating, the command queue will be cleared.
 *
 * In x-visual 0.2, the xview is changed to a global accessable singleton.
 * The command queue must not been modified other than by Input.
 *
 * Xview is also exported as xworld property, xv.xworld.xview.
 *
 * <h5>2. About Gpu Picking</h5>
 * If there is a GpuPickable component in an entity, his class also put mouse
 * position into it.
 *
 * TODO If GPU picking is not needed, user should provide x parameter of constructor
 * a dummy mouse event handler.
 *
 * @class Input
 */
export default class Input extends ECS.System {
	/**
	 * Create Input handler of 'xview'.
	 * @param {ECS} ecs
	 * @param {object} x xworld.x
	 * @constructor Input
	 */
	constructor(ecs, x, view) {
		super(ecs);
		var wind = x.window;
		// this.xview = ecs.getEntity('xview')
		this.xview = view;
		view.Input = this;
		if (typeof this.xview !== 'object') {
			console.error('Sys.Input need an xview to work!')
			return
		}

		var qcmd = []
		var interpretor = typeof x.interpretor === 'function'?
						x.inerpretor : this.interpret;

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
		var v = this.xview; // for shorter expression
		var cmds = this.xview.cmds;
		if (cmds.length > 0 && v.tick < tick) {
			cmds.splice(0, cmds.length);
			v.tick = tick;
			v.flag = 0;
		}

		if (!this.dirty) return;

		if (this.qcmd.length > 0) {
			v.keflag = 0;
			this.qcmd.forEach(function(cmd, cx) {
				cmds.push(cmd);
				v.keflag |= cmd.flag;
			});
			v.flag = cmds.length;

			this.qcmd.splice(0, this.qcmd.length);
		}
		this.dirty = false;
	}

	/** default input events interpretor.
	 * @param {string} code
	 * @param {MouseEvent} e
	 * @return {object} {code, cmd, client, e}<br>
	 * where<br>
	 * code = 'key' | 'mouse'<br>
	 * cmd = Cmd | MouseEvent.type<br>
	 * client: [x, y] only for mouse event<br>
	 * e: MouseEvent, only for mouse event<br>
	 * @function
	 */
	interpret(code, e) {
		var cmd;
		if (code === 'key') {
			cmd = {code, 'key': e.keyCode, e};
			// numbers
			if (0x30 <= e.keyCode && e.keyCode <= 0x3a )
				cmd.cmd = e.keyCode - 0x30;
			//
			else if (e.keyCode === 0x57 || e.keyCode === 0x77)      // w
				cmd.cmd = 'up';
			else if (e.keyCode === 0x41 || e.keyCode === 0x61) // a
				cmd.cmd = 'left';
			else if (e.keyCode === 0x53 || e.keyCode === 0x73) // s
				cmd.cmd = 'down';
			else if (e.keyCode === 0x44 || e.keyCode === 0x64) // d
				cmd.cmd = 'right';
			else if (e.keyCode === 0x09)    // tab
				cmd.cmd = 'tab';
			else if (e.keyCode === 20)      // CapsLock
				cmd.cmd = 'cap';
			else if (e.keyCode === 27)      // esc
				cmd.cmd = 'esc';
			else if (e.keyCode === 93)      // context menu
				cmd.cmd = 'menu';
			else if (e.keyCode === 92)      // meta
				cmd.cmd = 'meta';

			e.flag = 0;
			if (e.ctrlKey)
				e.flag |= 1 << 0;
			if (e.shiftKey)
				e.flag |= 1 << 1;
			if (e.altKey)
				e.flag |= 1 << 2;
		}
		else if (code === 'mouse') {
			if (e.type === 'mousemove'
				&& e.offsetX === offsetxy.x && e.offsetY === offsetxy.y)
				return true;
			else {
				offsetxy.x = e.offsetX;
				offsetxy.y = e.offsetY;
				cmd = { code,
						cmd: e.type,
						client: [e.offsetX, e.offsetY],
						e };
			}
		}
		else throw new XError(`Input(): what's here for code ${code}`);

		return cmd;
	}
}

const offsetxy = {};

Input.query = { any };


import * as ECS from '../../../packages/ecs-js/index'
import XSys from '../../sys/xsys'
import {Obj3Type} from '../../component/obj3';
import {Pie} from '../../component/ext/chart'


/**
 * Subsystem rendering 2d pie chart in a gl_point.
 *
 * Why another pie? D3Pie can not have animation.
 *
 * TODO Yet to be done.
 *
 * reference:<br>
 * https://thebookofshaders.com/07/<br>
 * http://tobyschachman.com/Shadershop/
 * @class XPie
 */
export default class XPie extends XSys {
    constructor(ecs, options, json) {
        super(ecs);
        this.logged = false;
        this.ecs = ecs;
        this.cmd = [];

        ecs.registerComponent('Pie', Pie);

        if (!json)
            throw new XError('XPie can only been created synchronously with json data for initializing');

        if (ecs) {
            debug1(ecs, json, options);
        }
    }

    update(tick, entities) {
        if (x.xview.flag > 0) {
            this.cmd.push(...x.xview.cmds);
        }

        for (const e of entities) {
            for (var cmd of this.cmd) {
                if (cmd.code === 'mouse' && e.GpuPickable && e.GpuPickable.picked
                    && this.onMouse(cmd.cmd, e))
                    break;
            }
        }
        this.cmd.splice(0);
    }

    onMouse(cmd, e) {
        if (e.CmpTweens) {
            var twCmd;
            switch (cmd) {
                case 'mousemove':
                    twCmd = e.Pie.onOver;
                    return true;
                case 'click':
                case 'mouseup':
                    twCmd = e.Pie.onClick;
                    if (twCmd !== undefined)
                        pieClick(e, twCmd);
                    return true;
                default:
            }
        }
        else {
            if (!this.logged) {
                console.error('XPie.onMouse(): No such tween. eid: ', e.id);
                this.logged = true;
            }
        }
        return false;
    }
}

XPie.query = {
    any: ['Pie']
};

function pieClick(e, twCmd) {
    if (e.CmpTweens !== undefined) {
        e.CmpTweens.startCmds.push(e.Pie.cmd.click);
    }
}

function debug1(ecs, json, options) {
    var scl = options.xscale || 20;
    var ixVal = json.coordinates.length;

    var p11 = ecs.createEntity({
        id: 'p11',
        Obj3: { geom: Obj3Type.Cylinder,
                box: [10, 10, 10] },
        Visual:{vtype: AssetType.Point,
               },
        Pie:{
            onOver: 0,    // tweens[0], blinking
            onClick:1     // uniform
        },
        GpuPickable: {},
        ModelSeqs: {script: [
             [{ mtype: xv.XComponent.AnimType.U_ALPHA,
                paras: {
                    start: Infinity,
                    duration: 0.3,
                    alpha: [0.3, 0.9]
             } }],
             // [{ mtype: xv.XComponent.AnimType.UNIFORM,
             //    paras: {
             //        start: Infinity,
             //        duration: 1.1,
             //        u_arg1: 0
             // } }],
          ]},
        CmpTweens: {}
    });
}

/** @module xv.chart.xsankey */

import * as ECS from '../../../packages/ecs-js/index'
import XSys from '../../sys/xsys'
import {Obj3Type} from '../../component/obj3';
import {Sankey} from '../../component/ext/chart'
import {AssetType, ShaderFlag} from '../../component/visual';

/**
 * Subsystem rendering 3d sankey chart
 *
 * @class XSankey
 */
export default class XSankey extends XSys {
    constructor(ecs, options, json) {
        super(ecs);
        this.logged = false;
        this.ecs = ecs;
        this.cmd = [];

		ecs.registerComponent('Sankey', Sankey);

        if (!json)
            throw new XError('XSankey can only been used synchronously with json data for initializing');

        var scl = options.xscale || 80;
        var ixVal = json.coordinates.length;
        if (ecs) {
            // json.vectors[0] = [1, 1, 6]
            var h11 = json.vectors[0][ixVal] * scl;
            var h10 = json.vectors[1][ixVal] * scl;
            var y11 = h10 + h11/2;
            var y10 = h10/2;
            var z1 = scl;
            var x1 = scl;

            var n11 = ecs.createEntity({
                id: 'n11',
                Obj3: { geom: Obj3Type.Cylinder,
                        // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
                        box: [10, 10, y11] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{
                    onOver: 0,       // tweens[0], blinking
                    onClick:[1, 2]   // forth & back
                },
                GpuPickable: {pickid: 4},
                ModelSeqs: {script: [
                     [{ mtype: xv.XComponent.AnimType.ALPHA,
                        paras: {d
                            start: Infinity,
                            duration: 0.3,     // seconds
                            alpha: [0.3, 0.9]
                     } }],
                     [{ mtype: xv.XComponent.AnimType.POSITION,
                        paras: {
                            start: Infinity,
                            duration: 1.1,     // seconds
                            translate: [[0., y11, 0.], [0, 0, z1]]
                     } }],
                     [{ mtype: xv.XComponent.AnimType.POSITION,
                        paras: {
                            start: Infinity,
                            duration: 1.2,     // seconds
                            translate: [[0, 0, z1], [0, y11, 0]],
                     } }],
                  ]},
                CmpTweens: {}
            });

            var n10 = ecs.createEntity({
                id: 'n10',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, h10] },
                Visual:{vtype: AssetType.mesh,
                       },
                GpuPickable: {pickid: 3},
                Sankey:{onOver: 0},
                ModelSeqs: {script: [
                     [{ mtype: xv.XComponent.AnimType.ALPHA,
                        paras: {
                            start: Infinity,
                            duration: 1.2,     // seconds
                            alpha: [0.3, 0.9]
                     }}],
                  ]},
                CmpTweens: {}
            });

            var h01 = json.vectors[2][ixVal] * scl;
            var y01 = h01/2
            var n01 = ecs.createEntity({
                id: 'n01',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, h01] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{
                    onOver: 0,       // tweens[0], alpha
                    onClick:[1, 2]   // forth & back
                },
                GpuPickable: {pickid: 2},
                ModelSeqs: {script: [
                     [{ mtype: xv.XComponent.AnimType.ALPHA,
                        paras: {d
                            start: Infinity,
                            duration: 0.32,    // seconds
                            alpha: [0.3, 0.9]
                     } }],
                     [{ mtype: xv.XComponent.AnimType.POSITION,
                        paras: {
                            start: Infinity,
                            duration: 1.12,    // seconds
                            translate: [[x1, y01, 0.], [x1, 0, z1]],
                     }}],
                     [{ mtype: xv.XComponent.AnimType.POSITION,
                        paras: {
                            start: Infinity,
                            duration: 1.22,    // seconds
                            translate: [[x1, 0, z1], [x1, y01, 0]],
                     }}],
                  ]},
                CmpTweens: {}
            });

            var h00 = json.vectors[3][ixVal] * scl;
            var n00 = ecs.createEntity({
                id: 'n00',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, h00, 20] },
                Visual:{vtype: AssetType.mesh,
                       },
                GpuPickable: {pickid: 1},
                Sankey:{onOver: 0},
                ModelSeqs: {script: [
                     [{ mtype: xv.XComponent.AnimType.ALPHA,
                        paras: {
                            start: Infinity,
                            duration: 1.23,    // seconds
                            alpha: [0.3, 0.9]
                     }}],
                  ]},
                CmpTweens: {}
            });
        }
    }

    update(tick, entities) {
        for (const e of entities) {
            if (e.CmdFlag) {
                 if (e.CmdFlag.flag > 0) {
                    this.cmd.push(...e.UserCmd.cmds);
                }
                else this.cmd = [];
                continue;
            }

            for (var cmd of this.cmd) {
                if (cmd.code === 'mouse' && e.GpuPickable && e.GpuPickable.picked
                    && this.onMouse(cmd.cmd, e))
                    break;
            }
        }
    }

    onMouse(cmd, e) {
        if (e.CmpTweens) {
            var twCmd;
            switch (cmd) {
                case 'mousemove':
                    twCmd = e.Sankey.onOver;
                    break;
                case 'click':
                case 'mouseup':
                    twCmd = e.Sankey.onClick;
		            if (twCmd !== undefined)
		                sankeyClick(e, twCmd);
                    break;
                default:
            }
        }
        else {
            if (!this.logged) {
                console.error('XSankey.onMouse(): No such tween. eid: ', e.id);
                this.logged = true;
            }
        }
    }
}

function sankeyClick(e, twCmd) {
    if (e.CmpTweens !== undefined) {
        if (Array.isArray(twCmd)) {
            if (!e.Sankey.cmd)
                e.Sankey.cmd = {};
            if (e.Sankey.cmd.click === twCmd[0])
                e.Sankey.cmd.click = twCmd[1];
            else
                e.Sankey.cmd.click = twCmd[0];
        }
        e.CmpTweens.startCmds.push(e.Sankey.cmd.click);
    }
}

XSankey.query = {
    // iffall: ['CmdFlag', 'Obj3', 'ModelSeqs', 'Sankey', 'GpuPickable']
    any: ['CmdFlag', 'Sankey']
};

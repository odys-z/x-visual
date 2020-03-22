/** @module xv.chart.xsankey */

import * as ECS from '../../../packages/ecs-js/index'
import XSys from '../xsys'
import {Obj3Type} from '../component/obj3';
import {AssetType, ShaderFlag} from '../component/visual';

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

        if (!json)
            throw new XError('XSankey can only been used synchronously with json data for initializing').

        var scl = options.xscale || 10;
        if (ecs) {
            var h11 = json.vectors[0] * scl;
            var h10 = json.vectors[1] * scl;
            var y11 = h10 + h11/2;
            var y10 = h10/2;
            var z1 = scl;
            var x1 = scl;

            var n11 = ecs.createEntity({
                id: 'n11',
                Obj3: { geom: Obj3Type.Cylinder,
                        // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
                        box: [10, 10, y11 * scl] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{
                    onOver: 0,       // tweens[0], blinking
                    onClick:[1, 2]   // forth & back
                },
                GpuPickable: {pickid: 4},
                ModelSeqs: {script: [
                     [{ mtype: xv.XComponent.AnimType.POSITION,
                        paras: {
                            duration: 1.1,     // seconds
                            positions: [[0., y11, 0.], [0, 0, z1]]
                     } }],
                     [{ mtype: xv.XComponent.AnimType.POSITION,
                        paras: {
                            duration: 1.1,     // seconds
                            positions: [[0, 0, z1], [0, y11, 0]],
                     } }],
                     [{ mtype: xv.XComponent.AnimType.ALPHA,
                        paras: {duration: 1.2,     // seconds
                            alpha: [0.3, 0.9]
                     }}],
                    ]}
            });

            var n10 = ecs.createEntity({
                id: 'n10',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, json.vectors[1] * scl] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{},
                GpuPickable: {pickid: 3},
                ModelSeqs: {script: [
                     [{ mtype: xv.XComponent.AnimType.ALPHA,
                        paras: {
                            duration: 1.2,     // seconds
                            alpha: [0.3, 0.9]
                     }}],
                    ]}
            });

            var n01 = ecs.createEntity({
                id: 'n01',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, json.vectors[2] * scl] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{},
                GpuPickable: {pickid: 2},
                ModelSeqs: {script: [
                     [{ mtype: xv.XComponent.AnimType.POSITION,
                        paras: {
                            duration: 1.1,     // seconds
                            positions: [[x1., y01, 0.], [x1, 0, z1]],
                     }}],
                     [{ mtype: xv.XComponent.AnimType.POSITION,
                        paras: {
                            duration: 1.1,     // seconds
                            positions: [[x1, 0, z1], [x1, y01, 0]],
                     }}],
                     [{ mtype: xv.XComponent.AnimType.ALPHA,
                        paras: {
                            duration: 1.2,     // seconds
                            alpha: [0.3, 0.9]
                     }}],
                    ]}
            });

            var n00 = ecs.createEntity({
                id: 'n00',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, json.vectors[3] * scl] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{},
                GpuPickable: {pickid: 1},
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
                    && onMouse(cmd.cmd, e))
                    break;
            }
        }
    }

    onMouse(cmd, e) {
        if (e.CmpTweens) {
            var twCmd;
            switch (cmd) {
                case 'mousemove':
                    twCmd = e.Sankey.paras.onOver;
                    break;
                case 'click':
                    twCmd = e.Sankey.paras.onClick;
                    break;
                default:
            }
            if (twCmd)
                sankeyCmd(e, twCmd);
        }
        else {
            if (!thes.logged) {
                console.error('XSankey.onMouse(): No such tween. eid: ', e.id);
                thes.logged = true;
            }
        }
    }
}

function sankeyCmd(e, twCmd) {
    if (e.CmpTweens !== undefined) {
        if (Array.isArray(twCmd)) {
            if (!e.Sankey.cmd)
                e.sankey.cmd = {};
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

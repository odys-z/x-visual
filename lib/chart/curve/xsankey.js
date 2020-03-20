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
        this.ecs = ecs;

        if (!json)
            throw new XError('XSankey can only been used synchronously with json data for initializing').

        var scl = options.xscale || 10;
        if (ecs) {
            var n11 = ecs.createEntity({
                id: 'n11',
                Obj3: { geom: Obj3Type.Cylinder,
                        // radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
                        box: [10, 10, json.vectors[0]] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{},
            });

            var n10 = ecs.createEntity({
                id: 'n10',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, json.vectors[1]] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{},
            });

            var n10 = ecs.createEntity({
                id: 'n01',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, json.vectors[2]] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{},
            });

            var n10 = ecs.createEntity({
                id: 'n01',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [10, 10, json.vectors[3]] },
                Visual:{vtype: AssetType.mesh,
                       },
                Sankey:{},
            });
        }
    }

    update(tick, entities) {
        if (this.logcnt < 2) {
            this.logcnt += 1;
            console.log('cube.update(): ', tick, entities)
        }

        for (const e of entities) {
            if (e.CmdFlag) {
                 if (e.CmdFlag.flag > 0) {
                    // handling command like start an animation here
                    this.cmd = e.UserCmd.cmds[0].cmd;
                }
                else this.cmd = undefined;
            }
        }
    }
}

XSankey.query = {
    iffall: ['CmdFlag', 'Obj3', 'ModelSeqs', 'Sankey']
};

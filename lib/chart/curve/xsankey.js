/** @module xv.chart.xsankey */

import * as ECS from '../../../packages/ecs-js/index'
import XSys from '../xsys'
import {Obj3Type} from '../component/obj3';
import {AssetType, ShaderFlag} from '../component/visual';

/**
 * Subsystem rendering 3d sankey chart
 * @class XSankey
 */
export default class XSankey extends XSys {
    constructor(ecs, options, json) {
        super(ecs);
        this.ecs = ecs;

		if (!json)
			throw new XError('XSankey can only been used synchronously with json data for initializing').

        if (ecs) {
            var cube = ecs.createEntity({
                id: 'parallel-sankey',
                Obj3: { geom: Obj3Type.Cylinder,
                        box: [] },    // geometry parameters, for BOX, it's bounding box
                Visual:{vtype: AssetType.geomCurve,
                        paras: {points: [100, 0, 0, 200, 0, 0],  // static p0, p1
                                segments: 5} },
                Sankey:{bar: 'bar'},
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
    iffall: ['CmdFlag', 'Obj3', 'Visual', 'ModelSeqs', 'Sankey']
};


import * as xv from 'x-visual'
import * as THREE from 'three'

/**
 * Subclass for rendering data objects
 * @class
 */
export default class Parallel extends xv.XSys {
    constructor(ecs, options) {
        super(ecs);
        this.ecs = ecs;

        this.logcnt = 0;

        // create a cube with options
        if (ecs) {
            var cube = ecs.createEntity({
                id: 'paralchart',
                Obj3: { geom: xv.XComponent.Obj3Type.PATH,
                        box: [20] },    // geometry parameters, for PATH, it's curve segments
                Visual:{vtype: xv.AssetType.geomCurve,
                        paras: {points: [100, 0, 0, 200, 0, 0],  // static p0, p1
                                segments: 5} },
                Glow: { paras: [ ] },
            });
        }
    }

    update(tick, entities) {
        for (const e of entities) {
            // if (e.CmdFlag) {
            //      if (e.CmdFlag.flag > 0) {
            //         // handling command like start an animation here
            //         this.cmd = e.UserCmd.cmds[0].cmd;
            //     }
            //     else this.cmd = undefined;
            // }
        }
    }
}

Cube.query = {
    iffall: ['Visual', 'CmdFlag']
};

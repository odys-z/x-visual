import * as xv from 'x-visual'
import * as THREE from 'three'

/**
 * Subclass for rendering parallel axis
 * @class Parallel
 */
export default class Parallel extends xv.XSys {
    constructor(ecs, options) {
        super(ecs);
        this.ecs = ecs;

        this.logcnt = 0;

        // create a cube with options
        if (ecs) {
            var cube = ecs.createEntity({
                id: 'parallel-sankey',
                Obj3: { geom: xv.XComponent.Obj3Type.PATH,
                        box: [] },    // geometry parameters, for BOX, it's bounding box
                Visual:{vtype: xv.AssetType.GeomCurve,
                        paras: {points: [100, 0, 0, 200, 0, 0],  // static p0, p1
                                segments: 5} },
            });
        }
    }

    update(tick, entities) {
        if (this.logcnt < 2) {
            this.logcnt += 1;
            console.log('cube.update(): ', tick, entities)
        }

        for (const e of entities) {
             if (e.flag > 0) {
                // handling command like start an animation here
                this.cmd = e.UserCmd.cmds[0].cmd;
            }
            else this.cmd = undefined;
        }
    }
}

Cube.query = {
    iffall: ['Visual']
};

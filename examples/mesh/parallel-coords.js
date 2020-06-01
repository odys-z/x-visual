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
            var a = ecs.createEntity({
                id: 'parallel-s',
                Obj3: { geom:   xv.XComponent.Obj3Type.PointSects,
                        box:   [10, 1, 1] },
                Visual:{vtype:  xv.AssetType.DynaSects,
                        paras: {sects:[[[ 0, 0,  0], [ 0, 100,  0]],
                                       [[30, 0,  0], [30,  80,  0]],
                                       [[60, 0,  0], [60, 100,  0]],
                                       [[ 0, 0, 30], [ 0, 100, 30]],
                                       [[30, 0, 30], [30,  80, 30]],
                                       [[60, 0, 30], [60,  80, 30]],
                                       [[90, 0, 30], [90,  80, 30]]],
                                origin: [-60, 0, 0],
                                linewidth: 4,
                                scale: [2, 1, 2]} },
            });

            var b =ecs.createEntity({
                id: 'squre',
                Obj3: { geom: xv.XComponent.Obj3Type.PointCurve,
                        box: [9],  // curve division
                        mesh: undefined },
                Visual:{vtype: xv.AssetType.GeomCurve,
                        paras: {points: [[0, 0, -50], [100, 0, -50]],
                                origin: [-60, 0, 0],
                                color: 0xffff00, linewidth: 1} },
                FlowingPath: { paras: [ ] }
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

Parallel.query = {
    iffall: ['Visual']
};

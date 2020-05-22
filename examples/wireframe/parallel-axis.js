
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

        // create a cube with options
        if (ecs) {
            var cube = ecs.createEntity({
                id: 'paralchart',
                Obj3: { geom: xv.XComponent.Obj3Type.PointSect,
                        box: [20] },
                Visual:{vtype: xv.AssetType.GeomCurve,
                        paras: {points: [100, 0, 0, 200, 0, 0],  // static p0, p1
                                segments: 5} },
                Glow: { paras: [ ] },
            });
        }
    }

    update(tick, entities) {
        for (const e of entities) {
        }
    }
}

Parallel.query = { iffall: ['Visual'] };

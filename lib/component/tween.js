/** @module xv.ecs.comp.anim */

const RotXYZTween = {
    properties: {
        idx: 0,
        frames: 0,
        target: [0, 0, 0],
        current: [0, 0, 0],
        dirty: false,
        param: {}
    }
};

const TransTween = {
    properties: {
        idx: 0,
        frames: 0,
        trans: [0, 0, 0],
        scale: [0, 0, 0]
    }
}

const PathTween = {
    properties: {
        idx: 0,
        frames: 0,
        ptype: '',
        param: {},
    }
}

export {RotXYZTween, TransTween, PathTween};

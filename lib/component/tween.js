/** @module xv.ecs.comp.anim */
const TweenOf = {
	ROT_SIMPLE: 1,
}

const RotaTween = {
	properties: {
		rotation: [0, 0, 0],
		duration: 1000, // 1 second
		repeat: false,
		animator: TweenOf.ROT_SIMPLE,
		script: {},
		tween: {},
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

export { TweenOf, RotaTween, TransTween, PathTween };

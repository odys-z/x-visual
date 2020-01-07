/** @module xv.ecs.comp.anim */

/** TODO script details */
const TweenScript = {
	USER: 1,
	/** script:{cmd: 'start command',
			deg: 'target degree',
			axis: '[x, y, z]',
			meshcomp: 'component name', e.g. 'Obj3',
			meshname: e.g. 'mesh' of Obj3 } */
	ROT_MESH: 2,
	TRANS_MESH: 3,
	PATH_MESH: 4,
};

const UserTween = {
	properties: {
		duration: 1000, // 1 second
		repeat: false,
		playing: true,
		animator: TweenScript.USER,
		script: undefined,
		tweener: undefined
	}
};

const CmpTween = {
	properties: {
		duration: 1000, // 1 second
		repeat: false,
		playing: true,
		animator: TweenScript.USER,
		script: undefined,
		tweener: undefined
	}
};
export { TweenScript, CmpTween, UserTween };
/*
const RotaTween = {
	properties: {
		duration: 1000, // 1 second
		repeat: false,
		playing: true,
		animator: TweenScript.ROT_MESH,
		script:{cmdcomp: 'UserCmd',
				cmd: ['w', 's'],
				deg: 45,
				axis: [1, 0, 0],
				meshcomp: 'Visual',
				meshname: 'mesh',
				ease: undefined},
		tween: undefined
	}
};

const TransTween = {
	properties: {
		duration: 1000, // 1 second
		repeat: false,
		playing: true,
		animator: TweenScript.TRANS_MESH,
		script: {},
		tween: undefined
	}
};

const PathTween = {
	properties: {
		duration: 1000, // 1 second
		repeat: false,
		playing: true,
		animator: TweenScript.PATH_MESH,
		script: {},
		tween: undefined
	}
};

export { TweenScript, RotaTween, TransTween, PathTween };
*/

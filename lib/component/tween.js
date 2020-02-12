/**This file could probably be replaced by xtween.js in version 0.2
 * @module xv.ecs.comp.anim */

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

	/** Morph models using points */
	MORPH_MODEL: 5,
};

const UserTween = {
	properties: {
		duration: 1000, // 1 second TODO replace by tween
		repeat: false,	// TDOD delete: tween has this
		playing: true,	// TDOD delete: tween has this
		animator: TweenScript.USER,
		script: undefined,
		tweener: undefined
	}
};

const CmpTween = {
    properties: {
		tname: 'uu-name',	// name referenced by animizer, see example of bween-rot.html
        isPaused: false,
        pauseStart: null,
        object: undefined,	// Tweening target, e.g. mesh.rotation
        valuesStart: {},
        valuesEnd: {},
        valuesStartRepeat: {},
        duration: 1000,
        repeat: 0,
        repeatDelayTime: undefined,
        yoyo: false,
        isPlaying: false,
		isCompleted: false, // added by ody, XTweener.update use this to schedule new tween to play
        reversed: false,
        delayTime: 0,
        startTime: null,
        easingFunction: undefined,			// default: TWEEN.Easing.Linear.None,
        interpolationFunction: undefined,	// default: TWEEN.Interpolation.Linear,
        chainedTweens: [],	// deprecated

        // this._onStartCallback = null;
        onStartHandler: null,
        // this._onStartCallbackFired = false;
		// ?
        // this._onUpdateCallback = null;
        onUpdateHandler: null,
        // this._onRepeatCallback = null;
        onRepeatHandler: null,
        // this._onCompleteCallback = null;
        onCompleteHandler: null,
        // this._onStopCallback = null;
        onStopHandler: null,
        // this._group = group || TWEEN;
        // id: TWEEN.nextId()
    },
	multiset: true,
	mapBy: 'tname'
};

const CmpTweens = {
	properties: {
		twindx: undefined,// tweening index, {row-index: col-index}
		tweens: undefined
	}
}

export { TweenScript, UserTween, CmpTween, CmpTweens };
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

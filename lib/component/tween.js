/**This file could probably be replaced by xtween.js in version 0.2
 * @namespace xv.ecs.comp.anim */

/** TODO script detail
 * @type TweenScript */
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

/**@deprecated
 * @type UserTween */
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

/** TODO script detail
 * @type CmpTween */
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

/** TODO script detail
 * @type CmpTweens */
const CmpTweens = {
	properties: {
		startCmds: [],
		twindx: undefined,// tweening index, {row-index: col-index}
		tweens: undefined
	}
}

export { TweenScript, UserTween, CmpTween, CmpTweens };

/**This file could probably be replaced by xtween.js in version 0.2
 */

/**Tween animation script type.
 * @memberof XComponent
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

	/** Morph models using points
	 * @const */
	MORPH_MODEL: 5,
};

/**@deprecated
 * @memberof XComponent
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
 * @memberof XComponent
 * @type CmpTween */
const CmpTween = {
    properties: {
		tname: 'uu-name',	// name referenced by animizer, see example of bween-rot.html
        isPaused: false,
        pauseStart: null,
        object: undefined,	// Tweening target, e.g. mesh.rotation
        valuesStart: undefined,
        valuesEnd: undefined,
        valuesStartRepeat: undefined,
        duration: 1000,
        repeat: 0,
        repeatDelayTime: undefined,
        yoyo: false,
        isPlaying: false,
		isCompleted: false, // added by ody, XTweener.update use this to schedule new tween to play
        reversed: false,
        delayTime: 0,
        startTime: null,
        easingFunction: undefined,          // default: TWEEN.Easing.Linear.None,
        interpolationFunction: undefined,   // default: TWEEN.Interpolation.Linear,
        chainedTweens: [],                  // deprecated
		m0: undefined,                      // affine snapshot
		parent: undefined,                  // parent a.k.a. CmpTweens
        // this._onStartCallback = null;
        onStartHandler: null,
        // this._onStartCallbackFired = false;
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

/**Mainly an array of tween sequence. Each sequence represent an animation
 * sequence driven by XTweener.
 *
 * @type CmpTweens
 * @memberof XComponent
 */
const CmpTweens = {
	properties: {
		startCmds: undefined,// array of index
		twindx: undefined, // tweening index, {row-index: col-index}
		onZinc: undefined, // on all tweens updated in one update loop (inc Z power).
		// m0s: undefined,
		tweens: undefined,
		idle: true,	       // all sequence are idle
		idleRising: false, // all tweens completed in this update
		playRising: false, // any tween started in this update
	}
}

export { TweenScript, UserTween, CmpTween, CmpTweens };

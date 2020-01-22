/**Modified to adapting to ECS.
 * Source from:
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 *
 * System XTweener should replacing animators.
 *
 * @module xv.ecs.sys.tween
 */

import * as ECS from '../../../packages/ecs-js/index';
import x from '../../xapp/xworld';

function XTweenException(message) {
	this.message = message;
	this.name = 'XTweenException';
}

// var _Group = function () {
// 	this._tweens = {};
// 	this._tweensAddedDuringUpdate = {};
// };
//
// _Group.prototype = {
const iffTween = {any: ['CmpTween']}
export default class XTweener extends ECS.System {
	constructor (ecs, x) {
		super(ecs);
		this.ecs = ecs;

		const entities = ecs.queryEntities( iffTween );
		this.initTweens (ecs, entities);
	}

	initTweens (ecs, entities) {
		if (entities)
			entities.forEach(function(e, i) {
				if (!e.CmpTween.easingFunction)
					e.CmpTween.easingFunction = TWEEN.Easing.Linear.None;
				if (!e.CmpTween.interpolationFunction)
					e.CmpTween.interpolationFunction = TWEEN.Interpolation.Linear;
				// TODO morphize here
				// TODO morphize here
				// TODO morphize here
				// TODO morphize here
			});
	}

	getAll () {
		throw new XTweenException('Why asking XTweener.TWEEN to getAll?');
		return Object.keys(this._tweens).map(function (tweenId) {
			return this._tweens[tweenId];
		}.bind(this));
	}

	removeAll () {
		throw new XTweenException('Why asking XTweener.TWEEN to removeAll?');
		this._tweens = {};
	}

	add (tween) {
		throw new XTweenException('Why asking XTweener.TWEEN to add component?');
		this._tweens[tween.getId()] = tween;
		this._tweensAddedDuringUpdate[tween.getId()] = tween;
	}

	remove (tween) {
		throw new XTweenException('Why asking XTweener.TWEEN to remove component?');
		delete this._tweens[tween.getId()];
		delete this._tweensAddedDuringUpdate[tween.getId()];
	}

	/*
	update: function (time, preserve) {
		var tweenIds = Object.keys(this._tweens);

		if (tweenIds.length === 0) {
			return false;
		}

		time = time !== undefined ? time : TWEEN.now();

		// Tweens are updated in "batches". If you add a new tween during an
		// update, then the new tween will be updated in the next batch.
		// If you remove a tween during an update, it may or may not be updated.
		// However, if the removed tween was added during the current batch,
		// then it will not be updated.
		while (tweenIds.length > 0) {
			this._tweensAddedDuringUpdate = {};

			for (var i = 0; i < tweenIds.length; i++) {

				var tween = this._tweens[tweenIds[i]];

				if (tween && tween.update(time) === false) {
					tween._isPlaying = false;

					if (!preserve) {
						delete this._tweens[tweenIds[i]];
					}
				}
			}

			tweenIds = Object.keys(this._tweensAddedDuringUpdate);
		}

		return true;

	}
	*/

	update (tick, entities) {
		var time = x.lastUpdate;
		entities.forEach(function(e, ix) {
			var tween = e.CmpTween;
			if (tween && tween.isPlaying) {
				tween.isPlaying = this.updateTween(tween, time);
				if (e.preserve === false) {
					// delete this._tweens[tweenIds[i]];
					// what's here?
					// e.deprecated = true;
				}
			}
		});
	}

	updateTween (cmp, time) {
		var property, elapsed, value;

		if (time < cmp.startTime) return true;

		if (cmp.onStartCallbackFired === false) {
			if (cmp.onStartCallback !== null) {
				cmp.onStartCallback(cmp.object);
			}
			cmp.onStartCallbackFired = true;
		}

		elapsed = (time - cmp.startTime) / cmp.duration;
		elapsed = (cmp.duration === 0 || elapsed > 1) ? 1 : elapsed;
		value = cmp.easingFunction(elapsed);

		for (property in cmp.valuesEnd) {
			// Don't update properties that do not exist in the source object
			if (cmp.valuesStart[property] === undefined) continue;

			var start = cmp.valuesStart[property] || 0;
			var end = cmp.valuesEnd[property];

			if (end instanceof Array) {
				cmp.object[property] = cmp.interpolationFunction(end, value);
			} else {
				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {
					if (end.charAt(0) === '+' || end.charAt(0) === '-') {
						end = start + parseFloat(end);
					} else {
						end = parseFloat(end);
					}
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					cmp.object[property] = start + (end - start) * value;
				}
			}
		}

		if (cmp.onUpdateCallback !== null) {
			cmp.onUpdateCallback(cmp.object, elapsed);
		}

		if (elapsed === 1) {
			if (cmp.repeat > 0) {
				if (isFinite(cmp.repeat)) {
					cmp.repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in cmp.valuesStartRepeat) {
					if (typeof (cmp.valuesEnd[property]) === 'string') {
						cmp.valuesStartRepeat[property] = cmp.valuesStartRepeat[property] + parseFloat(cmp.valuesEnd[property]);
					}

					if (cmp.yoyo) {
						var tmp = cmp.valuesStartRepeat[property];

						cmp.valuesStartRepeat[property] = cmp.valuesEnd[property];
						cmp.valuesEnd[property] = tmp;
					}
					cmp.valuesStart[property] = cmp.valuesStartRepeat[property];
				}

				if (cmp.yoyo) {
					cmp.reversed = !cmp.reversed;
				}

				if (cmp.repeatDelayTime !== undefined) {
					cmp.startTime = time + cmp.repeatDelayTime;
				} else {
					cmp.startTime = time + cmp.delayTime;
				}

				if (cmp.onRepeatCallback !== null) {
					cmp.onRepeatCallback(cmp.object);
				}

				return true;

			} else {

				if (cmp.onCompleteCallback !== null) {

					cmp.onCompleteCallback(cmp.object);
				}

				for (var i = 0, numChainedTweens = cmp.chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					cmp.chainedTweens[i].start(cmp.startTime + cmp.duration);
				}
				return false;
			}
		}
		return true;
	}
};

XTweener.Query = iffTween;

const TWEEN = {};

TWEEN._nextId = 0;
TWEEN.nextId = function () {
	return TWEEN._nextId++;
};

// Include a performance.now polyfill.
// In node.js, use process.hrtime.
if (typeof (self) === 'undefined' && typeof (process) !== 'undefined' && process.hrtime) {
	TWEEN.now = function () {
		var time = process.hrtime();

		// Convert [seconds, nanoseconds] to milliseconds.
		return time[0] * 1000 + time[1] / 1000000;
	};
}
// In a browser, use self.performance.now if it is available.
else if (typeof (self) !== 'undefined' &&
         self.performance !== undefined &&
		 self.performance.now !== undefined) {
	// This must be bound, because directly assigning this function
	// leads to an invocation exception in Chrome.
	TWEEN.now = self.performance.now.bind(self.performance);
}
// Use Date.now if it is available.
else if (Date.now !== undefined) {
	TWEEN.now = Date.now;
}
// Otherwise, use 'new Date().getTime()'.
else {
	TWEEN.now = function () {
		return new Date().getTime();
	};
}


/** TWEEN equivolent, a CmpTween (TWEEN.Tween) component operation helper.
 * API Stype: XTweener.Tween(CmpTween).to(CmpTween, properties, duration);
 * */
TWEEN.Tween = function(cmpTween) {
	const cmp = cmpTween;

	return new function() {
		this.getId = function () { return cmp.id; }
		this.isPlaying = function () { return cmp.isPlaying; }
		this.isPaused = function () { return cmp.isPaused; }

		this.to = function (cmp, properties, duration) {
			cmp.valuesEnd = Object.create(properties);
			if (duration !== undefined) {
				cmp.duration = duration;
			}
			return this;
		}

		// duration: function duration(d) {
		this.duration = function (d) {
			cmp.duration = d;
			return this;
		}

		this.start = function (time) {
			// cmp.group.add(this);
			cmp.isPlaying = true;
			cmp.isPaused = false;
			// cmp.onStartCallbackFired = false;
			cmp.startTime = time !== undefined ? typeof time === 'string' ? TWEEN.now() + parseFloat(time) : time : TWEEN.now();
			cmp.startTime += cmp.delayTime;

			for (var property in cmp.valuesEnd) {
				// Check if an Array was provided as property value
				if (cmp.valuesEnd[property] instanceof Array) {
					if (cmp.valuesEnd[property].length === 0) {
						continue;
					}
					// Create a local copy of the Array with the start value at the front
					cmp.valuesEnd[property] = [cmp.object[property]].concat(cmp.valuesEnd[property]);
				}

				// If `to()` specifies a property that doesn't exist in the source object,
				// we should not set that property in the object
				if (cmp.object[property] === undefined) {
					continue;
				}

				// Save the starting value, but only once.
				if (typeof(cmp.valuesStart[property]) === 'undefined') {
					cmp.valuesStart[property] = cmp.object[property];
				}
				if ((cmp.valuesStart[property] instanceof Array) === false) {
					cmp.valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
				}
				cmp.valuesStartRepeat[property] = cmp.valuesStart[property] || 0;
			}
			return this;
		}

		this.stop = function () {
			if (!cmp.isPlaying) {
				return this;
			}

			// this.group.remove(this);
			cmp.isPlaying = false;
			cmp.isPaused = false;

			if (cmp.onStopCallback !== null) {
				cmp.onStopCallback(cmp.object);
			}

			cmp.stopChainedTweens();
			return this;
		}

		this.end = function () {
			cmp.update(Infinity);
			return this;
		}

		this.pause = function (time) {
			if (cmp.isPaused || !cmp.isPlaying) {
				return this;
			}

			cmp.isPaused = true;
			cmp.pauseStart = time === undefined ? TWEEN.now() : time;
			// this.group.remove(this);
			return this;
		}

		this.resume = function (time) {
			if (!cmp.isPaused || !cmp.isPlaying) {
				return this;
			}

			cmp.isPaused = false;
			cmp.startTime += (time === undefined ? TWEEN.now() : time)
							- cmp.pauseStart;
			cmp.pauseStart = 0;
			// this.group.add(this);
			return this;
		}

		this.stopChainedTweens = function () {
			for (var i = 0, numChainedTweens = cmp.chainedTweens.length; i < numChainedTweens; i++) {
				cmp.chainedTweens[i].stop();
			}
		}

		// group (group) {
		// 	this.group = group;
		// 	return this;
		// }

		this.delay = function (amount) {
			cmp.delayTime = amount;
			return cmp;
		}

		this.repeat = function (times) {
			cmp.repeat = times;
			return cmp;
		}

		this.repeatDelay = function (amount) {
			cmp.repeatDelayTime = amount;
			return cmp;
		}

		this.yoyo = function (yoyo) {
			cmp.yoyo = yoyo;
			return this;
		}

		this.easing = function (easingFunction) {
			cmp.easingFunction = easingFunction;
			return this;
		}

		this.interpolation = function (interpolationFunction) {
			cmp.interpolationFunction = interpolationFunction;
			return this;
		}

		this.chain = function () {
			cmp.chainedTweens = arguments;
			return this;
		}

		this.onStart = function (callback) {
			cmp.onStartCallback = callback;
			return this;
		}

		this.onUpdate = function (callback) {
			cmp.onUpdateCallback = callback;
			return this;
		}

		// onRepeat: function onRepeat(callback) {
		this.onRepeat = function (callback) {
			cmp.onRepeatCallback = callback;
			return this;
		}

		this.onComplete = function (callback) {
			cmp.onCompleteCallback = callback;
			return this;
		}

		this.onStop = function (callback) {
			cmp.onStopCallback = callback;
			return this;
		}
	}

	/* repaced by sys.updateTween()
	update (time) {

		var property;
		var elapsed;
		var value;

		if (time < this.startTime) {
			return true;
		}

		if (this.onStartCallbackFired === false) {

			if (this.onStartCallback !== null) {
				this.onStartCallback(this.object);
			}

			this.onStartCallbackFired = true;
		}

		elapsed = (time - this.startTime) / this.duration;
		elapsed = (this.duration === 0 || elapsed > 1) ? 1 : elapsed;

		value = this.easingFunction(elapsed);

		for (property in this.valuesEnd) {

			// Don't update properties that do not exist in the source object
			if (this.valuesStart[property] === undefined) {
				continue;
			}

			var start = this.valuesStart[property] || 0;
			var end = this.valuesEnd[property];

			if (end instanceof Array) {

				this.object[property] = this.interpolationFunction(end, value);

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {

					if (end.charAt(0) === '+' || end.charAt(0) === '-') {
						end = start + parseFloat(end);
					} else {
						end = parseFloat(end);
					}
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					this.object[property] = start + (end - start) * value;
				}

			}

		}

		if (this.onUpdateCallback !== null) {
			this.onUpdateCallback(this.object, elapsed);
		}

		if (elapsed === 1) {

			if (this.repeat > 0) {

				if (isFinite(this.repeat)) {
					this.repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in this.valuesStartRepeat) {

					if (typeof (this.valuesEnd[property]) === 'string') {
						this.valuesStartRepeat[property] = this.valuesStartRepeat[property] + parseFloat(this.valuesEnd[property]);
					}

					if (this.yoyo) {
						var tmp = this.valuesStartRepeat[property];

						this.valuesStartRepeat[property] = this.valuesEnd[property];
						this.valuesEnd[property] = tmp;
					}

					this.valuesStart[property] = this.valuesStartRepeat[property];

				}

				if (this.yoyo) {
					this.reversed = !this.reversed;
				}

				if (this.repeatDelayTime !== undefined) {
					this.startTime = time + this.repeatDelayTime;
				} else {
					this.startTime = time + this.delayTime;
				}

				if (this.onRepeatCallback !== null) {
					this.onRepeatCallback(this.object);
				}

				return true;

			} else {

				if (this.onCompleteCallback !== null) {

					this.onCompleteCallback(this.object);
				}

				for (var i = 0, numChainedTweens = this.chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					this.chainedTweens[i].start(this.startTime + this.duration);
				}

				return false;

			}

		}

		return true;

	}
	*/
};


TWEEN.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);

		},

		Out: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			k *= 2;

			if (k < 1) {
				return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
			}

			return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.Linear;

		if (k < 0) {
			return fn(v[0], v[1], f);
		}

		if (k > 1) {
			return fn(v[m], v[m - 1], m - f);
		}

		return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

	},

	Bezier: function (v, k) {

		var b = 0;
		var n = v.length - 1;
		var pw = Math.pow;
		var bn = TWEEN.Interpolation.Utils.Bernstein;

		for (var i = 0; i <= n; i++) {
			b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
		}

		return b;

	},

	CatmullRom: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.CatmullRom;

		if (v[0] === v[m]) {

			if (k < 0) {
				i = Math.floor(f = m * (1 + k));
			}

			return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

		} else {

			if (k < 0) {
				return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
			}

			if (k > 1) {
				return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
			}

			return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

		}

	},

	Utils: {

		Linear: function (p0, p1, t) {

			return (p1 - p0) * t + p0;

		},

		Bernstein: function (n, i) {

			var fc = TWEEN.Interpolation.Utils.Factorial;

			return fc(n) / fc(i) / fc(n - i);

		},

		Factorial: (function () {

			var a = [1];

			return function (n) {

				var s = 1;

				if (a[n]) {
					return a[n];
				}

				for (var i = n; i > 1; i--) {
					s *= i;
				}

				a[n] = s;
				return s;

			};

		})(),

		CatmullRom: function (p0, p1, p2, p3, t) {

			var v0 = (p2 - p0) * 0.5;
			var v1 = (p3 - p1) * 0.5;
			var t2 = t * t;
			var t3 = t * t2;

			return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

		}

	}

};

// import {version} from '../.temp.version.js';
TWEEN.version = '0.2.0';

// export default TWEEN;
export { TWEEN };

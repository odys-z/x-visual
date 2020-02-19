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
import {XError} from '../../xutils/xcommon';
import {mat4} from '../../xutils/vec';

function XTweenException(message) {
	this.message = message;
	this.name = 'XTweenException';
}

const iffTween = {any: ['CmpTween', 'CmpTweens']}
export default class XTweener extends ECS.System {
	constructor (ecs, x, startingTrigged) {
		super(ecs);
		this.ecs = ecs;

		const entities = ecs.queryEntities( iffTween );
		this.initTweens( ecs, entities || [] );
		this.resolvingStarts = startingTrigged || {};
	}

	initTweens (ecs, entities) {
		for (const e of entities) {
			if (e.CmpTween) {
				XTweener.initween(e.CmpTween);
			}
			if (e.CmpTweens && e.CmpTweens.tweens) {
				if (XTweener.validate(e)) {
					for (const ctwn of e.CmpTweens.tweens) {
						XTweener.initween(ctwn);
					}
				}
			}
		}
	}

	/** Validating the entity can be animized
	 * @param {ECS.Entity} entity
	 * @return {bool} ok or not
	 */
	static validate (entity) {
		if (entity.ModelSeqs && (entity.CmpTweens.tweens === undefined
			|| entity.CmpTweens.tweens.length === 0)) {
			console.warn(
				'CmpTweens shouldn\'t be null if there are scripts to be animized: ',
				entity.ModelSeqs, entity.CmpTweens,
				'Tip: Make sure XTweener is created/updating after animizer like MorphingAnim.');
			return false;
		}
		return true;
	}

	static initween (cmp) {
		if (Array.isArray(cmp)) {
			for (const compt of cmp)
				XTweener.initween(compt);
		}
		else {
			if (!cmp.easingFunction)
				cmp.easingFunction = TWEEN.Easing.Linear.None;
			if (!cmp.interpolationFunction)
				cmp.interpolationFunction = TWEEN.Interpolation.Linear;
		}
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

	update (tick, entities) {
		var time = TWEEN.now();
		for (const e of entities) {
			if (e.CmpTween) {
				// var tween = e.CmpTween;
				// if (tween && tween.isPlaying) {
				// 	tween.isPlaying = XTweener.updateTween(tween, time, this.resolvingStarts);
				// 	if (e.preserve === false) {
				// 		// delete this._tweens[tweenIds[i]];
				// 		// what's here?
				// 	}
				// }
				throw new XError("Why e.CmpTween?");
			}
			else if (e.CmpTweens && e.CmpTweens.tweens) {
				if (e.CmpTweens.startCmds.length > 0) {
					for (var cmdx of e.CmpTweens.startCmds) {
						if (0 <= cmdx && cmdx < e.CmpTweens.tweens.length) {
							var twSeq = e.CmpTweens.tweens[cmdx];
							XTweener.startween(twSeq[0], 0);
							e.CmpTweens.twindx[cmdx] = 0;
						}
					}
					e.CmpTweens.startCmds.splice(0, e.CmpTweens.startCmds.length);
				}

				// for the entity, resolve startings such like by Animizer find out
				var beingStartwiths = this.resolvingStarts[e.id];

				for (var seqx = 0; seqx < e.CmpTweens.twindx.length; seqx ++) {
					if (seqx < e.CmpTweens.tweens.length) {
						var twnx = e.CmpTweens.twindx[seqx];
						if (twnx >= e.CmpTweens.tweens[seqx].length) {
							// FIXME we need optimize this (with CmpTweens.isPlaying?)
							// console.error(`XTweener.update(): Why try to update ${twx}-th tween of`,
							// 	e.CmpTweens.tweens, "\nEntity: ", e);
						}
						else {
							const tween = e.CmpTweens.tweens[seqx][twnx];
							if (tween && tween.isPlaying) {
								tween.isPlaying = XTweener.updateTween(tween, time, this.resolvingStarts);
								if (e.preserve === false) {
									// what's here?
								}
								if (tween.affineCombine) {
									debugger
									e.Obj3.mesh.updateMatrix();
									// var mat4 = mat4.getTransform(e.Obj3.transform[0]);
									// for (var tx = 1; tx < e.Obj3.transform.length; tx++) {
									// 	mat4.apply(e.Obj3.transform[tx]);
									// }
									var m4 = mat4.combine(e.Obj3.affines);;
									e.Obj3.mesh.autoUpdateMatrix = false;
									e.Obj3.mesh.applyMatrix(m4.js());
								}
							}
							if (tween && tween.isCompleted) {
								// finished, start next
								e.CmpTweens.twindx[seqx] = twnx + 1;
								if (twnx + 1 < e.CmpTweens.tweens[seqx].length
									&& e.CmpTweens.tweens[seqx][twnx + 1]) {
									XTweener.startween(e.CmpTweens.tweens[seqx][twnx + 1]);
								}
							}
						}
					}
					else {
						debugger
						// FIXME we need some flag to stop empty runing if all animation finished
					}

					// if (startwith && startwith.starterx.seqx === seqx && startwith.starterx.twnx === twnx) {
					if (beingStartwiths) {
						XTweener.startTriggered(e.CmpTweens, beingStartwiths, this.resolvingStarts);
					}
				}
				// this.resolvingStarts[e.id] a.k.a beingStartwiths
				if (this.resolvingStarts[e.id] && this.resolvingStarts[e.id].length === 0)
					delete this.resolvingStarts[e.id];
			}
		}
	}

	static updateTween (cmp, time, resolvingStarts) {
		var property, elapsed, value;

		if (time < cmp.startTime) return true;

		if (cmp.onStartCallbackFired === false) {
			if (cmp.onStartHander &&
				typeof cmp.onStartHander.onStart === 'function') {
				cmp.onStartHandler.onStart(cmp.object);
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

			// forr three.js uniforms - FIXME not perfectly fit to the design?
			var hasValue = false;
			if (typeof end.value === 'number') {
				start = start.value;
				end = end.value;
				hasValue = true;
			}

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
					// forr three.js uniforms - FIXME not perfectly fit to the design?
					//cmp.object[property] = start + (end - start) * value;
					var tv = start + (end - start) * value;
					if (hasValue) {
						cmp.object[property].value = tv;
					}
					else
						cmp.object[property] = tv;
				}
			}
		}

		if (cmp.onUpdateHandler &&
			typeof cmp.onUpdateHandler.onUpdate === 'function') {
			cmp.onUpdateHandler.onUpdate(cmp.object, elapsed);
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

				if (typeof cmp.onRepeatHandler === 'object') {
					cmp.onRepeatHandler.onRepeat(cmp.object);
				}
				return true;
			}
			else {
				cmp.isCompleted = true;	// added by ody
				cmp.isPlaying = false;	// added by ody
				if (cmp.onCompleteHandler &&
					typeof cmp.onCompleteHandler.onComplete === 'function') {
					cmp.onCompleteHandler.onComplete(cmp.object, cmp);
				}

				// chained tweens is not used
				if (cmp.chainedTweens) {
					// deprecated branch
					for (var i = 0, numChainedTweens = cmp.chainedTweens.length; i < numChainedTweens; i++) {
						// Make the chained tweens start exactly at the time they should,
						// even if the `update()` method was called way past the duration of the tween
						cmp.chainedTweens[i].start(cmp.startTime + cmp.duration);
					}
				}

				// added by ody, handle followBy
				var folls = cmp.followBy;
				if (folls && folls.length > 0) {
					XTweener.pushTriggerings(TriggerEvent.FOLLOWBY, time, cmp, resolvingStarts, folls);
				}

				return false;
			}
		}
		return true;
	}

	static startween (cmp, time) {
		cmp.isPlaying = true;
		cmp.isPaused = false;
		cmp.isCompleted = false;

		cmp.startTime = time !== undefined ? TWEEN.now() + (typeof time === 'string' ? parseFloat(time) : time) : TWEEN.now();
		cmp.startTime += cmp.delayTime;

		for (var property in cmp.valuesEnd) {
			// Check is an array was provided as property value
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
				// Ody
				// This line should be problem for uniform{value} - referencing and modified startValue while updating
				// cmp.valuesStart[property] = cmp.object[property];
				if (typeof cmp.object[property].value !== 'undefined') // include case of number 0
					cmp.valuesStart[property] = {value: cmp.object[property].value};// copy value
				else
					cmp.valuesStart[property] = cmp.object[property];
			}

			// added by Ody
			// forr three.js uniforms - FIXME not perfectly fit to the design?
			if (cmp.object[property].value !== undefined) {
				// uniform values can't be an array?
				cmp.valuesStartRepeat[property] = cmp.valuesStart[property].value || 0;
			}
			else {
				if ((cmp.valuesStart[property] instanceof Array) === false) {
					cmp.valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
				}
				cmp.valuesStartRepeat[property] = cmp.valuesStart[property] || 0;
			}
		}
	}

	/** Buffering triggering tweens by 'startWith' and 'followBy'.
	 * Triggering will started at next update, starting by startTriggered()
	 * @param {const} start_or_follow STARTWITH | FOLLOWBY
	 * @param {number} now current time
	 * @param {CmpTween} cmpStarter component triggered the event
	 * @param {object} resolvingBuff all triggering tween are put into here
	 * @param {[startWith | followBy]} withs scripts array defining tweens to be started
	 */
	static pushTriggerings (start_or_follow, now, cmpStarter, resolvingBuff, withs) {
		if (withs && withs.length > 0) {
			// we don't have the entity's CmpTweens here, can only start it in update()
			for (var wx of withs) {
				wx.starter = cmpStarter;
				wx.triggerAt = start_or_follow;
				wx.startime = now + (wx.start || 0) * 1000;
				if (resolvingBuff[wx.entity] === undefined)
				 	resolvingBuff[wx.entity] = [];
				resolvingBuff[wx.entity].push(wx);
			}
		}
	}

	/**Start triggered, recursively, return 'triggerings', of wich elements started
	 * successfully been removed.
	 * @param {CmpTweens} cmpTweens target tween components to be started
	 * @param {object} triggerings [in / out] {entity-id: triggering}, the triggering
	 * component description, where trigering is pushed by #pushTriggerings():
	 * {seqx, starter, triggerAt: STARTWITH | FOLLOWBY}
	 * @param {object} resolvingBuff, the tweener.resolvingStarts, buffer for push
	 * other triggered recursively
	 */
	static startTriggered (cmpTweens, triggerings, resolvingBuff) {
		var slicings = [];
		var now = TWEEN.now();
		for (var i = 0; i < triggerings.length; i++) {
			var beingStart = triggerings[i];
			if (beingStart.triggerAt == TriggerEvent.BEGINNING
				|| beingStart.triggerAt === TriggerEvent.STARTWITH && beingStart.starter.isPlaying
				|| beingStart.triggerAt === TriggerEvent.FOLLOWBY && beingStart.starter.isCompleted) {
				var tweens = cmpTweens.tweens[beingStart.seqx];
				if (!tweens || !tweens[0]) {
					console.error("XTweener.update(): StartWith or followBy's script index is out of range.",
						"\nSeq Index: ", beingStart.seqx, "\nTweens: ", cmpTweens.tweens);
				}
				// else if (!tweens[0].isPlaying && !tweens[0].isCompleted) {
				else if (tweens && tweens[0] && beingStart.startime <= now) {
					// console.log(tweens[0].delay + beingStart.start * 1000);
					XTweener.startween(tweens[0], beingStart.start * 1000);
					cmpTweens.twindx[beingStart.seqx] = 0;
					slicings.push(i);

					if (tweens[0].startWith) {
						XTweener.pushTriggerings(TriggerEvent.STARTWITH, now, tweens[0], resolvingBuff, tweens[0].startWith);
					}
				}
			}
		}

		for (var i = slicings.length - 1; i >= 0; i--) {
			triggerings.splice(slicings[i], 1);
		}
		return triggerings;
	}
};

XTweener.query = iffTween;

const TWEEN = {};

// triggering event id
export const TriggerEvent = {
	STARTWITH: 1,
	FOLLOWBY: 2,
	BEGINNING: 3
}

TWEEN._nextId = 0;
TWEEN.nextId = function () {
	return TWEEN._nextId++;
};

// Include a performance.now polyfill.
// In node.js, use process.hrtime.
// FIXME what's self used for?
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
 * @param {XComponent.CmpTween} cmpTween tween component
 * @param {object} tweenee object to be tweened (e.g. a THREE.Object3D property)
 * @param {TWeen}, the Tween.js Tween object, should been discard by Animizer.
 * Reason? It's not ECS.
 * */
TWEEN.Tween = function(cmpTween, tweenee) {
	const cmp = cmpTween;
	cmp.duration = 1000;
	cmp.repeat = 0;
	cmp.delayTime = 0;
	cmp.startTime = null;
	cmp.object = tweenee;
	cmp.valuesStart = {};
	cmp.valuesEnd = {};
	cmp.valuesStartRepeat = {};
	// cmp.onStartCallbackFired = null;
	// cmp.onUpdateCallback = null;

	return new function() {
		this.getId = function () { return cmp.id; }
		this.isPlaying = function () { return cmp.isPlaying; }
		this.isPaused = function () { return cmp.isPaused; }

		this.to = function (properties, duration) {
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

		/**Start this animation.
		 * @param {object} resolvingBuff resolving buffer for triggered tweens
		 * - the buffer of enityId-script key values that Animizer ask for
		 * starting by 'startWith'.
		 * @param {number} time [optional] seconds
		 */
		this.start = function (resolvingBuff, time) {
			XTweener.startween(cmp, time);
			XTweener.pushTriggerings(TriggerEvent.STARTWITH, TWEEN.now(), cmp, resolvingBuff, cmp.startWith);
			return this;
		}

		this.stop = function () {
			if (!cmp.isPlaying) {
				return this;
			}

			// this.group.remove(this);
			cmp.isPlaying = false;
			cmp.isPaused = false;

			if (cmp.onStopHandler &&
				typeof cmp.onStopHandler.onStop === 'function') {
				cmp.onStopHandler.onStop(cmp.object);
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

		/**Chain another tween.
		 * Note: XTweener.XTWEEN is controled by a ECS subsystem, chained tweening
		 * is not recommended using this way.
		 * This method is reserved while user creating tween.
		 */
		this.chain = function () {
			cmp.chainedTweens = arguments;
			return this;
		}

		this.onStart = function (handler) {
			// cmp.onStartCallback = callback;
			// keep API compitable to Tween.js
			if (typeof handler === 'function'){
				cmp.onStartHandler = {onStart: handler};
			}
			else {
				cmp.onStartHandler = handler;
			}
			return this;
		}

		this.onUpdate = function (handler) {
			// cmp.onUpdateCallback = callback;
			// keep API compitable to Tween.js
			if (typeof handler === 'function'){
				cmp.onUpdateHandler = {onUpdate: handler};
			}
			else {
				cmp.onUpdateHandler = handler;
			}
			return this;
		}

		// onRepeat: function onRepeat(callback) {
		this.onRepeat = function (handler) {
			// cmp.onRepeatCallback = callback;
			// keep API compitable to Tween.js
			if (typeof handler === 'function'){
				cmp.onRepeatHandler = {onRepeat: handler};
			}
			else {
				cmp.onRepeatHandler = handler;
			}
			return this;
		}

		this.onComplete = function (handler) {
			// cmp.onCompleteCallback = callback;
			// keep API compitable to Tween.js
			if (typeof handler === 'function'){
				cmp.onCompleteHandler = {onComplete: handler};
			}
			else {
				cmp.onCompleteHandler = handler;
			}
			return this;
		}

		this.onStop = function (handler) {
			// keep API compitable to Tween.js
			if (typeof handler === 'function'){
				cmp.onStopHandler = {onStop: handler};
			}
			else {
				cmp.onStopHandler = handler;
			}
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

const XEasing = {

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

TWEEN.Easing = XEasing;

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

TWEEN.version = '0.7.0';

export { TWEEN, XEasing };

import * as ECS from '../../packages/ecs-js/index';

import * as THREE from 'three'

// npm i --save-dev babel-plugin-wildcard
// .babelrc: { "plugins": ["wildcard"] }
import {vec3} from '../xmath/vec'
import AssetKeepr from '../xutils/assetkeepr.js'
import Input from '../sys/input'
import GpuPicker from '../sys/gpupicker'
import Mapctrl from '../sys/mapctrl'
import Camctrl from '../sys/camctrl'
import Thrender from '../sys/thrender'
import {MorphingAnim} from '../sys/tween/animizer'
import XTweener from '../sys/tween/xtweener'
import AffineCombiner from '../sys/tween/affinecombiner'
import FinalComposer from '../sys/ext/finalcomposer'
import PathEffect from '../sys/ext/patheffect'
import FilmEffect from '../sys/ext/filmeffect'
import GlowEffect from '../sys/ext/gloweffect'

import {CmpCluster} from '../chart/clusters'
import * as visual from '../component/visual'
import {Obj3} from '../component/obj3'
import {GpuPickable} from '../component/pickable'
import * as Tweens from '../component/tween'
import * as CAnims from '../component/morph'
import * as CmpMvc from '../component/mvc'
import * as Composers from '../component/ext/effects'

/**Global singleton, xworld, options, ...
 *
 * FIXME merge with x.js/x
 * @type x
 */
const x = {
	ver: 'v0.1',
	log: 5,
	lastUpdate: -Infinity,
	assets: undefined,

	/** XCamera: {pos: [0, 0, 0], cam: camera}
	 * @property xcam
	 * @memberof x */
	xcam: undefined,
	up: new THREE.Vector3(0, 1, 0),
};

// Patches
	THREE.Layers.prototype.push = function (mask) {
		if (!this.stack)
			this.stack = [];
		this.stack.push(this.mask);
		this.mask = mask;
		return this;
	}

	THREE.Layers.prototype.pop = function () {
		var msk = this.maks;
		if (!this.stack) {
			this.mask = 0;
		}
		else {
			this.mask = this.stack.pop();
		}
		return msk;
	}


/**
 * x-visual world
 * @class XWorld
 */
export default class XWorld {
	/**@property {ECS} xecs - ECS instance */
	get xecs() { return x.ecs; }
	/**@property {THREE.Scene} xscene - main scene */
	get xscene() { return x.scene; }
	/**@property {object} xview - X view singleton: {flag, cmds}. */
	get xview() { return x.xview; }
	/**@property {THREE.PerspectiveCamera} xcam - main camera */
	get xcam() { return x.xcam.XCamera.cam; }
	get stamp() { return x.lastUpdate; }
	get lastick() { return x.ecs.lastick; }

	/**Create x-world.
	 * @param {Canvas} canvas html dom canvas
	 * @param {Window} wind
	 * @param {object} options <br>
	 * options.frustum: { fov, ratio, near, far },<br>
	 * options.camera: { position, lookAt }, where value in [x, y, z]<br>
	 * @constructor XWorld */
	constructor(canvas, wind, opts) {
		if (opts && opts.log > 0) x.log = opts.log;
		x.options = opts || {};
		x.world = this;
		x.window = wind;
    	x.container = canvas;
    	const ecs = new ECS.ECS();
		// Cons of ECS - how to be polymorhpism? Extends a new ECS?
		ecs.componentTriggered (['FlowingPath', 'GlowingEdge'],
			(def) => x.options.pathEffect = true);
		ecs.componentTriggered (['Glow'],
			(def) => x.options.glowEffect = true);
		ecs.componentTriggered (['Filming'],
			(def) => x.options.filmEffect = true);
		x.ecs = ecs;

		if (x.options.outlinePass === undefined || x.options.outlinePass !== false)
			x.options.outlinePass = true;

		Object.assign(x.options, {canvas});

		this.registerComponents(CmpMvc);	// Input
		this.registerComponents({GpuPickable});
		this.registerComponents(visual);

		x.xview = {
			tick: -1,
			Input: undefined,
			// e.g. [ {code: 'key', cmd: 'left'}, {code: 'mouse', cmd: 'click'} ]
			cmds: [],
			flag: 0 };
		x.xview.Input = new Input(ecs, x, x.xview);

		var camopt = Object.assign( {fov: 30, ratio: 2.0, near: 1, far: 5000},
									x.options.frustum );
		if (x.options && x.options.camera) {
			Object.assign(camopt, x.options.camera);
		}
		var camera = new THREE.PerspectiveCamera(
						camopt.fov, camopt.ratio,
						camopt.near, camopt.far );

		if (x.options.camera && x.options.camera.position) {
			camera.position.x = options.camera.position[0];
			camera.position.y = options.camera.position[1];
			camera.position.z = options.camera.position[2];
		}
		else {
			camera.position.z = 400;
			camera.position.y = 50;
		}

		if (x.options.camera && x.options.camera.lookAt) {
			var l = x.options.camera.lookAt;
			// camera.lookAt is overriden by Mapctrl or Camctrl
			camera.lookAt(l[0], l[1], l[2]);
			camera.xtarget = new vec3(l);
		}
		else {
			camera.lookAt(0, 50, 0);
			camera.xtarget = new vec3(0, 50, 0);
		}

		x.xcam = ecs.createEntity({
			id: 'xcam',
			XCamera: {pos: [0, 0, 0], cam: camera}
		});

		this.registerComponents(Tweens);
		this.registerComponents(CAnims);

		this.registerComponents({Obj3});
		this.registerComponents(CmpCluster)

		// if (x.options.effects) {
			this.registerComponents(Composers);
		// }

		x.lastUpdate = performance.now();
		// x.tickTime = 0;
		AssetKeepr.init(x);
	}

	/** ecs.registerComponent(name, ComponentExports[name]);
	 * @param {object | Component} comps a component or an object of {comp-name, comp}
	 * @member XWorld#registerComponents
	 * @function
	 */
	registerComponents(comps) {
		if (comps) {
			for (const name of Object.keys(comps)) {
				if (x.log >= 5) console.log('[5] register components ', name);
				x.ecs.registerComponent(name, comps[name]);
			}
		}
	}

	/**
	 * @member XWorld#startUpdate
	 * @function
	 */
	startUpdate() {
		// NOTE The initializing order can not been changed.
		// dependency:
		// PathEffect <-/ FinalComposer (options.effects == true)
		// Thrender <--/
		// Thrender <- PathEffect
		// Thrender <- Inputs
		// Thrender <- Animizer
		// XTweener <- Animizer
		var ecs = x.ecs;

		var sys3 = new Thrender(ecs, x);
		ecs.addSystem('render', sys3);

		if (x.options.pathEffect) {
			var pathEffect = new PathEffect(ecs, x);
			ecs.addSystem('render', pathEffect);
		}

		if (x.options.filmEffect) {
			var filmEffect = new FilmEffect(ecs, x);
			ecs.addSystem('render', filmEffect);
		}

		if (x.options.glowingEdgeEffect) {
			var glowEffect = new GlowEffect(ecs, x);
			ecs.addSystem('render', glowEffect);
		}

		if (x.options.pathEffect || x.options.filmEffect || x.options.glowingEdgeEffect) {
			var finalComposer = new FinalComposer(ecs, x);
			ecs.addSystem('render', finalComposer);
		}

		// add subsystems
		ecs.addSystem('mvc', x.xview.Input);
		ecs.addSystem('mvc', new GpuPicker(ecs, x));

		if (x.options.mapcontrol) {
			ecs.addSystem('mvc', new Mapctrl(ecs,
					{canvas: x.container, renderer: sys3.renderer,
					 camera: sys3.camera, control: sys3.control}));
		}
		else {
			ecs.addSystem('mvc', new Camctrl(ecs,
					{canvas: x.container, renderer: sys3.renderer,
					 camera: sys3.camera, control: sys3.control}));
		}

		if (!x.options.tween) {
			// animize & tweener
			var resolvingStarts = {}; // Animizer triggered tweens to be started when initing
			var animizer = new MorphingAnim(ecs, {});
			Object.assign(resolvingStarts, animizer.startings);
			ecs.addSystem('tween', new XTweener(ecs, x, resolvingStarts));

			//
			ecs.addSystem('tween', new AffineCombiner(ecs, x));
		}

		// start animation
		this.update();
	}

	/**this.ecs.runSystemGroup('input');<br>
	 * this.ecs.runSystemGroup('render');<br>
	 * ...
	 * @param {number} time
	 * @member XWorld.update
	 * @function
	 */
	update(time) {
		if (typeof x.window === 'object') {
			x.window.requestAnimationFrame(this.update.bind(this));
		}
		// else {testing without window object}

		x.lastUpdate = performance.now();
		x.ecs.tick();

		x.ecs.runSystemGroup('mvc');
		x.ecs.runSystemGroup('render');
		x.ecs.runSystemGroup('tween');

		if (x.userSysGroup) {
			for (const g in x.userSysGroup) {
				x.ecs.runSystemGroup(x.userSysGroup[g]);
			}
		}
	}

	/**Add systems.
	 * @param {string} group group name
	 * @param {System} sys ECS system
	 * @member XWorld#addSystem
	 * @function
	 */
	addSystem(group, sys) {
		if (x.userSysGroup === undefined) {
			x.userSysGroup = {};
		}
		x.userSysGroup[group] = group;

		x.ecs.addSystem(group, sys);
	}

	/**Add entities.
	 * @param {array | object} defs e.g.<br>
	 * [{ Obj3: {...}, ... }]
	 * @return {array} entities been added
	 * @member XWorld#addEntities
	 * @function
	 */
	addEntities(defs) {
		if (!Array.isArray(defs))
			defs = [defs];
		const es = [];
		defs.forEach(function(d) {
			es.push(x.ecs.createEntity(d));
		});
		return es;
	}
}

export {x}

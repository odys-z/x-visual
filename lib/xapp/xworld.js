/** @module xv.xapp */

import * as ECS from '../../packages/ecs-js/index';

import * as THREE from 'three'

// npm i --save-dev babel-plugin-wildcard
// .babelrc: { "plugins": ["wildcard"] }
// not work by npm i x-visual: import * as Sys from '../sys'
import AssetKeepr from '../xutils/assetkeepr.js';
import Input from '../sys/input'
import GpuPicker from '../sys/gpupicker'
import Mapctrl from '../sys/mapctrl'
import Camctrl from '../sys/camctrl'
import Thrender from '../sys/thrender'
import {MorphingAnim} from '../sys/tween/animizer'
import XTweener from '../sys/tween/xtweener'
import FinalComposer from '../sys/ext/finalcomposer'
import OccludePass from '../sys/ext/occludepass'
import XSys from '../sys/xsys'

import {CmpCluster} from '../chart/clusters'
// import {Visual, AssetType} from '../component/visual'
import * as vises from '../component/visual'
import {Obj3} from '../component/obj3'
// import {Geometry} from '../component/geometry'
import {GpuPickable} from '../component/pickable'
import * as Tweens from '../component/tween'
import * as CAnims from '../component/morph'
import * as CmpMvc from '../component/mvc'
import * as Composers from '../component/ext/effects'

/** Global singleton, xworld, options, ...
 * FIXME merge with x.js/x
 */
const x = {
	ver: 'v0.1',
	log: 5,
	lastUpdate: -Infinity,
	assets: undefined,
};

/**
 * x-visual world
 * @class
 */
export default class XWorld {
	get xecs() { return x.ecs; }
	get xscene() { return x.scene; }
	get stamp() { return x.lastUpdate; }
	get lastick() { return x.ecs.lastick; }

	constructor(canvas, wind, options) {
		if (options.log > 0) x.log = options.log;
		x.world = this;
		x.window = wind;
    	x.container = canvas;
    	const ecs = new ECS.ECS();
		x.ecs = ecs;
		x.options = options;
		if (options.outlinePass === undefined || options.outlinePass !== false)
			x.options.outlinePass = true;
		if (options.postEffects) {

		}

		Object.assign(x.options, {canvas});

		this.registerComponents(ecs, CmpMvc);	// UserCmd
		this.registerComponents(ecs, {GpuPickable});
		// this.registerComponents(ecs, {Geometry});
		this.registerComponents(ecs, vises);

		x.xview = ecs.createEntity({
			id: 'xview',
			Input: {},
			// e.g. [ {code: 'key', cmd: 'left'}, {code: 'mouse', cmd: 'click'} ]
			UserCmd: {cmds:[]},
			CmdFlag: {flag: 0}
		});

		var camopt = {fov: 30, ratio: 2.0, near: 1, far: 5000};
		if (options && options.camera) {
			Object.assign(camopt, options.camera);
		}
		var camera = new THREE.PerspectiveCamera(
						camopt.fov, camopt.ratio,
						camopt.near, camopt.far );
		// camera.lookAt(0, 0, 0);
		camera.position.z = 400;
		x.xcam = ecs.createEntity({
			id: 'xcam',
			XCamera: {pos: [0, 0, 0], cam: camera}
		});

		this.registerComponents(ecs, Tweens);
		this.registerComponents(ecs, CAnims);

		this.registerComponents(ecs, {Obj3});
		this.registerComponents(ecs, CmpCluster)

		if (options.postEffects) {
			this.registerComponents(ecs, Composers);
		}

		x.lastUpdate = performance.now();
		// x.tickTime = 0;
		AssetKeepr.init(x);
	}

	/** ecs.registerComponent(name, ComponentExports[name]); */
	registerComponents(ecs, comps) {
		if (comps) {
			if (x.log >= 5) console.log('[5] register components ', comps);
			for (const name of Object.keys(comps)) {
				ecs.registerComponent(name, comps[name]);
			}
		}
	}

	startUpdate() {
		// NOTE The initializing order can not been modified.
		// dependency:
		// FinalComposer <- Thrender (options.postEffects == true)
		// Thrender <- OccludePass
		// Thrender <- Inputs
		// Thrender <- Animizer
		// XTweener <- Animizer
		var ecs = x.ecs;

		if (x.options.postEffects) {
			var finalComposer = new FinalComposer(ecs, x);
			ecs.addSystem('render', finalComposer);
		}

		var sys3 = new Thrender(ecs, x);
		ecs.addSystem('render', sys3);

		if (x.options.postEffects) {
			var occludePass = new OccludePass(ecs, x);
			ecs.addSystem('render', occludePass);
		}
		// var posts = new PostEffects(ecs, x, {outline: true});
		// ecs.addSystem('render', posts);

		// add subsystems
		ecs.addSystem('mvc', new Input(ecs, x));
		ecs.addSystem('mvc', new GpuPicker(ecs, x));

		// ecs.addSystem('mvc', this.ctrl);
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
			var resolvingStarts = {}; // Animizer triggered tweens to be started when initing
			var animizer = new MorphingAnim(ecs, {});
			Object.assign(resolvingStarts, animizer.startings);
			ecs.addSystem('tween', new XTweener(ecs, x, resolvingStarts));
		}

		// start animation
		this.update();
	}

	/**this.ecs.runSystemGroup('input');
	 * this.ecs.runSystemGroup('render');
	 * @param {number} time */
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

	addSystem(group, sys) {
		if (x.userSysGroup === undefined){
			x.userSysGroup = {};
		}
		x.userSysGroup[group] = group;

		x.ecs.addSystem(group, sys);
	}

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

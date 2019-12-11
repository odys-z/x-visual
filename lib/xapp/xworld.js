/** @module xv.xapp */

import * as ECS from '../../packages/ecs-js/index';

import * as THREE from 'three'

// npm i --save-dev babel-plugin-wildcard
// .babelrc: { "plugins": ["wildcard"] }
// not work by npm i x-visual: import * as Sys from '../sys'
import Input from '../sys/input'
import Camctrl from '../sys/camctrl'
import Thrender from '../sys/thrender'
import XObj from '../sys/xobj'

import {CmpCluster} from '../chart/clusters.js'
import * as CmpMvc from '../component/mvc.js'

/** Global singleton, xworld, options, ... */
const x = {}

/**
 * x-visual world
 * @class
 */
export default class XWorld {
	constructor(canvas, wind, options) {
		x.windw = wind;
    	x.container = canvas;
    	const ecs = new ECS.ECS();
		x.ecs = ecs;
		x.options = options;
		Object.assign(x.options, {canvas});

		this.registerComponents(ecs, CmpMvc);	// UserCmd

		x.xview = ecs.createEntity({
			id: 'xview',
			// e.g. [ {code: 'key', cmd: 'left'}, {code: 'mouse', cmd: 'click'} ]
			UserCmd: {cmds:[]},
			CmdFlag: {flag: 0}
		})

		var camopt = options ? options.camera ?
				options.camera : {fov: 30, ratio: 1.0, near: 1, far: 5000}
				: {}
		var camera = new THREE.PerspectiveCamera(
						camopt.fov, camopt.ratio,
						camopt.near, camopt.far );
		x.xcam = ecs.createEntity({
			id: 'xcam',
			XCamera: {pos: [0, 0, 0], cam: camera}
		})

		ecs.addSystem('mvc', new Input(ecs, wind));

		var sys3 = new Thrender(ecs, canvas);
		ecs.addSystem('render', sys3);

		ecs.addSystem('mvc', new Camctrl(ecs,
				{canvas, renderer: sys3.renderer,
				camera: sys3.camera, control: sys3.control}));

		x.lastUpdate = performance.now();
		x.tickTime = 0;
		this.update(x.lastUpdate);

		this.registerComponents(ecs, CmpCluster)
	}

	/** this.ecs.registerComponent(name, ComponentExports[name]); */
	registerComponents(ecs, comps) {
		console.log('loading components ', comps);
		if (comps) {
			for (const name of Object.keys(comps)) {
				ecs.registerComponent(name, comps[name]);
			}
		}
	}

	/**this.ecs.runSystemGroup('input');
	 * this.ecs.runSystemGroup('render');
	 * @param {number} time */
	update(time) {
		x.windw.requestAnimationFrame(this.update.bind(this));

		const delta = time - this.lastUpdate;
		x.tickTime += delta;
		x.lastUpdate = time;
		x.ecs.runSystemGroup('mvc');
		// if (this.player.Action) {
		// 	this.runTurn();
		// }
		// if (this.tickTime < TICKLENGTH) {
		// 	return;
		// }
		// this.tickTime %= TICKLENGTH;
		// this.runTick();
		x.ecs.runSystemGroup('render');
	}

	addSystem(group, sys) {
		x.ecs.addSystem(group, sys);
	}
}

export {XObj}

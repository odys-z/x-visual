import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

import * as THREE from '../packages/three/three.module-r120';

import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld.js'
import {x} from '../lib/xapp/xworld.js'
import {AssetType} from '../lib/component/visual'
import {Obj3Type} from '../lib/component/obj3'
import * as Composers from '../lib/component/ext/effects'
import {Layers, LayerChannel} from '../lib/xmath/layer'

const {performance} = require('perf_hooks');
////////////////////////////////////////////////////////////////////////////////
// China Issue
// Installing Canvas failed while needle, a c++ bridge, downloading npm-pre-gyp.
// Using the China Test instead.
//
// For what's attempped to do, see also
// Possible to render three.js on serverside? #730
// https://github.com/Automattic/node-canvas/issues/730
//
// var Canvas = require("canvas");
////////////////////////////////////////////////////////////////////////////////

global.performance = performance;

describe('case: Layers', function() {
	let canvas;
    x.log = 4;
	x.test = true;

	before(function() {
		// set up equivolent function to THREE.Layers, which is used by Orthocclud.layerpass
		THREE.Layers.prototype.visible = function (mask) {
			var l = new Layers();
			l.mask = this.mask;
			return l.visible(mask);
		}
		THREE.Layers.prototype.occlude = function (mask) {
			var l = new Layers();
			l.mask = this.mask;
			return l.occlude(mask);
		}
	});

	it('occluded', function() {
		var xworld = new XWorld(undefined, 'window', {effects: true});
		var ecs = xworld.xecs;
		xworld.registerComponents(Composers);

		var v1 = ecs.createEntity({
			id: 'v1',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null },
			FlowingPath: {}
		});

		var o1 = ecs.createEntity({
			id: 'o1',
			Obj3: { geom: Obj3Type.BOX,
					box: [20, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null },
			Occluder: {FlowingPath: true}
		});

		var inv = ecs.createEntity({
			id: 'invisible',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null },
		});

		var camLayer = new Layers()
			.enable ( LayerChannel.FLOWING_PATH )
			.enable ( LayerChannel.FILMING );

		var camera = new THREE.Layers().push(camLayer.mask);

		xworld.startUpdate();
		debugger
		assert.isTrue(camera.visible(v1.Obj3.layers), 'v1 visible');
		assert.isFalse(camera.occlude(v1.Obj3.occluding), 'v1 occlude');
		assert.isTrue(camera.visible(o1.Obj3.layers), 'o1 visible');
		assert.isTrue(camera.occlude(o1.Obj3.occluding), 'o1 occlude');

		assert.isFalse(camera.visible(inv.Obj3.layers), 'inv visible');
		assert.isFalse(camera.occlude(inv.Obj3.occluding), 'inv occlude');
	});
});

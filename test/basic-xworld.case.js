/** @module xv.test.xobj */

import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as ECS from '../packages/ecs-js/index';
import {x} from '../lib/xapp/xworld.js'
import XWorld from '../lib/xapp/xworld.js'
import AssetKeepr from '../lib/xutils/assetkeepr'


describe('case: [xworld] singleton', function() {
	let xworld, ecs;
	let htmltex;

	before(function() {
		global.performance = performance;
		xworld = new XWorld(undefined, 'window', {});
		ecs = xworld.xecs;
		assert.deepEqual(x.ecs, ecs);
		xworld.startUpdate();
	});

	it('x.stamp & lastick', function() {
		assert.deepEqual(AssetKeepr.canvs, {});
		assert.deepEqual(AssetKeepr.assets.canvs, {});

		var tick = xworld.lastick + 1;
		var stamp = xworld.stamp;
		assert.isAbove(xworld.stamp, 0);
		xworld.update();
		assert.equal(xworld.lastick, tick);
		assert.isAbove(xworld.stamp, stamp);
	});
});

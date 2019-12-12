/** @module xv.test.xobj */

import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld.js'
import XObj from '../lib/sys/xobj'
import Geometry from '../lib/component/geometry'
import Visual from '../lib/component/visual'

/**
 * Subclass for handling data objects
 * @class
 */
class SubXobj extends XObj {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		this.logcnt = 0;

		// create a cube with options
		// var cubeGeom = new THREE.BoxBufferGeometry( 200, 200, 200 );
	}

	update(tick, entities) {
		if (this.logcnt < 2) {
			console.log('SubXobj.update(tick, entities): ', tick, entities)
			this.logcnt += 1;
		}
	}

}

SubXobj.query = {
  has: ['Geometry', 'Visual']
};

// const Geometry = {
// 	properties: {
// 		pos: [0, 0, 0]
// 	}
// };
//
// const Visual = {
// 	properties: {
// 		color: 0x5f003f
// 	}
// };

global.performance = performance;

describe('case: Subxobj query = [Geometry, Visual]', function() {
	let xworld;
	let subx;

	before(function() {
		// const ecs = new ECS.ECS();
		xworld = new XWorld(undefined, 'window', {});
		var ecs = xworld.xecs();
		ecs.registerComponent('Geometry', Geometry);
		ecs.registerComponent('Visual', Visual);
		subx = new SubXobj(ecs);
		xworld.addSystem('test', subx);
	});

	it('ecs update', function() {
		xworld.update();
		assert.equal(subx.logcnt, 1);
		xworld.update();
		assert.equal(subx.logcnt, 2);
		xworld.update();
		assert.equal(subx.logcnt, 2);
	});
});

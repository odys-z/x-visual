import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld.js'
import XSys from '../lib/sys/xsys'
// import {Geometry} from '../lib/component/geometry'
import {Visual} from '../lib/component/visual'

global.performance = performance;

/**
 * Subclass for handling data objects
 * @class
 */
class SubXobj extends XSys {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		this.logcnt = 0;
	}

	update(tick, entities) {
		this.logcnt += 1;
	}

}

SubXobj.query = {
  has: ['Geometry', 'Visual']
};

describe('case: Subxobj query = [Geometry, Visual]', function() {
	let xworld;
	let subx;

	before(function() {
		xworld = new XWorld(undefined, 'window', {});
		var ecs = xworld.xecs;
		// ecs.registerComponent('Geometry', Geometry);
		// ecs.registerComponent('Visual', Visual);
		subx = new SubXobj(ecs);
		xworld.addSystem('test', subx);
	});

	it('ecs update', function() {
		xworld.update();
		assert.equal(subx.logcnt, 1);
		xworld.update();
		assert.equal(subx.logcnt, 2);
		xworld.update();
		assert.equal(subx.logcnt, 3);
	});
});

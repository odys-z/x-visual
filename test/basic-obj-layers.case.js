/** @module xv.test.ext */

import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld.js'
import {x} from '../lib/xapp/xworld.js'
import {AssetType} from '../lib/component/visual'
import {Obj3Type} from '../lib/component/obj3'

global.performance = performance;

describe('case: Layers', function() {
	before(function() { });

	it('occluded', function() {
		var xworld = new XWorld(undefined, 'window', {});
		var ecs = xworld.xecs;
		var cube = ecs.createEntity({
			id: 'bloom-0',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null },
		});

		cube = ecs.createEntity({
			id: 'occluded-1',
			Obj3: { geom: Obj3Type.BOX,
					box: [20, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null },
		});

		xworld.startUpdate();
		assert.isTrue(x.pathEffects);

	});
});

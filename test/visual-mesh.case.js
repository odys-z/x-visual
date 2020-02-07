
/** @module xv.test.assets */

// import chai from 'chai'
import { chai, expect, assert } from 'chai'
import chaiStats from 'chai-stats'

import * as THREE from 'three';
import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld'
import {x} from '../lib/xapp/xworld'
import AssetKeepr from '../lib/xutils/assetkeepr'
import {Visual, AssetType} from '../lib/component/visual'
import {Obj3, Obj3Type} from '../lib/component/obj3'
import {AnimType} from '../lib/component/morph'

const {performance} = require('perf_hooks');

describe('case: [Visual] load mesh', function() {
	this.timeout(1000000); // for debug
	x.log = 4;

	before(() => { });

	it('refPoint', function() {
		const xworld = new XWorld(undefined, 'window', {});
		const ecs = xworld.xecs;

		var completeflags = {};

		var cube = ecs.createEntity({
			id: 'cube0',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],	// bounding box
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null }
		});

		var points = ecs.createEntity({
			id: 'points',
			Obj3: { geom: Obj3Type.NA,
					box: [200, 120, 80],	// bounding box
					mesh: undefined },
			Visual:{vtype: AssetType.refPoint,
					asset: 'cube0' },
			ModelSeqs: {
					script: [[{ mtype: AnimType.U_VERTS_TRANS,
							 	paras: {start: 0,	// follow previous
										duration: 4.2,		// seconds
										dest: 'entity1',	// entity2.Obj3.mesh
										uniforms: { u_morph: [0, 1],
													u_alpha: [0.1, 0.9] } },
							 }]] },
			CmpTweens: { twindx: [], tweens: [] }
		});

		debugger
		xworld.startUpdate();
		assert.isOk(points.Obj3.mesh);
		assert.isOk(points.Obj3.mesh.geometry.attributes.position);
		assert.equal(points.Obj3.mesh.geometry.attributes.position.itemSize, 3);
		assert.equal(points.Obj3.mesh.geometry.attributes.position.length, 8 * 3 * 3);

		assert.equal(points.CmpTweens.twindx[0], 0);
		assert.equal(points.CmpTweens.tweens[0][0].isPlaying, true);
	});
});

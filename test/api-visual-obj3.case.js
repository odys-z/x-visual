
import chai from 'chai'
import { expect, assert } from 'chai'

import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

// import * as THREE from 'three';
import * as THREE from '../packages/three/three.module-r120';

import * as ECS from '../packages/ecs-js/index';

import XWorld from '../lib/xapp/xworld'
import {x} from '../lib/xapp/xworld'
import {sleep} from '../lib/xutils/xcommon'

import {Visual, Canvas, AssetType} from '../lib/component/visual'
import {Obj3, Obj3Type} from '../lib/component/obj3'
import {AnimType, ModelSeqs} from '../lib/component/morph';
import {CmpTween, CmpTweens} from '../lib/component/tween';
import XTweener from '../lib/sys/tween/xtweener'
import {XEasing} from '../lib/sys/tween/xtweener'
import {MorphingAnim} from '../lib/sys/tween/animizer'

global.performance = performance;

describe('case: [Visual] points', function() {
	this.timeout(10000);
	x.log = 4;
	x.test = true;

	it('Thrender: Obj3Type.POINTS <- AssetType.refPoint etc.', function() {
		const xworld = new XWorld(undefined, 'window', {});
		const ecs = xworld.xecs;

		var box1 = ecs.createEntity({
			id: 'box1',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null }
		});

		var points = ecs.createEntity({
			id: 'points',
			Obj3: { geom: Obj3Type.POINTS,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.refPoint,
					asset: 'box1',
					paras: { a_dest: 'box1' }},
		});

		// simple.gltf has 3 vertices
		var point4model = ecs.createEntity({
			id: 'points-of-model',
			Obj3: { geom: Obj3Type.SPHERE,
					box: [40, 20, 20],
					mesh: undefined },
			Visual:{vtype: AssetType.point,
					// paras: { obj3type: Obj3Type.SPHERE },
					asset: undefined },
		});

		debugger
		xworld.startUpdate();
			assert.isOk( points.Obj3.mesh, '1' );
			assert.isOk( points.Obj3.mesh instanceof THREE.Points, '2' );
			assert.isOk( points.Obj3.mesh.geometry instanceof THREE.BufferGeometry, '3' );
			assert.equal( points.Obj3.mesh.geometry.attributes.position.count, 3 * 8, '4' );

			assert.isOk( point4model.Obj3.mesh, '5' );
			assert.isOk( point4model.Obj3.mesh instanceof THREE.Points, '6' );
			assert.isOk( point4model.Obj3.mesh.geometry instanceof THREE.BufferGeometry, '7' );
			assert.equal( point4model.Obj3.mesh.geometry.attributes.position.count, 147 * 3, '8' );
	});

	it('Thrender: Obj3 referencing box1.mesh (geom: Obj3Type.BOX)', function() {
		const xworld = new XWorld(undefined, 'window', {});
		const ecs = xworld.xecs;

		var box1 = ecs.createEntity({
			id: 'box1',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null }
		});

		var points = ecs.createEntity({
			id: 'points',
			Obj3: { geom: Obj3Type.POINTS,
					box: [],
					mesh: undefined },
			Visual:{vtype: AssetType.refPoint,
					asset: 'box1',
					paras: { a_dest: 'box1' }},
		});

		xworld.startUpdate();
		assert.isOk( points.Obj3.mesh );
		assert.isOk( points.Obj3.mesh instanceof THREE.Points );
		assert.isOk( points.Obj3.mesh.geometry instanceof THREE.BufferGeometry);
		assert.equal( points.Obj3.mesh.geometry.attributes.position.count, 3 * 8 );
	});

	it('Thrender: Obj3 referencing box.mesh (geom: Obj3Type.SPHERE)', function() {
		const xworld = new XWorld(undefined, 'window', {});
		const ecs = xworld.xecs;

		var box = ecs.createEntity({
			id: 'box2',
			Obj3: { geom: Obj3Type.SPHERE,
					box: [20, 20, 8],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null }
		});

		var points = ecs.createEntity({
			id: 'points',
			Obj3: { geom: Obj3Type.POINTS,
					box: [],
					mesh: undefined },
			Visual:{vtype: AssetType.refPoint,
					asset: 'box2',
					paras: { a_dest: 'box2' }},
		});

		var points2 = ecs.createEntity({
			id: 'points2',
			Obj3: { geom: Obj3Type.TORUS,
					box: [20, 20, 20],
					mesh: undefined,	// THREE.Points
					invisible: true },	// It's visible, but alpha 0?
			Visual:{vtype: AssetType.point,
					asset: undefined },
		});

		xworld.startUpdate();
		assert.isOk( points.Obj3.mesh );
		assert.isOk( points.Obj3.mesh instanceof THREE.Points );
		assert.isOk( points.Obj3.mesh.geometry instanceof THREE.BufferGeometry);
		assert.equal( points.Obj3.mesh.geometry.attributes.position.count, 189 );

		assert.isOk( points2.Obj3.mesh );
		assert.isOk( points2.Obj3.mesh instanceof THREE.Points );
		assert.isOk( points2.Obj3.mesh.geometry instanceof THREE.BufferGeometry);
		assert.equal( points2.Obj3.mesh.geometry.attributes.position.count, 3 * 7 * 7 ); // 147, duno why
	});

});

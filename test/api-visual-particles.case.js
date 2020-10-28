
import { chai, expect, assert } from 'chai'
import chaiStats from 'chai-stats'

import * as THREE from '../packages/three/three.module-MRTSupport';

import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld'
import {x} from '../lib/xapp/xworld'
import AssetKeepr from '../lib/xutils/assetkeepr'
import {sleep} from '../lib/xutils/xcommon'
import {AssetType, ShaderFlag} from '../lib/component/visual';
import {Obj3, Obj3Type} from '../lib/component/obj3'
import {AnimType} from '../lib/component/morph'

const {performance} = require('perf_hooks');

global.performance = performance;

describe('case: [Particles] VisualType.points', function() {
	this.timeout(1000000); // for debug
	x.log = 4;
	x.test = true;

	before(() => { });

	it('vtype: convert refPoint to particles', function() {
		const xworld = new XWorld(undefined, 'window', {});
		const ecs = xworld.xecs;

		var completeflags = {};

		var cube = ecs.createEntity({
			id: 'cube0',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null }
		});

		var points = ecs.createEntity({
			id: 'points',
			Obj3: { geom: Obj3Type.NA,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.refPoint,
					asset: 'cube0' ,	// shader with default randomParticle flag
					paras: { a_dest: 'cube0' }},
			ModelSeqs: {
					script: [[{
						mtype: AnimType.U_MORPHi,
					 	paras: {start: 0,			// auto start
								duration: 2.2,		// seconds
								dest: 'cube0',		// cube0.Obj3.mesh
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
		assert.isNumber(points.Obj3.mesh.geometry.attributes.position.array[0]);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[0], -Infinity);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[1], -Infinity);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[2], -Infinity);

		assert.equal(points.CmpTweens.twindx[0], 0);
		assert.equal(points.CmpTweens.tweens[0][0].isPlaying, true);
	});

	it('VisualType.refPoint & AnimType.U_ALPHA script animation', async function() {
		const xworld = new XWorld(undefined, 'window', {});
		const ecs = xworld.xecs;

		var completeflags = {};

		var cube = ecs.createEntity({
			id: 'cube0',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null }
		});

		var points = ecs.createEntity({
			id: 'points',
			Obj3: { geom: Obj3Type.NA,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.refPoint,
					asset: 'cube0' ,	// shader with default randomParticle flag
					paras: { a_dest: 'cube0' }},
			ModelSeqs: {
					script: [[{
						mtype: AnimType.U_ALPHA,
					 	paras: {start: 0,			// auto start
								duration: 0.401,	// seconds
								alpha: [1, 0] },
							}]] },
			CmpTweens: { twindx: [], tweens: [] }
		});

		xworld.startUpdate();
		assert.isNumber(points.Obj3.mesh.material.uniforms.u_alpha.value, 'uniforms.u_alpha');
		assert.isOk(points.Obj3.mesh);
		assert.isOk(points.Obj3.mesh.geometry.attributes.position);
		assert.equal(points.Obj3.mesh.geometry.attributes.position.itemSize, 3);
		assert.equal(points.Obj3.mesh.geometry.attributes.position.length, 8 * 3 * 3);
		assert.isNumber(points.Obj3.mesh.geometry.attributes.position.array[0]);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[0], -Infinity);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[1], -Infinity);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[2], -Infinity);

		assert.equal(points.CmpTweens.twindx[0], 0);
		assert.equal(points.CmpTweens.tweens[0][0].isPlaying, true);
		assert.closeTo(points.Obj3.mesh.material.uniforms.u_alpha.value, 1, 0.1, 'uniforms.u_alpha 1');

		await sleep(500);
		xworld.update();
		assert.equal(points.CmpTweens.twindx[0], 1);
		assert.equal(points.CmpTweens.tweens[0][0].isPlaying, false);
		assert.closeTo(points.Obj3.mesh.material.uniforms.u_alpha.value, 0, 0.1, 'uniforms.u_alpha 0');
	});

	it('VisualType.refPoint & AnimType.U_MORPHi script animation', async function() {
		const xworld = new XWorld(undefined, 'window', {});
		const ecs = xworld.xecs;

		var completeflags = {};

		var cube = ecs.createEntity({
			id: 'cube0',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null }
		});

		var cub2 = ecs.createEntity({
			id: 'cube2',
			Obj3: { geom: Obj3Type.BOX,
					box: [100, 200, 20],
					mesh: undefined },
			Visual:{vtype: AssetType.mesh,
					asset: null }
		});

		var points = ecs.createEntity({
			id: 'points',
			Obj3: { geom: Obj3Type.NA,
					box: [200, 120, 80],
					mesh: undefined },
			Visual:{vtype: AssetType.refPoint,
					asset: 'cube0' ,	// shader with default randomParticle flag
					paras: { a_dest: 'cube0' }},
			ModelSeqs: {
					script: [[{
						mtype: AnimType.U_MORPHi,
					 	paras: {start: 0,			// auto start
								duration: 0.399,	// seconds
								uniforms: {
									u_alpha: [1, 0],
									u_morph: [0, 1] }},
							}]] },
			CmpTweens: { twindx: [], tweens: [] }
		});

		xworld.startUpdate();
		assert.isNumber(points.Obj3.mesh.material.uniforms.u_alpha.value, 'uniforms.u_alpha');
		assert.isOk(points.Obj3.mesh);
		assert.isOk(points.Obj3.mesh.geometry.attributes.position);
		assert.equal(points.Obj3.mesh.geometry.attributes.position.itemSize, 3);
		assert.equal(points.Obj3.mesh.geometry.attributes.position.length, 8 * 3 * 3);
		assert.isNumber(points.Obj3.mesh.geometry.attributes.position.array[0]);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[0], -Infinity);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[1], -Infinity);
		assert.isAbove(points.Obj3.mesh.geometry.attributes.position.array[2], -Infinity);

		assert.equal(points.CmpTweens.twindx[0], 0);
		assert.equal(points.CmpTweens.tweens[0][0].isPlaying, true);
		assert.closeTo(points.Obj3.mesh.material.uniforms.u_alpha.value, 1, 0.1, 'uniforms.u_alpha 1');
		assert.closeTo(points.Obj3.mesh.material.uniforms.u_morph.value, 0, 0.1, 'uniforms.u_morph 0');

		await sleep(500);
		xworld.update();
		assert.equal(points.CmpTweens.twindx[0], 1);
		assert.equal(points.CmpTweens.tweens[0][0].isPlaying, false);
		assert.closeTo(points.Obj3.mesh.material.uniforms.u_alpha.value, 0, 0.1, 'uniforms.u_alpha 0');
		assert.closeTo(points.Obj3.mesh.material.uniforms.u_morph.value, 1, 0.1, 'uniforms.u_morph 1');
	});
});

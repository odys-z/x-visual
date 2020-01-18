/** @module xv.test.xobj */

import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld.js'
import AssetKeepr from '../lib/xutils/assetkeepr'

import {Visual, Canvas, AssetType} from '../lib/component/visual'
import {Obj3, Obj3Type} from '../lib/component/obj3'
import Htmltex from '../lib/sys/htmltex'

global.performance = performance;

/**
 * Business processing of showing html as texture:
 * case: showing multi screen in xworld, with texture updated from div id='h5cont'
 * expected: multiple entities created by Htmltext.createEntityDefs().
 * @class
 */
class CaseMultiScreens {
	constructor(ecs) {
		this.ecs = ecs;
	}

	getInputCase() {
		return {};
	}
}

describe('case: Htmltex (CanvasTexture)', function() {
	let xworld, ecs;
	let htmltex;

	before(function() {
		xworld = new XWorld(undefined, 'window', {});
		ecs = xworld.xecs;
	});

	it('creating a entity definition', function() {
		var testcase1 = new CaseMultiScreens(ecs);
		htmltex = new Htmltex(ecs, testcase1.getInputCase());
		assert.isOk(htmltex);

		var def = Htmltex.createEntityDefs({objcanvas: [
			{domId: 'h5-content',
			 texsize: {width: 512, height: 512}}
		]});
		assert.isOk(def);
		assert.equal(def.length, 1);

		def.forEach(function (d, x) {
			assert.isOk(d.Visual);
			assert.equal(d.Visual.vtype, AssetType.canvas);

			assert.isOk(d.Obj3);
			assert.equal(d.Obj3.geom, Obj3Type.PLANE);

			assert.isOk(d.Canvas);
			assert.equal(d.Canvas.domId, 'h5-content');
			assert.isOk(d.Canvas.options);
			assert.deepEqual(d.Canvas.options, {width: 512, height: 512});
		});
	});

	it('creating 2 entity definitions', function() {
		var testcase1 = new CaseMultiScreens(ecs);
		htmltex = new Htmltex(ecs, testcase1.getInputCase());
		assert.isOk(htmltex);

		var def = Htmltex.createEntityDefs({objcanvas: [
			{domId: 'h5-content',
			 texsize: {width: 512, height: 512}},
			{domId: 'h5-content',
			 texsize: {width: 1024, height: 1024}}
		]});
		assert.isOk(def);
		assert.equal(def.length, 2);

		def.forEach(function (d, x) {
			assert.isOk(d.id);
			console.log('entity id', d.id);

			assert.isOk(d.Visual);
			assert.equal(d.Visual.vtype, AssetType.canvas);

			assert.isOk(d.Obj3);
			assert.equal(d.Obj3.geom, Obj3Type.PLANE);

			assert.isOk(d.Canvas);
			assert.equal(d.Canvas.domId, 'h5-content');
			assert.isOk(d.Canvas.options);
			assert.deepEqual(d.Canvas.options, {width: 512 * (x + 1), height: 512 * (x + 1)});
		});
	});

	it('Htmltex updating (performance logics checking)', function() {
		var testcase2 = new CaseMultiScreens(ecs);
		htmltex = new Htmltex(ecs, testcase2.getInputCase());
		xworld.addSystem('test', htmltex);
		assert.isOk(htmltex);
	});
});


/** @module xv.test.assets */

// import chai from 'chai'
import { chai, expect, assert } from 'chai'
import chaiStats from 'chai-stats'

import AssetKeepr from '../lib/xutils/assetkeepr'

const {performance} = require('perf_hooks');

describe('case: [gltf] load mesh', function() {
	before(() => {
	});

	it('simple.gltf', function(done) {
		AssetKeepr.loadGltfNode('simple.gltf', 'Tree_1_2', // parent Bushes_3_3
			(node) => {
				assert.isOk(node);
				assert.isOk(node.children);
				assert.equal(node.children.length, 1);

				done();
		});	// ix = 221
	});
});

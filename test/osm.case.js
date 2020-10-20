// var expect = require('chai').expect;
import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

import * as THREE from '../../packages/three/three.module-MRTSupport';

import {OsmUtils, ThreeWrapper, R} from '../lib/osm/utils.js'
import {TilesKeeper} from '../lib/osm/tiles-keeper.js'
import {OSM3} from '../lib/osm/osm3.js'

describe('case: OsmUtils', function() {
  let osmutils
  before(function() {
	  chai.use(chaiStats);
	  osmutils = new OsmUtils();
  });

  it('long-lat -> radius convertion', function() {
	// long, lat = 0, 0;  x, y, z = 0, 0, R
	assert.deepAlmostEqual(OsmUtils.rad2cartDegree(0, 0, R), {x: 0, y: 0, z: R});
	// long, lat = 90, 0;  x, y, z = R, 0, 0
	assert.deepAlmostEqual(OsmUtils.rad2cartDegree(90, 0, R), {x: R, y: 0, z: 0});
	assert.deepAlmostEqual(OsmUtils.rad2cartDegree(0, 90), {x: 0, y: R, z: 0});
	assert.deepAlmostEqual(OsmUtils.rad2cartDegree(180, 0), {x: 0, y: 0, z:-R});
	assert.deepAlmostEqual(OsmUtils.rad2cartDegree(-90, 0), {x:-R, y: 0, z: 0});

	assert.deepAlmostEqual(OsmUtils.rad2cartDegree(-90, 0, 100), {x:-100, y: 0, z: 0});
  });

  it('radius -> long-lat convertion', function() {
	var rad_degree = Math.PI / 180;
	// x, y, z = 0, 0, R; long, lat = 0, 0
	assert.deepAlmostEqual(OsmUtils.cart2rad({x: 0, y: 0, z: R}), {lon: 0, lat: 0, r: R});

	// at south pole, longitude can be any degree, so don't use this:
	// assert.deepAlmostEqual(OsmUtils.cart2rad({x: 0, y:-R, z: 0}), {lon: 0, lat: -90 * rad_degree, r: R});
	// instead:
	var rad = OsmUtils.cart2rad({x: 0, y:-R, z: 0});
	console.log('south pole: ', rad);
	assert.deepAlmostEqual(rad, {lon: rad.lon, lat: -90 * rad_degree, r: R});

	assert.deepAlmostEqual(OsmUtils.cart2rad({x: 100, y:0, z: 0}), {lon: 90 * rad_degree, lat: 0, r: 100});
  });
});

class OSM3Test {
	constructor() {
		this.center = {lon: 0, lat: 0};
	}

	addTileMesh(mesh, xyz) {
		console.log('adding tile mesh: ', mesh, xyz);
	}
}

describe('case: TilesKeeper', function() {
  let tileskeepr;
  let osm3;
  before(function() {
	chai.use(chaiStats);
	// Note: OSM3 using window, not supported here
	osm3 = new OSM3Test();
	// Note: providing js path will creating Blob, not supported here
	// tileskeepr = new TilesKeeper(osm3, '../lib/osm/tilles-worker.js');
	tileskeepr = new TilesKeeper(osm3);
  });

  it('find tiles', function() {
	// long, lat = 0, 0;  x, y, z = 0, 0, R
	// assert.deepAlmostEqual(tileskeepr.rad2cartDegree(0, 0, R), {x: 0, y: 0, z: R});
    assert.isOk(osm3);
  });

});

describe('case: ThreeWrapper', function() {
  before(function() {
  });

  it('init three wrapper', function() {
	  assert.isOk(ThreeWrapper.geom([0, 0, 0]));
  });
});

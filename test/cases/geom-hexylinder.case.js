import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

import * as THREE from 'three';
import {vec3, mat4} from '../../lib/xmath/vec'
import xmath from '../../lib/xmath/math'
import xgeom from '../../lib/xmath/geom'

describe('case: Geometry - tile map', function() {
  before(function() {
	  chai.use(chaiStats);
  });

  var buf = [0, 0, 0];

  it('hexa-tile', function() {
	const points = [[0, 0, 0], [100, 0, 0]];
	var t0 = xgeom.hexatile(1);     // left
	assert.isOk(t0.vert, 't0.vert');
	assert.isOk(t0.norm, 't0.norm');
  });

  // it('road xz ploygon (3 way points)', function() {
	// const features = [{ geometry: { coordinates: [[0, 0], [100, 0], [100, 100]] } }];
	// debugger
	// var {geom, path} = xgeom.generateWayxz( features, 0, [0, 0, 0], {halfWidth: 25});
	// var wp = geom.getAttribute('position');
  //
	// assert.isOk(wp, 'way points');
	// assert.equal(wp.count, 6, 'way points count');
  //
	// eq(wp, 0, [0, 0, -25]); // 0: r0 (-z, +y-3847)
	// eq(wp, 1, [75, 0, -25]);
	// eq(wp, 2, [75, 0, -100]);
  //
	// eq(wp, 3, [125, 0, -100]);
	// eq(wp, 4, [125, 0, 25]);
	// eq(wp, 5, [0, 0, 25]);
  //
	// function eq(points, idx, target) {
	// 	var p = [points.array[idx * 3], points.array[idx * 3 + 1], points.array[idx * 3 + 2]];
	// 	assert.isTrue(vec3.eq(p, target), `${idx} - ${p} : ${target}`);
	// }
  // });

});

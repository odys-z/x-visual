import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

// import * as THREE from 'three';
import * as THREE from '../../packages/three/three.module-r120';

import {vec3, mat4} from '../../lib/xmath/vec'
import xmath from '../../lib/xmath/math'
import xgeom from '../../lib/xmath/geom'

describe('case: Geometry - geopath', function() {
  before(function() {
	  chai.use(chaiStats);
  });

  var buf = [0, 0, 0];

  it('path waypoints expansion (segment)', function() {
	const points = [[0, 0, 0], [100, 0, 0]];
	var l0 = xgeom.xzExpandWaypoint(
					points[0], // waypoint
					[1, 0, 0], // dir
					10, 0,     // w, y0
					buf,       // buffer / result
					true);     // left
	assert.isTrue(vec3.eq([0, 0, -10], l0, 0.0001), 'l0');

	var l1 = xgeom.xzExpandWaypoint(
					points[1], // waypoint
					[1, 0, 0], // dir
					10, 0,     // w, y0
					buf,       // buffer / result
					true);     // left
	assert.isTrue(vec3.eq([100, 0, -10], l1, 0.0001), 'l1');

	var r0 = xgeom.xzExpandWaypoint(
					points[0], // waypoint
					[1, 0, 0], // dir
					10, 0,     // w, y0
					buf)       // buffer / result
	assert.isTrue(vec3.eq([0, 0, 10], l0, 0.0001), 'r0');

	var r1 = xgeom.xzExpandWaypoint(
					points[1], // waypoint
					[1, 0, 0], // dir
					10, 0,     // w, y0
					buf)       // buffer / result
	assert.isTrue(vec3.eq([100, 0, 10], l1, 0.0001), 'r1');
  });

  it('road xz ploygon (3 way points)', function() {
	const features = [{ geometry: { coordinates: [[0, 0], [100, 0], [100, 100]] } }];
	debugger
	var {geom, path} = xgeom.generateWayxz( features, 0, [0, 0, 0], {halfWidth: 25});
	var wp = geom.getAttribute('position');

	assert.isOk(wp, 'way points');
	assert.equal(wp.count, 6, 'way points count');

	eq(wp, 0, [0, 0, -25]); // 0: r0 (-z, +y-3847)
	eq(wp, 1, [75, 0, -25]);
	eq(wp, 2, [75, 0, -100]);

	eq(wp, 3, [125, 0, -100]);
	eq(wp, 4, [125, 0, 25]);
	eq(wp, 5, [0, 0, 25]);

	function eq(points, idx, target) {
		var p = [points.array[idx * 3], points.array[idx * 3 + 1], points.array[idx * 3 + 2]];
		assert.isTrue(vec3.eq(p, target), `${idx} - ${p} : ${target}`);
	}
  });

});

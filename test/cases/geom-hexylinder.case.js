import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

import * as THREE from 'three';
import {vec3, mat4} from '../../lib/xmath/vec'
import xmath from '../../lib/xmath/math'
import xgeom from '../../lib/xmath/geom'

describe('case: Geometry - tile map', function() {
  var t0;
  before(function() {
	chai.use(chaiStats);
	t0 = xgeom.hexatile(1);
  });

  var buf = [0, 0, 0];

  it('hexa-tile (r=1)', function() {
	assert.isOk(t0.vert, 't0.vert');
	assert.isOk(t0.norm, 't0.norm');
	assert.isTrue(vec3.eq(t0.vert[0], [0, 0, 1]), 'vert 0');
	assert.isTrue(vec3.eq(t0.norm[0], [t0.r05, 0, t0.sqrt32/t0.r]), 'norm 0');
  });

  it('xgeom.hexacylinder3857', function() {
	var cx = 25, cy = 50;
	var verts = 2 * (14 + 12); // 2 locs
	var ctx = new Object();
	ctx.vx = 0; // starting vert index for each feature. (26 vert / feature)
	ctx.r = 1;
	ctx.pos = new Float32Array(verts * 3);
	ctx.uvs = new Float32Array(verts * 2);
	ctx.normals = new Float32Array(verts * 3);
	ctx.dirs = new Float32Array(verts * 3);
	ctx.index = [];

	debugger
	xgeom.hexacylinder3857( {
			  coord: [cx, cy + 100],
			  height: 11,
			  geoScale: 1
		  },
		  [cx, cy],
		  t0, ctx);

	assert.equal(ctx.pos[0], 0, 'vert 0/0.x');
	assert.equal(ctx.pos[1], 0, 'vert 0/0.y');
	assert.equal(ctx.pos[2], - 100 + t0.r, 'vert 0/0.z');

	assert.equal(ctx.pos[ctx.stride * 3 + 1], 11, 'vert 0/0.y upper');

	var vx2 = ctx.vx;

	xgeom.hexacylinder3857( {
			  coord: [cx + 16, cy - 50],
			  height: 11,
			  geoScale: 1
		  }, [cx, cy], t0, ctx);

	assert.equal(ctx.pos[vx2 * 3 + 0], 16, 'vert 1/0.x');
	assert.equal(ctx.pos[vx2 * 3 + 1], 0, 'vert 1/0.y');
	assert.equal(ctx.pos[vx2 * 3 + 2], 50 + t0.r, 'vert 1/0.z');
	assert.equal(ctx.pos[(vx2 + ctx.stride ) * 3 + 1], 11, 'vert 1/0.y upper');

	assert.equal(ctx.pos[(vx2 + 3) * 3 + 0], 16, 'vert 1/3.x');
	assert.equal(ctx.pos[(vx2 + 3) * 3 + 1], 0, 'vert 1/3.y');
	assert.equal(ctx.pos[(vx2 + 3) * 3 + 2], 50 - t0.r, 'vert 1/3.z');
	assert.equal(ctx.pos[(vx2 + 3 + ctx.stride ) * 3 + 1], 11, 'vert 1/0.y upper');
  });
});

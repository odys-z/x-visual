/**Test case of xcommon/vec.js with mocha and chai.
 */

import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

// const {performance} = require('perf_hooks');

import * as THREE from 'three'
import {vec3, mat4, rad} from '../lib/xutils/vec';

describe('case: [vec3] operator basics', () => {

    it('vec3 instance operator', () => {
        var v1 = new vec3();
        var v2 = new vec3([1, 2, 3]);
        var v3 = new vec3(2, 4, 6);

        assert.isTrue(v1.add(v2).mul(2).eq(v3));
        assert.closeTo(v3.length() * v3.length(), v3.dot(v3), 0.01);
        assert.closeTo(v3.length() * v3.length(), v2.div(0.5).dot(v2), 0.01);
        assert.isTrue(v2.js() instanceof THREE.Vector3);
        assert.equal(v3.js().z,  6);
    });

});

describe('case: [mat4] operator basics', () => {

    it('mat4 instance operator', () => {
        var r90 = rad(90);
        var r_90 = rad(-90);
        var rx = mat4.rotx(r90);
        var ry = mat4.roty(r90);
        var rz = mat4.rotz(r90);
        var r_x = mat4.rotx(r_90);

        // rotz(i, 90) = j
        var i = new vec3(1, 0, 0);
        assert.isTrue(new vec3(0, 1, 0).eq(i.mat4(rz)), "rot-z(i, 90) == j");

        var p = new vec3(1, 1, 1);
        p.mat4(rx);
        assert.isTrue(p.eq(new vec3(1, -1, 1)), 'rot x 90 degree');
        p.mat4(ry);
        assert.isTrue(p.eq(new vec3(1, -1, -1)), 'rot y 90 degree');
        p.mat4(rz);
        assert.isTrue(p.eq(new vec3(1, 1, -1)), 'rot z 90 degree');
        p.mat4(ry);
        assert.isTrue(p.eq(new vec3(-1, 1, -1)), 'rot y 90 degree 2');

        assert.isTrue(new vec3(0.5, 0.5, 0.5).mat4(r_x).eq(new vec3([0.5, 0.5, -0.5])), "rot x -90");

        // general rotation
        /* rx.mul(ry).mul(rz) = [
               e-33, 0, 1, 0,
               e-17, 1, 0, 0,
               -1, e-17, e-33, 0,
               0, 0, 0, 1 ]
         * see General rotations, Rotation Matrix, https://en.wikipedia.org/wiki/Rotation_matrix
         *
         */
        var r = rad(90);
        var a = r; var b = r;
        var ca = Math.cos( a );
        var sa = Math.sin( a );
        var cb = Math.cos( b );
        var sb = Math.sin( b );
        var cr = Math.cos( r );
        var sr = Math.sin( r );
        var R = new mat4([
            ca * cb, ca * sb * sr - sa * cr, ca * sb * cr + sa * sr, 0,
            sa * cb, sa * sb * sr + ca * cr, sa * sb * cr - ca * sr, 0,
            -sb,     cb * sr,                cb * cr,                0,
            0,       0,                      0,                      1 ]);
        assert.isTrue(R.eq(rx.mul(ry).mul(rz)), "General rotation 90 degree: https://en.wikipedia.org/wiki/Rotation_matrix");


        // r = Math.PI / 6;
        r = rad(30);
        rx = mat4.rotx(r);
        ry = mat4.roty(r);
        rz = mat4.rotz(r);

        a = r; var b = r;
        ca = Math.cos( a );
        sa = Math.sin( a );
        cb = Math.cos( b );
        sb = Math.sin( b );
        cr = Math.cos( r );
        sr = Math.sin( r );
        R = new mat4([
            ca * cb, ca * sb * sr - sa * cr, ca * sb * cr + sa * sr, 0,
            sa * cb, sa * sb * sr + ca * cr, sa * sb * cr - ca * sr, 0,
            -sb,     cb * sr,                cb * cr,                0,
            0,       0,                      0,                      1 ]);
        assert.isTrue(R.eq(rx.mul(ry).mul(rz)), "General rotation Pi/6: https://en.wikipedia.org/wiki/Rotation_matrix");

    });

    it('mat4 orbit combine', () => {
        debugger
        var affines = [];
        affines.push({translate: [-10, 0, 0]});
        affines.push({rotate: {deg: 180, axis: [0, 1, 0]}});
        affines.push({translate: [10, 0, 0]});

        var p = new vec3(); // 0, 0, 0
		var m4 = mat4.combine(affines);
        p.mat4(m4);
        console.log(m4.m, p);
        assert.isTrue(p.eq(new vec3(20, 0, 0)), "Origin point rotate 180° around Y axis pivoted at (10, 0, 0)");
    });
});

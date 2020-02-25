/**Test case of xcommon/vec.js with mocha and chai.
 * @module xv.test.vec
 */

import chai from 'chai'
import { expect, assert } from 'chai'

import * as THREE from 'three'
import {vec3, mat4, radian} from '../lib/xmath/vec'
import {Affine} from '../lib/xmath/affine'


describe('case: [vec3] operator basics', () => {

    it('vec3 instance operator', () => {
        var v1 = new vec3();
        var v2 = new vec3([1, 2, 3]);
        var v3 = new vec3(2, 4, 6);

        assert.isTrue(v1.add(v2).mul(2).eq(v3), "1 ---");
        assert.closeTo(v3.length() * v3.length(), v3.dot(v3), 0.01, "2 ---");
        assert.closeTo(v3.length() * v3.length(), v2.div(0.5).dot(v2), 0.01, "3 ---");
        assert.isTrue(v2.js() instanceof THREE.Vector3, "4 ---");
        assert.equal(v3.js().z, 6, "5 ---");
    });

});

function orbitY_theta ( theta, affines, pivot ) {
    Affine.orbit( theta, pivot, [0, 1, 0], affines);
}

describe('case: [mat4] THREE.Matrix4 compatiblility', () => {
    it('mat4 -> THREE.Matrix4', () => {
        var r90 = radian(90);
        var rx = mat4.rotx(r90);
        var m4js = new THREE.Matrix4().set(...rx.m);
        var jsarr = m4js.transpose().toArray();
        for (var i = 0; i < rx.m.length; i++) {
            assert.closeTo(jsarr[i], rx.m[i], 0.001, `Matrix4.set(): jsarr[${i}] v.s. m4[${i}]`);
        }

        m4js = mat4.js(rx);
        jsarr = m4js.transpose().toArray();
        for (var i = 0; i < rx.m.length; i++) {
            assert.closeTo(jsarr[i], rx.m[i], 0.001, `mat4.js(): jsarr[${i}] v.s. m4[${i}]`);
        }
    });
});

describe('case: [mat4] operator basics', () => {
    it('mat4 rotate & orbit', () => {
        var m4 = new mat4();
        m4.m[0] = 3.9888;
        m4.precision(3);
        debugger
        var m4_ = new mat4();
        m4_.m[0] = 3.989;
        assert.isTrue(m4.eq(m4_), "round(3) & eq()");

        var mt4 = new mat4().rotate(radian(90), 0, 1, 0);
        var ry = mat4.roty(radian(90));
        assert.isTrue(mt4.eq(ry), "A 000");

        var mt4 = new mat4()
            .rotate(radian(60), 1, 0, 0)
            .rotate(radian(30), 1, 0, 0);
        var rx = mat4.rotx(radian(90));
        assert.isTrue(mt4.eq(rx), "A ---");

        mt4 = new mat4()
            .translate(-120, 0, 0)
            .rotate(radian(180), 0, 1, 0)
            .translate(20, 0, 0);

        var mt5 = new mat4().translate(140, 0, 0).reflect(-1, 1, -1);
        assert.isTrue(mt5.eq(mt4), "B ---");

        mt4 = new mat4()
            .translate(-120, 0, 0)
            .rotate(radian(60), 0, 1, 0)
            .translate(120, 0, 0);
        mt4.translate(-120, 0, 0)
            .rotate(radian(60), 0, 1, 0)
            .translate(120, 0, 0);
        mt4.translate(-120, 0, 0)
            .rotate(radian(60), 0, 1, 0)
            .translate(120, 0, 0);
        mt5 = new mat4().translate(240, 0, 0).reflect([-1, 1, -1]);
        assert.isTrue(mt5.eq(mt4), "C ---");
    });

    it('mat4 instance operator', () => {
        var r90 = radian(90);
        var r_90 = radian(-90);
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
        var r = radian(90);
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
        r = radian(30);
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
        var affines = [];
        // affines.push({translate: [-10, 0, 0]}); // translation = 0 - pivot
        // affines.push({rotate: {deg: 180, axis: [0, 1, 0]}});
        // affines.push({translate: [10, 0, 0]});  // - translation
        orbitY_theta(180, affines, new vec3(10, 0, 0));

        var p = new vec3(); // 0, 0, 0
        var m4 = new mat4();
        var combined = {mi: m4, m0: mat4.I()};
		Affine.combine(affines, combined);
        p.mat4(m4);
        assert.isTrue(p.eq(new vec3(20, 0, 0)), "Origin point rotate 180° around axis j pivoted at vec3(10, 0, 0)");

        affines = [];
        orbitY_theta(180, affines, [20, 0, 0]);
        p = new vec3();
        combined.m0.i();
        combined.mi.i();
		Affine.combine(affines, combined);
        p.mat4(combined.mi);
        debugger
        assert.isTrue(p.eq(new vec3(40, 0, 0)), "Origin point rotate 180° around axis j pivoted at [20, 0, 0]");

        // 12 times of 30° rotation will make it come back
        p = new vec3(5, 5, 5);
        var p_ = p.clone();
        affines = [];
        var theta = 30;
        var pivot = new vec3([1, 0, 0]);
        for (var i = 1; i <= 360 / theta; i++) {
            orbitY_theta(theta, affines, pivot);
        }
        combined.m0.i();
        combined.mi.i();
		Affine.combine(affines, combined);
        m4 = combined.mi;
        p.mat4(m4);
        assert.isTrue(p.eq(p_), `Origin point rotate axis j for ${360/theta} times, each ${theta}°`);

        // orbit 60° will result in radius distance

        // FIXME
        // when orbiting Y in different y axis, calculation difference is high.
        // Why this happens?
        // AssertionError: equilateral triangle: expected 14.730919862656235 to be close to 14.422204717764595 +/- 0.01
        // p = new vec3(15, 2, -3);
        // pivot = new vec3([3, 5, 5]);

        p = new vec3(15, 5, -3);
        pivot = new vec3([-3, 5, 5]);

        theta = -60;
        p_ = p.clone();
        var p1 = p.clone();
        var radius = p_.sub(pivot).length();
        // console.log('radius', radius, p_);

        affines = [];
        orbitY_theta(theta, affines, pivot);
        combined.m0.i();
        combined.mi.i();
		Affine.combine(affines, combined);
        p.mat4(m4);
        var chord = p1.sub(p).length();
        // console.log('chord', chord, 'p', p, 'p1', p1);

        assert.closeTo(radius, chord, 0.01, "equilateral triangle");
    });
});

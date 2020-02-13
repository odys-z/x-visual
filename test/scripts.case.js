
/** @module xv.test.tween */

import chai from 'chai'
import { expect, assert } from 'chai'

import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as THREE from 'three';
import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld'
import {x} from '../lib/xapp/xworld'
import {sleep} from '../lib/xutils/xcommon'

import {Visual, AssetType} from '../lib/component/visual'
import {Obj3, Obj3Type} from '../lib/component/obj3'
import {AnimType, ModelSeqs} from '../lib/component/morph';
import {CmpTween, CmpTweens} from '../lib/component/tween';
import XTweener from '../lib/sys/tween/xtweener'
import {XEasing} from '../lib/sys/tween/xtweener'
import {MorphingAnim} from '../lib/sys/tween/animizer'

global.performance = performance;

function assertComplete(buffer) {
    var buff = buffer;
    return new function (rotation, cmp) {
        buff.cmp = cmp;
    };
}

describe('case: [script] anim sequence', function() {
    this.timeout(100000);
    x.log = 4;

    it('animizer: ModelSeq', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var completeflags = {};

        const opa0 = 0.9;
        const opa1 = 0.05;
        var cube = ecs.createEntity({
            id: 'fade-out',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],    // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    // Three use document to load assets, which doesn't exist whil testing
                    // null acts as a flag to let thrender create a ram texture.
                    asset: null },

            // TODO docs: in version 1.0, only type of sequence animation is supported
            ModelSeqs: {
                script: [[{ mtype: AnimType.ALPHA,
                            paras: {start: 0,        // auto start, only alpha tween in v0.2
                                    duration: 0.8,    // seconds
                                    alpha: [opa0, opa1],
                                     ease: XEasing.Elastic.InOut}
                        }]] },
            CmpTweens: {
                twindx: [],    // e.g. twindex[0] is 0, script[0] current is 0, created by animizer
                tweens: []}    // initialized by animizer, handled by XTweener. [] is safely ignored
        });

        xworld.startUpdate();
            assert.equal( cube.CmpTweens.twindx.length, 1, 'twindx != 1' );
            assert.equal( cube.CmpTweens.tweens.length, 1, 'tweens != 1' );
            assert.equal( cube.CmpTweens.tweens[0].length, 1, 'tweens length 1' );

            assert.closeTo(cube.Obj3.mesh.material.opacity, opa0, 0.01);

        await sleep(1000);
            assert.closeTo(cube.Obj3.mesh.material.opacity, opa0, 0.01);
            xworld.update();
            assert.closeTo(cube.Obj3.mesh.material.opacity, opa1, 0.01);
    });

    it('consecutive scripts', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var completeflags = {};

        var cube = ecs.createEntity({
            id: 'cube0',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],  // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: null },        // let thrender create a ram texture.
            // ModelSeq is an array of animation sequences.
            // Each sequence is an array.
            ModelSeqs: {
                script: [[{ mtype: AnimType.OBJ3ROTX,
                            paras: {start: 0,        // auto start
                                    duration: 0.801,   // seconds
                                    cmd: '',
                                    deg: [0, 45],    // from, to
                                    ease: undefined} // default linear
                          },
                          { mtype: AnimType.OBJ3ROTAXIS,
                            paras: {start: Infinity, // auto start, follow previous
                                    duration: 1,     // seconds
                                    axis: [0, 1, 0],
                                    deg: [0, 90],    // from, to
                                    ease: XEasing.Elastic.InOut,
                                    onComplete: assertComplete(completeflags)} }
                         ]] },
            CmpTweens: {}
        });

        xworld.startUpdate();
            assert.equal( cube.CmpTweens.twindx.length, 1, 'twindx != 1');
            assert.equal( cube.CmpTweens.tweens.length, 1, 'tweens != 1');
            assert.equal( cube.CmpTweens.tweens[0].length, 2, 'tweens length 2');

            assert.equal( cube.CmpTweens.twindx[0], 0 );
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, true, 'A cube.CmpTweens.tweens[0][0].isPlaying true');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isPlaying, false, 'A cube.CmpTweens.tweens[0][1].isPlaying false');
            assert.equal( !!cube.CmpTweens.tweens[0][0].isCompleted, false, 'A cube.CmpTweens.tweens[0][0].isCompleted false');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isCompleted, false, 'A cube.CmpTweens.tweens[0][1].isCompleted false');

        await sleep(1000);
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, true, 'B cube.CmpTweens.tweens[0][0].isPlaying true');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isPlaying, false, 'B cube.CmpTweens.tweens[0][1].isPlaying false');
            assert.equal( !!cube.CmpTweens.tweens[0][0].isCompleted, false, 'B cube.CmpTweens.tweens[0][0].isCompleted false');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isCompleted, false, 'B cube.CmpTweens.tweens[0][1].isCompleted false');

            xworld.update();
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, false, 'C tweens[0][0].isPlaying false');
            assert.equal( cube.CmpTweens.tweens[0][1].isPlaying, true, 'C cube.CmpTweens.tweens[0][1].isPlaying true');
            assert.equal( cube.CmpTweens.tweens[0][0].isCompleted, true, 'C cube.CmpTweens.tweens[0][0].isCompleted true');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isCompleted, false, 'C cube.CmpTweens.tweens[0][1].isCompleted false');

        await sleep(1200);
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, false, 'C tweens[0][0].isPlaying false');
            assert.equal( cube.CmpTweens.tweens[0][1].isPlaying, true, 'C cube.CmpTweens.tweens[0][1].isPlaying true');
            assert.equal( cube.CmpTweens.tweens[0][0].isCompleted, true, 'C cube.CmpTweens.tweens[0][0].isCompleted true');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isCompleted, false, 'C cube.CmpTweens.tweens[0][1].isCompleted false');

            xworld.update();
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, false, 'D cube.CmpTweens.tweens[0][0].isPlaying false');
            assert.equal( cube.CmpTweens.tweens[0][1].isPlaying, false, 'D cube.CmpTweens.tweens[0][1].isPlaying false');
            assert.equal( cube.CmpTweens.tweens[0][0].isCompleted, true, 'D cube.CmpTweens.tweens[0][0].isCompleted true');
            assert.equal( cube.CmpTweens.tweens[0][1].isCompleted, true, 'D cube.CmpTweens.tweens[0][1].isCompleted true');
    });

    it('self repeating', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var completeflags = {};

        var cube = ecs.createEntity({
            id: 'cube0',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],  // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: null },        // let thrender create a ram texture.
            ModelSeqs: {
                script: [[{ mtype: AnimType.OBJ3ROTX,
                            paras: {start: 0,         // auto start
                                    duration: 0.4,    // seconds
                                    cmd: '',
                                    deg: [0, 45],     // from, to
                                    ease: undefined}},// default linear
                          { mtype: AnimType.OBJ3ROTAXIS,
                            paras: {start: Infinity,  // auto start, follow 0
                                    duration: 0.4,    // seconds
                                    axis: [0, 1, 0],
                                    deg: [0, 90],     // from, to
                                    ease: XEasing.Elastic.InOut },
                            followBy: [{entity: 'cube0',
                                        seqx: 0,
                                        start: 0.4}] }
                          ]]
                },
            CmpTweens: {}
        });

        xworld.startUpdate();
            assert.equal( cube.CmpTweens.twindx[0], 0 );
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, true, '0s cube.CmpTweens.tweens[0][0].isPlaying');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isPlaying, false, '0s cube.CmpTweens.tweens[0][1].isPlaying');
            assert.equal( !!cube.CmpTweens.tweens[0][0].isCompleted, false, '0s cube.CmpTweens.tweens[0][0].isCompleted');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isCompleted, false, '0s cube.CmpTweens.tweens[0][1].isCompleted');

        await sleep(600);
            xworld.update();
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, false, '0.6s tweens[0][0].isPlaying');
            assert.equal( cube.CmpTweens.tweens[0][0].isCompleted, true, '0.6s cube.CmpTweens.tweens[0][0].isCompleted');
            assert.equal( cube.CmpTweens.tweens[0][1].isPlaying, true, '0.6s cube.CmpTweens.tweens[0][1].isPlaying');
            assert.equal( !!cube.CmpTweens.tweens[0][1].isCompleted, false, '0.6s cube.CmpTweens.tweens[0][1].isCompleted');

        await sleep(400);
            xworld.update();
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, false, '1s cube.CmpTweens.tweens[0][0].isPlaying');
            assert.equal( cube.CmpTweens.tweens[0][0].isCompleted, true, '1s cube.CmpTweens.tweens[0][0].isCompleted');
            assert.equal( cube.CmpTweens.tweens[0][1].isPlaying, false, '1s cube.CmpTweens.tweens[0][1].isPlaying');
            assert.equal( cube.CmpTweens.tweens[0][1].isCompleted, true, '1s cube.CmpTweens.tweens[0][1].isCompleted');
            debugger
            xworld.update();// 0 is following [1] and delayed (completed by previous playing)
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, false, '1s [updated] cube.CmpTweens.tweens[0][0].isPlaying');
            assert.equal( cube.CmpTweens.tweens[0][0].isCompleted, true, '1s [updated] cube.CmpTweens.tweens[0][0].isCompleted');
            assert.equal( cube.CmpTweens.tweens[0][1].isPlaying, false, '1s [updated] cube.CmpTweens.tweens[0][1].isPlaying');
            assert.equal( cube.CmpTweens.tweens[0][1].isCompleted, true, '1s [updated] cube.CmpTweens.tweens[0][1].isCompleted');

        await sleep(400);
            xworld.update();// 0 is following [1] and started
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, true, '1.4s cube.CmpTweens.tweens[0][0].isPlaying');
            assert.equal( cube.CmpTweens.tweens[0][0].isCompleted, false, '1.4s cube.CmpTweens.tweens[0][0].isCompleted');
    });

    it('animizer: referencing particles translating', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;
        var cube = ecs.createEntity({
            id: 'cube0',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],    // bounding box
                    // mesh is inited by thrender, can be ignored here - MorphSwitch's target
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: undefined },        // use ram texture, can't load 'tex/byr0.png'
            ModelSeqs: {// fade-out now, wait for fade-in
                script: [[{ mtype: AnimType.ALPHA,
                            paras: {start: Infinity,    // start with plane[0][1] at 1.6s
                                    duration: 0.4,        // seconds
                                    alpha: [0.05, 0.95],// fade-in
                                     ease: XEasing.Elastic.In}
                         }],
                         [{ mtype: AnimType.ALPHA,
                            paras: {start: 0,
                                    duration: 0.4,        // seconds
                                    alpha: [0.95, 0.05],// fade-out
                                    ease: undefined },
                            startWith:[{entity: 'points',
                                        seqx: 0,    // index of the fade-in
                                        start: 0.00 }] },
                         ]] },
            CmpTweens: { twindx: [], tweens: [] }
        });

        var points = ecs.createEntity({
            id: 'points',
            Obj3: { geom: Obj3Type.NA,    // undefined
                    box: [1, 1, 1],                        // not used, using entity1's
                    mesh: undefined,                    // THREE.Points
                     invisible: false },                    // It's visible, but alpha 0?
            Visual:{vtype: AssetType.refPoint,
                    asset: 'cube0' },
            ModelSeqs: {
                script: [[{ mtype: AnimType.ALPHA,
                            paras: {start: Infinity,    // triggered by entity1 at 0.4s
                                    duration: 0.4,        // seconds
                                    alpha: [0.05, 0.92],// fade-in
                                     ease: XEasing.Elastic.In} },
                          { mtype: AnimType.U_VERTS_TRANS,
                            paras: {start: Infinity,    // follow previous, 0.8
                                    duration: 0.4,        // seconds
                                    dest: 'plane',        // plane.Obj3.mesh
                                    uniforms: { u_morph: [0, 1],
                                                u_alpha: [0.1, 0.9] } },
                            followBy: [{entity: 'plane',
                                        seqx: 0,    // index of the fade-in
                                        start: 0.0 }] },
                          { mtype: AnimType.ALPHA,
                            paras: {start: Infinity,    // triggered by entity1
                                    duration: 0.4,        // seconds
                                    alpha: [0.9, 0.05],    // fade out
                                     ease: XEasing.Elastic.In} }
                       ]] },
            CmpTweens: { twindx: [], tweens: [] }
        });

        var plane = ecs.createEntity({
            id: 'plane',
            Obj3: { geom: Obj3Type.PLANE,
                    box: [210, 200, 0],    // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: undefined }, // 'city/textures/World_ap_baseColor.jpeg'
            ModelSeqs: {
                script: [[{ mtype: AnimType.ALPHA,
                            paras: {start: Infinity,    // follow points[0][1], at 1.2s
                                    duration: 0.4,        // seconds
                                    alpha: [0.05, 0.90],// fade in
                                     ease: XEasing.Elastic.In},
                            followBy: [{entity: 'plane',
                                        seqx: 1,        // test follow by itself
                                        start: 0.0 }] }],
                         [{ mtype: AnimType.ALPHA,
                            paras: {start: Infinity,    // follow at 1.6s
                                    duration: 0.4,
                                    alpha: [0.95, 0.05],// fade out
                                    ease: undefined },
                            startWith: [{entity: 'cube0',
                                         seqx: 0,
                                         start: 0.0}]
                         }]
                        ]},
            CmpTweens: { twindx: [], tweens: [] }
        });

        xworld.startUpdate();// cube fade out
            assert.equal( cube.CmpTweens.twindx.length, 2, 'cube twindx != 2' );
            assert.equal( points.CmpTweens.twindx.length, 1, 'particles twindx != 1' );
            assert.equal( plane.CmpTweens.twindx.length, 2, 'particles twindx != 2' );

            assert.equal( !!cube.CmpTweens.tweens[0][0].isPlaying, false, '0 cube fading in' );
            assert.equal( cube.CmpTweens.tweens[1][0].isPlaying, true, '0 cube fading out' );

            // been triggered with 'startWith'
            assert.equal( points.CmpTweens.twindx[0], 0, '600 points plaing 0-th' );
            assert.equal( points.CmpTweens.tweens[0][0].isPlaying, true, '0 points fading in' );
            assert.equal( !!points.CmpTweens.tweens[0][1].isPlaying, false, '0 points translate' );
            assert.equal( !!plane.CmpTweens.tweens[0][0].isPlaying, false, '0 plane fade in' );

            assert.equal( !!plane.CmpTweens.tweens[0][0].isPlaying, false, '0 plane fading in' );
            assert.equal( !!plane.CmpTweens.tweens[1][0].isPlaying, false, '0 plane fading out' );

        await sleep(600);// points moving
            xworld.update();
            assert.equal( !!cube.CmpTweens.tweens[0][0].isPlaying, false, '600 cube fade in' );
            assert.equal( cube.CmpTweens.tweens[1][0].isPlaying, false, '600 cube fading out' );
            assert.equal( cube.CmpTweens.tweens[1][0].isCompleted, true, '600 cube fading out complete' );

            assert.equal( points.CmpTweens.twindx[0], 1, '600 points plaing 0,1-th' );
            assert.equal( points.CmpTweens.tweens[0][0].isPlaying, false, '600 points fade in' );
            assert.equal( points.CmpTweens.tweens[0][1].isPlaying, true, '600 points translate' );
            assert.equal( !!points.CmpTweens.tweens[0][2].isPlaying, false, '600 points sfade out' );

            assert.equal( !!plane.CmpTweens.tweens[0][0].isPlaying, false, '600 plane fading in' );
            assert.equal( !!plane.CmpTweens.tweens[1][0].isPlaying, false, '600 plane fading ouot' );

        await sleep(400);// points fade out, plane fade in
            xworld.update();
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, undefined, '1s cube fade in' );
            assert.equal( cube.CmpTweens.tweens[1][0].isPlaying, false, '1s cube fading out' );
            assert.equal( cube.CmpTweens.tweens[1][0].isCompleted, true, '1s cube fading out complete' );

            assert.equal( points.CmpTweens.twindx[0], 2, '1s points plaing 0,2-th' );
            assert.equal( points.CmpTweens.tweens[0][0].isPlaying, false, '1s points fade in' );
            assert.equal( points.CmpTweens.tweens[0][1].isPlaying, false, '1s points translate' );
            assert.equal( points.CmpTweens.tweens[0][1].isCompleted, true, '1s points translate completed' );
            assert.equal( points.CmpTweens.tweens[0][2].isPlaying, true, '1s points fade out' );

            // been started by 'points[0][1].followBy'
            assert.equal( plane.CmpTweens.twindx[0], 0, '1s plane playing 0,0-th' );
            assert.equal( plane.CmpTweens.tweens[0][0].isPlaying, true, '1s plane fading in' );
            assert.equal( !!plane.CmpTweens.tweens[1][0].isPlaying, false, '1s plane fading out' );

            assert.equal( plane.CmpTweens.twindx[1], Infinity, '1s plane [1] is waiting' );

        await sleep(400);// plane fade in completed
            xworld.update();
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, undefined, '1.4s cube fade in' );
            assert.equal( cube.CmpTweens.tweens[1][0].isPlaying, false, '1.4s cube fading out' );
            assert.equal( cube.CmpTweens.tweens[1][0].isCompleted, true, '1.4s cube fading out complete' );

            assert.equal( points.CmpTweens.twindx[0], 3, '1s points playing out of bounds' );
            assert.equal( points.CmpTweens.tweens[0][0].isPlaying, false, '1.4s points fade in' );
            assert.equal( points.CmpTweens.tweens[0][1].isPlaying, false, '1.4s points translate' );
            assert.equal( points.CmpTweens.tweens[0][1].isCompleted, true, '1.4s points translate completed' );
            assert.equal( points.CmpTweens.tweens[0][2].isPlaying, false, '1.4s points fade out' );
            assert.equal( points.CmpTweens.tweens[0][2].isCompleted, true, '1.4s points fade out completed' );

            assert.equal( plane.CmpTweens.twindx[0], 1, '1.4s plane [0] out of bounds' );
            assert.equal( plane.CmpTweens.tweens[0][0].isPlaying, false, '1.4s plane fading in' );
            assert.equal( plane.CmpTweens.tweens[0][0].isCompleted, true, '1.4s plane fading in completed' );

            // plane tweens[0][0] followBy.start = 0.0, this overrides tweens[1][0].start = Infinity
            assert.equal( plane.CmpTweens.twindx[1], Infinity, '1.4s plane [1] is playing (waiting triggered) [1]' );
            assert.equal( plane.CmpTweens.tweens[1][0].isPlaying, undefined, '1.4s plane [1] playing (not triggered yet) [1]' );

            // plane[1] followed [0], also start with cube fade in, but not triggered this turn.
            assert.equal( cube.CmpTweens.twindx[0], Infinity, '1.4s cube [0] idx = 0, fading in (A)' );
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, undefined, '1.4s cube fading in (A)' );
            // trigger plane[1]
            xworld.update();
            assert.equal( plane.CmpTweens.twindx[1], 0, '1.4s plane [1] is playing (updated) [2]' );
            assert.equal( plane.CmpTweens.tweens[1][0].isPlaying, true, '1.4s plane [1] playing (updated) [2]' );

            assert.equal( cube.CmpTweens.twindx[0], Infinity, '1.4s cube [0] idx = 0, fading in (B)' );
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, undefined, '1.4s cube fading in (B)' );

            // start cube[0]
            xworld.update();
            assert.equal( cube.CmpTweens.twindx[0], 0, '1.4s cube [0] idx = 0, fading in (C)' );
            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, true, '1.4s cube fading in (C)' );

        // plane is fading out, cube fading in
        await sleep(400);
        xworld.update();
            assert.equal( plane.CmpTweens.twindx[1], 1, '1.8s plane [1] playing out of bounds' );
            assert.equal( plane.CmpTweens.tweens[1][0].isPlaying, false, '1.8s plane fading out' );
            assert.equal( plane.CmpTweens.tweens[1][0].isCompleted, true, '1.8s plane fading out completed' );

            assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, false, '1.8s cube fading in' );
            assert.equal( cube.CmpTweens.tweens[0][0].isCompleted, true, '1.8s cube fading in completed' );
    });
});


/*
(function() {

    function getTests(TWEEN) {

        var tests = {
            'hello': function(test) {
                test.ok(TWEEN !== null);
                test.done();
            },

            // TWEEN tests
            'TWEEN.getAll': function(test) {
                test.ok(TWEEN.getAll() instanceof Array);
                test.done();
            },

            'TWEEN object stores tweens automatically on start': function(test) {

                var numTweensBefore = TWEEN.getAll().length,
                    t = new TWEEN.Tween({});

                t.start();

                var numTweensAfter = TWEEN.getAll().length;

                test.equal( numTweensBefore + 1, numTweensAfter );
                test.done();

            },

            'TWEEN.removeAll()': function(test) {

                var all = TWEEN.getAll(),
                    t = new TWEEN.Tween({});

                TWEEN.removeAll();

                test.equal( TWEEN.getAll().length, 0, "No tweens left" );

                t.start();

                test.equal( TWEEN.getAll().length, 1, "A tween has been added" );

                TWEEN.removeAll();

                test.equal( TWEEN.getAll().length, 0, "No tweens left" );
                test.done();

            },

            'TWEEN.add()': function(test) {

                var all = TWEEN.getAll(),
                    numTweens = all.length,
                    t = new TWEEN.Tween({});

                TWEEN.add( t );

                test.equal( numTweens + 1, TWEEN.getAll().length );

                test.done();

            },

            'TWEEN.remove()': function(test) {

                var all = TWEEN.getAll(),
                    numTweens = all.length,
                    t = new TWEEN.Tween({});

                TWEEN.add( t );

                test.ok( TWEEN.getAll().indexOf( t ) != -1 );

                TWEEN.remove( t );

                test.equal( numTweens, TWEEN.getAll().length );
                test.equal( TWEEN.getAll().indexOf( t ), -1 );
                test.done();

            },

            'TWEEN.update() returns false when done (no tweens to animate)': function(test) {

                TWEEN.removeAll();

                test.deepEqual( TWEEN.update(), false );
                test.done();

            },

            'TWEEN.update() returns true when there are active tweens': function(test) {

                TWEEN.removeAll();

                var t = new TWEEN.Tween( {} );
                t.start();

                test.deepEqual( TWEEN.update(), true );
                test.done();

            },

            'TWEEN.update() removes tweens when they are finished': function(test) {

                TWEEN.removeAll();

                var t1 = new TWEEN.Tween( {} ).to( {}, 1000 ),
                    t2 = new TWEEN.Tween( {} ).to( {}, 2000 );

                test.equal( TWEEN.getAll().length, 0 );

                t1.start( 0 );
                t2.start( 0 );

                test.equal( TWEEN.getAll().length, 2 );

                TWEEN.update( 0 );
                test.equal( TWEEN.getAll().length, 2 );

                TWEEN.update( 999 );
                test.equal( TWEEN.getAll().length, 2 );

                TWEEN.update( 1000 );
                test.equal( TWEEN.getAll().length, 1 );
                test.equal( TWEEN.getAll().indexOf( t1 ), -1 );
                test.ok( TWEEN.getAll().indexOf( t2 ) != -1 );
                test.done();

            },
            'TWEEN.update() does not remove tweens when they are finished with preserve flag': function(test) {

                TWEEN.removeAll();

                var t1 = new TWEEN.Tween( {} ).to( {}, 1000 ),
                    t2 = new TWEEN.Tween( {} ).to( {}, 2000 );

                test.equal( TWEEN.getAll().length, 0 );

                t1.start( 0 );
                t2.start( 0 );

                test.equal( TWEEN.getAll().length, 2 );

                TWEEN.update(0, true);
                test.equal( TWEEN.getAll().length, 2 );

                TWEEN.update(999, true);
                test.equal( TWEEN.getAll().length, 2 );

                TWEEN.update(1000, true);
                test.equal( TWEEN.getAll().length, 2 );

                TWEEN.update(1001, true);
                test.equal( TWEEN.getAll().length, 2 );
                test.ok( TWEEN.getAll().indexOf( t1 ) != -1 );
                test.ok( TWEEN.getAll().indexOf( t2 ) != -1 );
                test.done();
            },


            'Unremoved tweens which have been updated past their finish time may be reused': function(test) {

                TWEEN.removeAll();

                var target1 = {a:0};
                var target2 = {b:0};

                var t1 = new TWEEN.Tween( target1 ).to( {a:1}, 1000 ),
                    t2 = new TWEEN.Tween( target2 ).to( {b:1}, 2000 );

                t1.start( 0 );
                t2.start( 0 );

                TWEEN.update(200, true);
                TWEEN.update(2500, true);
                TWEEN.update(500, true);

                test.equal(TWEEN.getAll().length, 2);
                test.equal(target1.a, 0.5);
                test.equal(target2.b, 0.25);

                test.done();
            },


            // TWEEN.Tween tests

            'constructor': function(test) {

                var t = new TWEEN.Tween( {} );

                test.ok( t instanceof TWEEN.Tween, "Pass" );
                test.done();

            },

            'Return the same tween instance for method chaining': function(test) {

                var t = new TWEEN.Tween( {} );

                test.ok( t.to({}, 0) instanceof TWEEN.Tween );
                test.equal( t.to({}, 0), t );

                test.ok( t.start() instanceof TWEEN.Tween );
                test.equal( t.start(), t );

                test.ok( t.stop() instanceof TWEEN.Tween );
                test.equal( t.stop(), t );

                test.ok( t.delay() instanceof TWEEN.Tween );
                test.equal( t.delay(), t );

                test.ok( t.easing() instanceof TWEEN.Tween );
                test.equal( t.easing(), t );

                test.ok( t.interpolation() instanceof TWEEN.Tween );
                test.equal( t.interpolation(), t );

                test.ok( t.chain() instanceof TWEEN.Tween );
                test.equal( t.chain(), t );

                test.ok( t.onStart() instanceof TWEEN.Tween );
                test.equal( t.onStart(), t );

                test.ok( t.onStop() instanceof TWEEN.Tween );
                test.equal( t.onStop(), t );

                test.ok( t.onUpdate() instanceof TWEEN.Tween );
                test.equal( t.onUpdate(), t );

                test.ok( t.onComplete() instanceof TWEEN.Tween );
                test.equal( t.onComplete(), t );

                test.ok( t.duration() instanceof TWEEN.Tween );
                test.equal( t.duration(), t );

                test.ok( t.group() instanceof TWEEN.Tween );
                test.equal( t.group(), t );

                test.done();

            },

            'Tween existing property': function(test) {

                var obj = { x: 1 },
                    t = new TWEEN.Tween( obj );

                t.to( { x: 2 }, 1000 );
                t.start( 0 );
                t.update( 1000 );

                test.deepEqual( obj.x, 2 );
                test.done();

            },

            'Tween non-existing property': function(test) {

                var obj = { x: 1 },
                    t = new TWEEN.Tween( obj );

                t.to( { y: 0 }, 1000 );
                t.start( 0 );
                t.update( 1000 );

                test.deepEqual( obj.x, 1 );
                test.equal( obj.y, undefined );
                test.done();

            },

            'Tween non-null property': function(test) {

                var obj = { x: 1 },
                    t = new TWEEN.Tween( obj );

                t.to( { x: 2 }, 1000 );
                t.start( 0 );
                t.update( 1000 );

                test.deepEqual( obj.x, 2 );
                test.ok( obj.x !== null );
                test.done();

            },

            'Tween function property': function(test) {

                var my_function = function() {};

                var obj = { x: my_function },
                    t = new TWEEN.Tween( obj );

                t.to( { x: my_function } );
                t.start( 0 );
                t.update( 1000 );

                test.ok( obj.x === my_function );
                test.done();

            },

            'Tween boolean property': function(test) {

                var obj = { x: true },
                    t = new TWEEN.Tween( obj );

                t.to( { x: function() {} } );
                t.start( 0 );
                t.update( 1000 );

                test.ok( typeof obj.x === "boolean" );
                test.ok( obj.x );
                test.done();

            },

            'Tween null property': function(test) {

                var obj = { x: null },
                    t = new TWEEN.Tween( obj );

                t.to( { x: 2 }, 1000 );
                t.start( 0 );
                t.update( 1000 );

                test.deepEqual( obj.x, 2 );
                test.done();

            },

            'Tween undefined property': function(test) {

                var obj = { },
                    t = new TWEEN.Tween( obj );

                t.to( { x: 2 }, 1000 );
                t.start( 0 );
                t.update( 1000 );

                test.equal( obj.x, undefined );
                test.done();

            },

            'Tween relative positive value, with sign': function(test) {

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj );

                t.to( { x: "+100" }, 1000 );
                t.start( 0 );
                t.update( 1000 );

                test.equal( obj.x, 100 );
                test.done();

            },

            'Tween relative negative value': function(test) {

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj );

                t.to( { x: "-100" }, 1000 );
                t.start( 0 );
                t.update( 1000 );

                test.equal( obj.x, -100 );
                test.done();

            },

            'String values without a + or - sign should not be interpreted as relative': function(test) {

                var obj = { x: 100 },
                    t = new TWEEN.Tween( obj );

                t.to( { x: "100" }, 1000 );
                t.start( 0 );
                t.update( 1000 );

                test.equal( obj.x, 100 );
                test.done();

            },

            'Test TWEEN.Tween.start()': function(test) {

                var obj = { },
                    t = new TWEEN.Tween( obj );

                t.to( { }, 1000 );

                TWEEN.removeAll();
                test.equal( TWEEN.getAll().length, 0 ); // TODO move to TWEEN test

                t.start( 0 );

                test.equal( TWEEN.getAll().length, 1 ); // TODO ditto
                test.equal( TWEEN.getAll()[0], t );
                test.done();

            },

            'Test TWEEN.Tween.stop()': function(test) {

                var obj = { },
                    t = new TWEEN.Tween( obj );

                t.to( { x: 2 }, 1000 );

                TWEEN.removeAll();

                t.start();
                t.stop();

                test.equal( TWEEN.getAll().length, 0 );
                test.done();

            },

            'Test TWEEN.Tween.delay()': function(test) {

                var obj = { x: 1 },
                    t = new TWEEN.Tween( obj );

                t.to( { x: 2 }, 1000 );
                t.delay( 500 );
                t.start( 0 );

                t.update( 100 );

                test.deepEqual( obj.x, 1, "Tween hasn't started yet" );

                t.update( 1000 );

                test.ok( (obj.x !== 1) && (obj.x !== 2), "Tween has started but hasn't finished yet" );

                t.update( 1500 );

                test.equal( obj.x, 2, "Tween finishes when expected" );
                test.done();

            },

            // TODO: not really sure how to test this. Advice appreciated!
            'Test TWEEN.Tween.easing()': function(test) {

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj );

                t.to( { x: 1 }, 1000 );

                t.easing( TWEEN.Easing.Quadratic.In );
                t.start( 0 );
                t.update( 500 );
                test.equal( obj.x, TWEEN.Easing.Quadratic.In( 0.5 ) );
                test.done();

            },

            // TODO test interpolation()

            'Test TWEEN.Tween.chain --with one tween': function(test) {

                var t = new TWEEN.Tween( {} ),
                    tStarted = false,
                    tCompleted = false,
                    t2 = new TWEEN.Tween( {} ),
                    t2Started = false;

                TWEEN.removeAll();

                t.to( {}, 1000 );
                t2.to( {}, 1000 );

                t.chain( t2 );

                t.onStart(function() {
                    tStarted = true;
                });

                t.onComplete(function() {
                    tCompleted = true;
                });

                t2.onStart(function() {
                    test.equal( tStarted, true );
                    test.equal( tCompleted, true );
                    test.equal( t2Started, false );
                    t2Started = true;
                });

                test.equal( tStarted, false );
                test.equal( t2Started, false );

                t.start( 0 );
                TWEEN.update( 0 );

                test.equal( tStarted, true );
                test.equal( t2Started, false );

                TWEEN.update( 1000 );

                test.equal( tCompleted, true );

                TWEEN.update( 1001 );

                test.equal( t2Started, true, 't2 is automatically started by t' );
                test.done();

            },

            'Test TWEEN.Tween.chain --with several tweens in an array': function(test) {

                var t = new TWEEN.Tween( {} ),
                    chainedTweens = [],
                    numChained = 3,
                    numChainedStarted = 0;

                TWEEN.removeAll();

                t.to( {}, 1000 );

                function onChainedStart() {
                    numChainedStarted++;
                }

                for(var i = 0; i < numChained; i++ ){
                    var chained = new TWEEN.Tween( {} );
                        chained.to( {}, 1000 );

                    chainedTweens.push( chained );

                    chained.onStart(onChainedStart);
                }

                // NOTE: This is not the normal way to chain several tweens simultaneously
                // The usual way would be to specify them explicitly:
                // t.chain( tween1, tween2, ... tweenN)
                // ... not to use apply to send an array of tweens
                t.chain.apply( t, chainedTweens );

                test.equal( numChainedStarted, 0 );

                t.start( 0 );
                TWEEN.update( 0 );
                TWEEN.update( 1000 );
                TWEEN.update( 1001 );

                test.equal( numChainedStarted, numChained, 'All chained tweens have been started' );
                test.done();

            },

            'Test TWEEN.Tween.chain allows endless loops': function(test) {

                var obj = { x: 0 },
                    t1 = new TWEEN.Tween( obj ).to( { x: 100 }, 1000 ),
                    t2 = new TWEEN.Tween( obj ).to( { x: 0 }, 1000 );

                TWEEN.removeAll();

                t1.chain( t2 );
                t2.chain( t1 );

                test.equal( obj.x, 0 );

                // x == 0
                t1.start( 0 );
                TWEEN.update( 0 );

                test.equal( obj.x, 0 );

                TWEEN.update( 500 );
                test.equal( obj.x, 50 );

                // there... (x == 100)

                TWEEN.update( 1000 );
                test.equal( obj.x, 100 );

                TWEEN.update( 1500 );
                test.equal( obj.x, 50 );

                // ... and back again (x == 0)

                TWEEN.update( 2000 );
                test.equal( obj.x, 0);

                TWEEN.update( 2500 );
                test.equal( obj.x, 50 );

                TWEEN.update( 3000 );
                test.equal( obj.x, 100 ); // and x == 100 again

                // Repeat the same test but with the tweens added in the
                // opposite order.
                var obj2 = {x:0};
                var t3 = new TWEEN.Tween(obj2).to({x: 200}, 1000);
                var t4 = new TWEEN.Tween(obj2).to({x: 100}, 1000);

                t4.chain(t3);
                t3.chain(t4);

                test.equal(obj2.x, 0);

                t4.start(0);

                TWEEN.update(0);
                test.equal(obj2.x, 0);

                TWEEN.update(500);
                test.equal(obj2.x, 50);

                TWEEN.update(1000);
                test.equal(obj2.x, 100);

                TWEEN.update(1500);
                test.equal(obj2.x, 150);

                TWEEN.update(2000);
                test.equal(obj2.x, 0);

                TWEEN.update(2500);
                test.equal(obj2.x, 50);

                TWEEN.update(3000);
                test.equal(obj2.x, 100);

                TWEEN.update(3500);
                test.equal(obj2.x, 150);

                TWEEN.update(4000);
                test.equal(obj2.x, 0);

                TWEEN.update(4500);
                test.equal(obj2.x, 50);

                test.done();

            },

            'Test TWEEN.Tween.onStart': function(test) {

                var obj = { },
                    t = new TWEEN.Tween( obj ),
                    counter = 0;

                t.to( { x: 2 }, 1000 );
                t.onStart( function() {
                    test.ok( true, "onStart callback is called" );
                    counter++;
                });

                test.deepEqual( counter, 0 );

                t.start( 0 );
                TWEEN.update( 0 );

                test.deepEqual( counter, 1 );

                TWEEN.update( 500 );

                test.deepEqual( counter, 1, "onStart callback is not called again" );
                test.done();

            },

            'Test TWEEN.Tween.onStop': function(test) {

                var obj = { },
                    t = new TWEEN.Tween( obj ),
                    counter = 0;

                t.to( { x: 2 }, 1000 );
                t.onStop( function() {
                    test.ok( true, "onStop callback is called" );
                    counter++;
                });

                test.deepEqual( counter, 0 );

                t.stop();
                TWEEN.update(0);

                test.deepEqual( counter, 0, "onStop callback not called when the tween hasn't started yet");

                t.start( 0 );
                TWEEN.update( 0 );
                t.stop();

                test.deepEqual( counter, 1, "onStop callback is called if the tween has been started already and stop is invoked");

                TWEEN.update( 500 );
                t.stop();

                test.deepEqual( counter, 1, "onStop callback is not called again once the tween is stopped" );
                test.done();

            },

            'Test TWEEN.Tween.onUpdate': function(test) {

                var obj = { },
                    t = new TWEEN.Tween( obj ),
                    counter = 0;

                t.to( { x: 2 }, 1000 );
                t.onUpdate( function() {
                    counter++;
                });

                test.deepEqual( counter, 0 );

                t.start( 0 );

                TWEEN.update( 0 );
                test.deepEqual( counter, 1 );

                TWEEN.update( 500 );
                test.deepEqual( counter, 2 );

                TWEEN.update( 600 );
                test.deepEqual( counter, 3 );

                TWEEN.update( 1000 );
                test.deepEqual( counter, 4 );

                TWEEN.update( 1500 );
                test.deepEqual( counter, 4, 'onUpdate callback should not be called after the tween has finished' );

                test.done();

            },

            'Test TWEEN.Tween.onComplete': function(test) {

                var obj = { },
                    t = new TWEEN.Tween( obj ),
                    counter = 0;

                t.to( { x: 2 }, 1000 );
                t.onComplete( function() {
                    counter++;
                });

                test.deepEqual( counter, 0 );

                t.start( 0 );

                TWEEN.update( 0 );
                test.deepEqual( counter, 0 );

                TWEEN.update( 500 );
                test.deepEqual( counter, 0 );

                TWEEN.update( 600 );
                test.deepEqual( counter, 0 );

                TWEEN.update( 1000 );
                test.deepEqual( counter, 1 );

                TWEEN.update( 1500 );
                test.deepEqual( counter, 1, 'onComplete callback must be called only once' );
                test.done();

            },

            'TWEEN.Tween does not repeat by default': function(test) {

                TWEEN.removeAll();

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 );

                t.start( 0 );

                TWEEN.update( 0 );
                test.equal( obj.x, 0 );

                TWEEN.update( 50 );
                test.equal( obj.x, 50 );

                TWEEN.update( 100 );
                test.equal( obj.x, 100 );

                TWEEN.update( 150 );
                test.equal( obj.x, 100 );
                test.done();

            },

            'Test single repeat happens only once': function(test) {

                TWEEN.removeAll();

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 ).repeat( 1 );

                t.start( 0 );

                TWEEN.update( 0 );
                test.equal( obj.x, 0 );

                TWEEN.update( 50 );
                test.equal( obj.x, 50 );

                TWEEN.update( 100 );
                test.equal( obj.x, 100 );

                TWEEN.update( 150 );
                test.equal( obj.x, 50 );

                TWEEN.update( 200 );
                test.equal( obj.x, 100 );
                test.done();

            },

            'Test Infinity repeat happens forever': function(test) {

                TWEEN.removeAll();

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 ).repeat( Infinity );

                t.start( 0 );

                TWEEN.update( 0 );
                test.equal( obj.x, 0 );

                TWEEN.update( 50 );
                test.equal( obj.x, 50 );

                TWEEN.update( 100 );
                test.equal( obj.x, 100 );

                TWEEN.update( 150 );
                test.equal( obj.x, 50 );

                TWEEN.update( 200 );
                test.equal( obj.x, 100 );

                TWEEN.update( 250 );
                test.equal( obj.x, 50 );
                test.done();

            },

            'Test tweening relatively with repeat': function(test) {

                TWEEN.removeAll();

                var obj = { x: 0, y: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: "+100", y: "-100" }, 100 ).repeat( 1 );

                t.start( 0 );

                TWEEN.update( 0 );
                test.equal( obj.x, 0 );
                test.equal( obj.y, 0 );

                TWEEN.update( 50 );
                test.equal( obj.x, 50 );
                test.equal( obj.y, -50 );

                TWEEN.update( 100 );
                test.equal( obj.x, 100 );
                test.equal( obj.y, -100 );

                TWEEN.update( 150 );
                test.equal( obj.x, 150 );
                test.equal( obj.y, -150 );

                TWEEN.update( 200 );
                test.equal( obj.x, 200 );
                test.equal( obj.y, -200 );
                test.done();

            },

            'Test yoyo with repeat Infinity happens forever': function(test) {

                TWEEN.removeAll();

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 ).repeat( Infinity ).yoyo(true);

                t.start( 0 );

                TWEEN.update( 0 );
                test.equal( obj.x, 0 );

                TWEEN.update( 25 );
                test.equal( obj.x, 25 );

                TWEEN.update( 100 );
                test.equal( obj.x, 100 );

                TWEEN.update( 125 );
                test.equal( obj.x, 75 );

                TWEEN.update( 200 );
                test.equal( obj.x, 0 );

                TWEEN.update( 225 );
                test.equal( obj.x, 25 );
                test.done();

            },

            'Test yoyo with repeat 1 happens once': function(test) {

                TWEEN.removeAll();

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 ).repeat( 1 ).yoyo(true);

                t.start( 0 );

                TWEEN.update( 0 );
                test.equal( obj.x, 0 );

                TWEEN.update( 25 );
                test.equal( obj.x, 25 );

                TWEEN.update( 100 );
                test.equal( obj.x, 100 );

                TWEEN.update( 125 );
                test.equal( obj.x, 75 );

                TWEEN.update( 200 );
                test.equal( obj.x, 0 );

                TWEEN.update( 225 );
                test.equal( obj.x, 0 );
                test.done();
            },

            'Test TWEEN.Tween.chain progressess into chained tweens': function(test) {

                var obj = { t: 1000 };

                // 1000 of nothing
                var blank = new TWEEN.Tween({}).to({}, 1000);

                // tween obj.t from 1000 -> 2000 (in time with update time)
                var next  = new TWEEN.Tween(obj).to({ t: 2000 }, 1000);

                blank.chain(next).start(0);

                TWEEN.update(1500);
                test.equal(obj.t, 1500);

                TWEEN.update(2000);
                test.equal(obj.t, 2000);

                test.done();

            },

            'Test that TWEEN.Tween.end sets the final values.': function(test) {

                var object1 = {x: 0, y: -50, z: 1000};
                var target1 = {x: 50, y: 123, z: '+234'};

                var tween1 = new TWEEN.Tween(object1).to(target1, 1000);

                tween1.start();
                tween1.end();

                test.equal(object1.x, 50);
                test.equal(object1.y, 123);
                test.equal(object1.z, 1234);

                var object2 = {x: 0, y: -50, z: 1000};
                var target2 = {x: 50, y: 123, z: '+234'};

                var tween2 = new TWEEN.Tween(object2).to(target2, 1000);

                tween2.start(300);
                tween2.update(500);
                tween2.end();

                test.equal(object2.x, 50);
                test.equal(object2.y, 123);
                test.equal(object2.z, 1234);

                test.done();
            },

            'Test that TWEEN.Tween.end calls the onComplete callback of the tween.': function(test) {

                test.expect(1);

                var tween1 = new TWEEN.Tween({}).to({}, 1000).onComplete(function () {
                    test.ok(true);
                });

                tween1.start();
                tween1.end();

                test.done();

            },

            'Test delay adds delay before each repeat': function(test) {

                // If repeatDelay isn't specified then delay is used since
                // that's the way it worked before repeatDelay was added.

                TWEEN.removeAll();

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 ).repeat( 1 ).delay(100);

                t.start( 0 );

                TWEEN.update( 100 );
                test.equal( obj.x, 0 );

                TWEEN.update( 150 );
                test.equal( obj.x, 50 );

                TWEEN.update( 200 );
                test.equal( obj.x, 100 );

                TWEEN.update( 250 );
                test.equal( obj.x, 100 );

                TWEEN.update( 300 );
                test.equal( obj.x, 0 );

                TWEEN.update( 350 );
                test.equal( obj.x, 50 );

                TWEEN.update( 400 );
                test.equal( obj.x, 100 );

                test.done();

            },

            'Test repeatDelay adds delay before each repeat': function(test) {

                TWEEN.removeAll();

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 ).repeat( 1 ).repeatDelay(200);

                t.start( 0 );

                TWEEN.update( 0 );
                test.equal( obj.x, 0 );

                TWEEN.update( 50 );
                test.equal( obj.x, 50 );

                TWEEN.update( 100 );
                test.equal( obj.x, 100 );

                TWEEN.update( 200 );
                test.equal( obj.x, 100 );

                TWEEN.update( 300 );
                test.equal( obj.x, 0 );

                TWEEN.update( 350 );
                test.equal( obj.x, 50 );

                TWEEN.update( 400 );
                test.equal( obj.x, 100 );

                test.done();

            },

            'Test repeatDelay and delay can be used together': function(test) {

                TWEEN.removeAll();

                var obj = { x: 0 },
                    t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 ).delay(100).repeat( 1 ).repeatDelay(200);

                t.start( 0 );

                TWEEN.update( 100 );
                test.equal( obj.x, 0 );

                TWEEN.update( 150 );
                test.equal( obj.x, 50 );

                TWEEN.update( 200 );
                test.equal( obj.x, 100 );

                TWEEN.update( 300 );
                test.equal( obj.x, 100 );

                TWEEN.update( 400 );
                test.equal( obj.x, 0 );

                TWEEN.update( 450 );
                test.equal( obj.x, 50 );

                TWEEN.update( 500 );
                test.equal( obj.x, 100 );

                test.done();

            },

            'Tween.js compatible with Object.defineProperty getter / setters': function(test) {

                var obj = { _x: 0 };

                Object.defineProperty( obj, 'x', {
                    get: function() {
                        return this._x;
                    },
                    set: function( x ) {
                        this._x = x;
                    }
                });

                test.equal( obj.x, 0 );

                var t = new TWEEN.Tween( obj ).to( { x: 100 }, 100 );

                t.start( 0 );

                test.equal( obj.x, 0 );

                TWEEN.update( 37 );
                test.equal( obj.x, 37 );

                TWEEN.update( 100 );
                test.equal( obj.x, 100 );

                TWEEN.update( 115 );
                test.equal( obj.x, 100 );

                test.done();

            },

            'tween.isPlaying() is false before the tween starts': function(test) {
                TWEEN.removeAll();

                var t = new TWEEN.Tween({x:0}).to({x:1}, 100);

                test.equal(t.isPlaying(), false);

                test.done();
            },

            'tween.isPlaying() is true when a tween is started and before it ends': function(test) {
                TWEEN.removeAll();

                var t = new TWEEN.Tween({x:0}).to({x:1}, 100);
                t.start(0);
                test.equal(t.isPlaying(), true);

                test.done();
            },

            'tween.isPlaying() is false after a tween ends': function(test) {
                TWEEN.removeAll();

                var t = new TWEEN.Tween({x:0}).to({x:1}, 100);
                t.start(0);
                TWEEN.update(150);
                test.equal(t.isPlaying(), false);

                test.done();
            },

            'A zero-duration tween finishes at its starting time without an error.': function(test) {
                TWEEN.removeAll();

                let object = {x: 0};
                var t = new TWEEN.Tween(object).to({x:1}, 0);
                t.start(0);
                TWEEN.update(0);

                test.equal(t.isPlaying(), false);
                test.equal(object.x, 1);

                test.done();
            },

            // Custom TWEEN.Group tests

            'Custom group.getAll()': function(test) {
                var group = new TWEEN.Group();
                test.ok( group.getAll() instanceof Array );
                test.done();
            },

            'Custom group stores tweens instead of global TWEEN group': function(test) {

                var group = new TWEEN.Group();

                var numGlobalTweensBefore = TWEEN.getAll().length;
                var numGroupTweensBefore = group.getAll().length;

                var globalTween = new TWEEN.Tween( {} );
                var groupTweenA = new TWEEN.Tween( {}, group );
                var groupTweenB = new TWEEN.Tween( {}, group );

                globalTween.start();
                groupTweenA.start();
                groupTweenB.start();

                test.equal( TWEEN.getAll().length, numGlobalTweensBefore + 1 );
                test.equal( group.getAll().length, numGroupTweensBefore + 2 );
                test.done();

            },

            'Custom group.removeAll() doesn\'t conflict with global TWEEN group': function(test) {

                var group = new TWEEN.Group();

                TWEEN.removeAll();
                group.removeAll();

                test.equal( TWEEN.getAll().length, 0, "No global tweens left" );
                test.equal( group.getAll().length, 0, "No group tweens left" );

                var globalTween = new TWEEN.Tween( {} );
                var groupTweenA = new TWEEN.Tween( {}, group );
                var groupTweenB = new TWEEN.Tween( {}, group );

                globalTween.start();
                groupTweenA.start();
                groupTweenB.start();

                test.equal( TWEEN.getAll().length, 1, "One global tween has been added" );
                test.equal( group.getAll().length, 2, "Two group tweens have been added" );

                group.removeAll();

                test.equal( TWEEN.getAll().length, 1, "One global tween left" );
                test.equal( group.getAll().length, 0, "No group tweens left" );

                TWEEN.removeAll();

                test.equal( TWEEN.getAll().length, 0, "No global tweens left" );

                test.done();

            },

            'Global TWEEN.removeAll() doesn\'t conflict with custom group': function(test) {

                var group = new TWEEN.Group();

                TWEEN.removeAll();
                group.removeAll();

                test.equal( TWEEN.getAll().length, 0, "No global tweens left" );
                test.equal( group.getAll().length, 0, "No group tweens left" );

                var globalTween = new TWEEN.Tween( {} );
                var groupTweenA = new TWEEN.Tween( {}, group );
                var groupTweenB = new TWEEN.Tween( {}, group );

                globalTween.start();
                groupTweenA.start();
                groupTweenB.start();

                test.equal( TWEEN.getAll().length, 1, "One global tween has been added" );
                test.equal( group.getAll().length, 2, "Two group tweens have been added" );

                TWEEN.removeAll();

                test.equal( TWEEN.getAll().length, 0, "No global tweens left" );
                test.equal( group.getAll().length, 2, "Two group tweens left" );

                group.removeAll();

                test.equal( group.getAll().length, 0, "No group tweens left" );

                test.done();

            },

            'Custom group.add() doesn\'t conflict with global TWEEN group, or vice versa': function(test) {

                var group = new TWEEN.Group();

                var globalTween = new TWEEN.Tween( {} );
                var groupTweenA = new TWEEN.Tween( {}, group );
                var groupTweenB = new TWEEN.Tween( {}, group );

                var numGlobalTweens = TWEEN.getAll().length;
                var numGroupTweens = group.getAll().length;

                TWEEN.add( globalTween );
                group.add( groupTweenA );
                group.add( groupTweenB );

                test.equal( numGlobalTweens + 1, TWEEN.getAll().length );
                test.equal( numGroupTweens + 2, group.getAll().length );

                test.done();

            },

            'Custom group.update() doesn\'t conflict with global TWEEN group': function(test) {

                var group = new TWEEN.Group();

                var startObj = { x: 1 };
                var endObj = { x: 2 };
                var duration = 1000;

                var globalObj = { x: 1 };
                var globalTween = new TWEEN.Tween( globalObj )
                    .to( endObj, duration )
                    .start( 0 );

                var groupObj = { x: 1 };
                var groupTween = new TWEEN.Tween( groupObj, group )
                    .to( endObj, duration )
                    .start( 0 );

                group.update( duration );

                test.deepEqual( globalObj, startObj );
                test.deepEqual( groupObj, endObj );
                test.done();

            },

            'Global TWEEN.update() doesn\'t conflict with custom group': function(test) {

                var group = new TWEEN.Group();

                var startObj = { x: 1 };
                var endObj = { x: 2 };
                var duration = 1000;

                var globalObj = { x: 1 };
                var globalTween = new TWEEN.Tween( globalObj )
                    .to( endObj, duration )
                    .start( 0 );

                var groupObj = { x: 1 };
                var groupTween = new TWEEN.Tween( groupObj, group )
                    .to( endObj, duration )
                    .start( 0 );

                TWEEN.update( duration );

                test.deepEqual( globalObj, endObj );
                test.deepEqual( groupObj, startObj );
                test.done();

            },

            'Stopping a tween within an update callback will not cause an error.': function(test) {
                TWEEN.removeAll();

                var tweenA = new TWEEN.Tween({x: 1, y: 2})
                    .to({x: 3, y: 4}, 1000)
                    .onUpdate(function(values) {
                        tweenB.stop();
                    })
                    .start(0);
                var tweenB = new TWEEN.Tween({x: 5, y: 6})
                    .to({x: 7, y: 8})
                    .onUpdate(function(values) {
                        tweenA.stop();
                    })
                    .start(0);

                let success = true;

                try {
                    TWEEN.update(500);
                }
                catch (exception) {
                    success = false;
                }
                finally {
                    test.ok(success);
                    test.done();
                }
            },


            'Set the duration with .duration': function(test) {

                var obj = { x: 1 };
                var t = new TWEEN.Tween( obj )
                    .to({x: 2})
                    .duration(1000)
                    .start(0);

                t.update( 1000 );

                test.deepEqual( obj.x, 2 );
                test.done();

            },

            'Tween.group sets the tween\'s group.': function(test) {

                var group = new TWEEN.Group();

                var groupTweenA = new TWEEN.Tween( {} )
                    .group( group );

                groupTweenA.start();

                test.equal( group.getAll().length, 1 );
                test.done();

            },

            'Test TWEEN.Tween.pause() and TWEEN.Tween.resume()': function(test) {

                var obj = {x: 0.0},
                    t = new TWEEN.Tween( obj );

                t.to( {x: 1.0}, 1000 );

                TWEEN.removeAll();

                test.equal( TWEEN.getAll().length, 0 );

                t.start( 0 );

                test.equal( TWEEN.getAll().length, 1 );
                test.equal( t.isPaused(), false );

                TWEEN.update(400);

                test.equal(obj.x, 0.4);

                t.pause(450);

                test.equal( t.isPaused(), true );
                test.equal( TWEEN.getAll().length, 0 );
                test.equal(obj.x, 0.4);

                TWEEN.update(900);

                test.equal(obj.x, 0.4);

                TWEEN.update(3000);

                test.equal(obj.x, 0.4);

                t.resume(3200);

                // values do not change until an update
                test.equal(obj.x, 0.4);

                test.equal( TWEEN.getAll().length, 1 );
                test.equal( t.isPaused(), false );

                TWEEN.update(3500);

                test.equal(obj.x, 0.75);

                TWEEN.update(5000);

                test.equal(obj.x, 1.0);

                test.done();

            },

            'Arrays in the object passed to to() are not modified by start().':
            function(test) {

                var start = {x: 10, y: 20};
                var end = {x: 100, y: 200, values: ['a', 'b']};
                var valuesArray = end.values;
                new TWEEN.Tween(start).to(end).start();
                test.equal(valuesArray, end.values);
                test.equal(end.values.length, 2);
                test.equal(end.values[0], 'a');
                test.equal(end.values[1], 'b');
                test.done();

            },


        };

        return tests;

    }

    if(typeof module !== 'undefined' && module.exports) {
        module.exports = getTests;
    } else {
        this.getTests = getTests;
    }

}).call(this);
*/

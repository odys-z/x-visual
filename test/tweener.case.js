
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

import {Visual, Canvas, AssetType} from '../lib/component/visual'
import {Obj3, Obj3Type} from '../lib/component/obj3'
import {AnimType, ModelSeqs} from '../lib/component/morph';
import {CmpTween, CmpTweens} from '../lib/component/tween';
import XTweener from '../lib/sys/tween/xtweener'
import {XEasing} from '../lib/sys/tween/xtweener'
import {MorphingAnim} from '../lib/sys/tween/animizer'

global.performance = performance;

describe('case: [tween] tweener basics', function() {
	this.timeout(6000);
	x.log = 4;

	before(() => {
	});

	it('initiating tween', function() {
		const xworld = new XWorld(undefined, 'window', {tween: false});
		const ecs = xworld.xecs;

		// Morphinganim uses Obj3.mesh, can only created saparatly without scripts.
		const modelizer = new MorphingAnim(ecs, {});
		// xworld.addSystem('tween', modelizer);
		const xtweener = new XTweener(ecs, x);
		// xworld.addSystem('tween', xtweener);

	    assert.ok(xtweener);
	    assert.ok(modelizer);
	});

	/**This test doesn't tested uniforms updating, only test tween.prop.value been
	 * tweened */
	it('tweening uniforms', async function() {
		const xworld = new XWorld(undefined, 'window', {tween: false});
		const ecs = xworld.xecs;

		var cube = ecs.createEntity({
			id: 'cube0',
			Obj3: { geom: Obj3Type.BOX,
					box: [200, 120, 80],	// bounding box
					mesh: undefined },
			Visual:{vtype: AssetType.point,
					// Three use document to load assets, which doesn't exist whil testing
					// null acts as a flag to let thrender create a ram texture.
					asset: null },

			// TODO docs: in version 1.0, only type of sequence animation is supported
			ModelSeqs: {
				script: [[{ mtype: AnimType.UNIFORMS,
							paras: {start: 0,		// auto start, only alpha tween in v0.2
									duration: 0.6,	// seconds
									uniforms: { u_alpha: [0, 1],
												u_dist: [-100, 200]},
			 						ease: undefined}// default linear
						}]] },
			CmpTweens: {
				twindx: [],	// e.g. twindex[0] is 0, script[0] current is 0, created by animizer
				tweens: []}	// initialized by animizer, handled by XTweener. [] is safely ignored
		});

		xworld.startUpdate();
		assert.equal( cube.CmpTweens.twindx.length, 1, 'twindx != 1');
		assert.equal( cube.CmpTweens.tweens.length, 1, 'tweens != 1');
		assert.equal( cube.CmpTweens.tweens[0].length, 1, 'tweens length 1');
		assert.equal( typeof cube.CmpTweens.tweens[0][0].object.u_alpha.value, 'number', 'u_alpha doesn\'t been animized' );
		assert.closeTo( cube.CmpTweens.tweens[0][0].object.u_alpha.value, 0, 0.1, 'u_alpha 0');
		assert.closeTo( cube.CmpTweens.tweens[0][0].object.u_dist.value, -100, 10, 'u_dist -100'); // -92.7 ~ -99.1

		await sleep(1000);
		xworld.update();
		assert.closeTo( cube.CmpTweens.tweens[0][0].object.u_alpha.value, 1, 0.01, '1s 0, 0 u_alpha');
		assert.closeTo( cube.CmpTweens.tweens[0][0].object.u_dist.value, 200, 1.0, '1s 0, 0 u_dist');

		cube.CmpTweens.startCmds.push(0);
		assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, false, 'before start by cmd');
		debugger
		xworld.update();
		assert.equal( cube.CmpTweens.twindx[0], 0, 'start 0 by cmd');
		assert.equal( cube.CmpTweens.tweens[0][0].isPlaying, true, 'u_alpha 0 - after start by cmd');
		assert.closeTo( cube.CmpTweens.tweens[0][0].object.u_alpha.value, 0, 0.1, 'after start by cmd u_alpha');
		assert.closeTo( cube.CmpTweens.tweens[0][0].object.u_dist.value, -100, 10, 'after start by cmd u_dist -100'); // -92.7 ~ -99.1
	});

    it('start multple by cmds', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var completeflags = {};

        var tetra = ecs.createEntity({
            id: 'cube0',
            Obj3: { geom: Obj3Type.TETRAHEDRON,
                    box: [200, 120, 80],  // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: null },        // let thrender create a ram texture.
            ModelSeqs: {
                script: [[{ mtype: AnimType.OBJ3ROTX,
                            paras: {start: Infinity,    // wait for cmd
                                    duration: 0.4,      // seconds
                                    cmd: '',
                                    deg: [0, 45],       // from, to
                                    ease: undefined}}], // default linear
                         [{ mtype: AnimType.OBJ3ROTAXIS,
                            paras: {start: Infinity,    // wait for cmd
                                    duration: 0.4,      // seconds
                                    axis: [0, 1, 0],
                                    deg: [0, 90],       // from, to
                                    ease: XEasing.Elastic.InOut },
                            followBy: [{entity: 'cube0',
                                        seqx: 0,
                                        start: 0.4}] } ]]
                },
            CmpTweens: {}
        });

        debugger
        xworld.startUpdate();
        await sleep(200);
            xworld.update();
            assert.equal( tetra.CmpTweens.twindx[0], Infinity, 'twindx 0' );
            assert.equal( tetra.CmpTweens.twindx[1], Infinity, 'twindx 1' );
            assert.equal( tetra.CmpTweens.tweens[0][0].isPlaying, undefined, '0.2s tweens[0][0].isPlaying');
            assert.equal( tetra.CmpTweens.tweens[1][0].isPlaying, undefined, '0.2s tweens[1][0].isPlaying');

		tetra.CmpTweens.startCmds.push(1);
            assert.equal( tetra.CmpTweens.tweens[0][0].isPlaying, undefined, 'started yet not updated: tweens[0][0].isPlaying');
            assert.equal( tetra.CmpTweens.tweens[1][0].isPlaying, undefined, 'started yet not updated: tweens[1][0].isPlaying');
            xworld.update();
            assert.equal( tetra.CmpTweens.tweens[0][0].isPlaying, undefined, 'cmd started tweens[0][0].isPlaying');
            assert.equal( tetra.CmpTweens.tweens[1][0].isPlaying, true, 'cmd Started tweens[1][0].isPlaying');
    });
});


import chai from 'chai'
import { expect, assert } from 'chai'

import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as THREE from '../packages/three/three.module-MRTSupport';

import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld'
import {x} from '../lib/xapp/xworld'
import {sleep} from '../lib/xutils/xcommon'

import {Visual, AssetType} from '../lib/component/visual'
import {Obj3Type} from '../lib/component/obj3'
import {AnimType, ModelSeqs} from '../lib/component/morph';
import {vec3, mat4} from '../lib/xmath/vec';
import xmath from '../lib/xmath/math';
import {Affine} from '../lib/xmath/affine';

global.performance = performance;

describe('case: [affine] orbit combine', function() {
    this.timeout(100000);
    x.log = 4;
	x.test = true;

    it('affine combination: orbit {pivot: [120, 0, 0], axis: [0, 1, 0]}', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var cube = ecs.createEntity({
            id: 'orbit',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: null },
            ModelSeqs: { script: [[
                  { mtype: AnimType.ORBIT,
                    paras: {start: Infinity,
                            duration: 0.4,
                            axis: [0, 1, 0],
                            pivot: [120, 0, 0],
                            deg: [0, 180],
                            ease: null} }
                ]]},
            CmpTweens: {}
        });

        xworld.startUpdate();
            cube.CmpTweens.startCmds.push(0);
            xworld.update(); // rotate = 0
            assert.isOk(cube.Obj3.m0, "m0 ok");
            assert.isTrue(cube.Obj3.m0.eq(new mat4()), "m0, 0");
            assert.isTrue(cube.Obj3.mi.eq(new mat4()), "mi, 0");

            // await sleep(500);
            // xworld.update(); // rotate = PI
            for (var l = 0; l < 5; l++) {
                xworld.update();
                await sleep(10);
            }
            assert.closeTo(cube.CmpTweens.tweens[0][0].affines[1].rotate.rad, Math.PI * 0.1, 0.1, "PI ++");
            assert.isTrue(cube.Obj3.m0.eq(new mat4()), "m0, 50");
            assert.isFalse(cube.Obj3.mi.eq(new mat4()), "mi, 50");
            // assert.isTrue(cube.Obj3.CmpTweens[0][0].isPlaying, "50 tweening combination");
            var mat = new mat4(cube.Obj3.mi);

            // debugger
            // xworld.update();// reset combined.m0 === undefined
            // assert.equal(cube.Obj3.m0, undefined, "m0, 500(2)");
            // assert.isTrue(cube.Obj3.mi.eq(new mat4()), "mi aready cleared - not useful trait, 500(2)");
            // assert.isFalse(new mat4(cube.Obj3.mesh.matrix).eq(new mat4()), "js matrix must been kept");
            for (var l = 0; l < 75; l++) {
                xworld.update();
                await sleep(10);
            }

            var mt4 = new mat4().translate(-120, 0, 0)
                        .rotate(xmath.radian(180), 0, 1, 0)
                        .translate(120, 0, 0);
            if (!mt4.eq(mat)) {
                // TODO test needing re-implemented
                console.log('combine:', mt4.log());
                console.log('mesh: (column major)', mat);
                // assert.fail('orbit v.s transform combined');
            }

        // must orbit from where it's stopped, so now should back to the origin
        cube.CmpTweens.startCmds.push(0);
            debugger
            xworld.update();
            // TODO test needing re-implemented
            // assert.isFalse(new mat4(cube.Obj3.mesh.matrix).eq(new mat4()), "2nd round: js matrix must been kept");

            // await sleep(500);
            // xworld.update();// reset combined.m0 === undefined, mi = I
            for (var l = 0; l < 50; l++) {
                xworld.update();
                await sleep(10);
            }
            assert.isTrue(cube.Obj3.mi.eq(new mat4()), "2nd round: mi = I, 500(3)");

            mat = cube.Obj3.mesh.matrix;
            mt4 = new mat4();
            if (!mt4.eq(mat)){
                console.log('combine:', mt4.log());
                console.log('mesh: (column major)', mat);
                assert.fail('orbited back to start v.s transform combined');
            }
    });
});

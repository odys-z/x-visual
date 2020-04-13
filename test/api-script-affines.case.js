
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
import {Obj3Type} from '../lib/component/obj3'
import {AnimType, ModelSeqs} from '../lib/component/morph';
import {vec3, mat4} from '../lib/xmath/vec';
import xmath from '../lib/xmath/math';
import {Affine} from '../lib/xmath/affine';

global.performance = performance;

describe('case: [affine] orbit combine', function() {
    this.timeout(100000);
    x.log = 4;

    it('affine combination: orbit + roate x', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var cube = ecs.createEntity({
            id: 'orbit-rotatex',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: null },
            ModelSeqs: { script: [
                 [{ mtype: AnimType.ORBIT,
                    paras: {start: Infinity,
                            duration: 0.2,
                            axis: [0, 1, 0],
                            pivot: [120, 0, 0],
                            deg: [0, 180],
                            ease: null} }],
                 [{ mtype: AnimType.ROTATEX,
                    paras: {start: Infinity,
                            duration: 0.4,
                            deg: [0, 60],
                            ease: null} } ],
                ] },
            CmpTweens: {}
        });

        debugger
        xworld.startUpdate();
            cube.CmpTweens.startCmds.push(0);
            cube.CmpTweens.startCmds.push(1);
            /*
            xworld.update();
            // debug notes: in above update, tween value = 0
            await sleep(300);
            xworld.update();
            // debug notes: in above update, tween value = 1, but all tween indices are out of boundary
            // so no affine transform can be updated back to mesh in affine combiner.
            // guess: the next below update won't working as mi never been set to value 1.
            // unless the XTweener's driving pattern changed, with specified flag, this test can not be usable.
            await sleep(200);
            xworld.update();
            */
            for (var loop = 0; loop < 400 / 10; loop++) {
                xworld.update();
                await sleep(10);   // 100 frame / seconds, a frame = 10ms
            }
            var mjs = cube.Obj3.mesh.matrix;
            var mt4 = new mat4()
                        .translate(-120, 0, 0)
                        .rotate(xmath.radian(180), 0, 1, 0)
                        .translate(120, 0, 0)
                        // .rotate(xmath.radian(60), 1, 0, 0);
            // as rotation happens simutanously, some parts are not the same values
            /* For 11000/10 loops of 10.2s duration, mjs =
            0: -0.9997580051422119, 1: 0, 2: -0.02199736051261425, 3: 0
            4: 0, 5: 1, 6: 0, 7: 0
            8: 0.02199736051261425, 9: 0, 10: -0.9997580051422119, 11: 0
            12: 239.97096252441406, 13: 0, 14: 2.639683246612549, 15: 1
            */
            // if (!mt4.eq(mjs)) {
            //     console.log('combine:', mt4.log());
            //     console.log('mesh: (column major)', mjs);
            //     assert.fail('orbit + rotatex v.s transform combined');
            // }

            assert.closeTo(mjs.elements[12], 240, 2, 'orbit + rotatex v.s transform combined, translate 240.');
    });
});

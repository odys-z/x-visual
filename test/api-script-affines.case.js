
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
import {Obj3Type} from '../lib/component/obj3'
import {AnimType, ModelSeqs} from '../lib/component/morph';
import {vec3, mat4, radian, Affine} from '../lib/xutils/vec';
// import {CmpTween, CmpTweens} from '../lib/component/tween';
// import XTweener from '../lib/sys/tween/xtweener'
// import {XEasing} from '../lib/sys/tween/xtweener'
// import {MorphingAnim} from '../lib/sys/tween/animizer'

global.performance = performance;

describe('case: [affine] orbit combine', function() {
    this.timeout(100000);
    x.log = 4;

    it('affine array: trans, rotate, -trans', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var cube = ecs.createEntity({
            id: 'affine-arr',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],     // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: null },
            ModelSeqs: { script: [[
                  { mtype: AnimType.ORBIT,
                    paras: {start: 0,        // auto start,
                            duration: 0.2,
                            axis: [0, 1, 0],
                            pivot: [120, 0, 0],
                            deg: [0, 60],
                            ease: null} }
                  ]] },
            CmpTweens: {}
        });

        xworld.startUpdate();
            await sleep(500);
            xworld.update();
            // equilateral triangle
            var wp = cube.Obj3.mesh.getWorldPosition();
            var len = new vec3(wp).length();
            assert.closeTo(len, 120, 0.5); // 120 = pivot.len
    });

    it('affine combination: orbit {pivot: [120, 0, 0], axis: [0, 1, 0]}', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var cube = ecs.createEntity({
            id: 'orbit',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],     // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: null },
            ModelSeqs: { script: [
                 [{ mtype: AnimType.ORBIT,
                    paras: {start: Infinity,        // auto start,
                            duration: 0.4,
                            axis: [0, 1, 0],
                            pivot: [120, 0, 0],
                            deg: [0, 180],
                            ease: null} }],
                ] },
            CmpTweens: {}
        });

        xworld.startUpdate();
            cube.CmpTweens.startCmds.push(0);
            xworld.update();
            await sleep(500);
            xworld.update();
            xworld.update();
            var mat = cube.Obj3.mesh.matrix;
            var mt4 = new mat4().translate(-120, 0, 0)
                        .rotate(radian(180), 0, 1, 0)
                        .translate(120, 0, 0);
            assert.isTrue(mt4.transpose().eq(new mat4(mat)), 'orbit v.s transform combined');
    });

});

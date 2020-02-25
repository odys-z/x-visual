
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
import {vec3, mat4, radian} from '../lib/xmath/vec';
import {Affine} from '../lib/xmath/affine';

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
                    box: [200, 120, 80],
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
            xworld.update();
            await sleep(500);
            xworld.update();
            xworld.update();// reset combined.m0 === undefined
            var mat = cube.Obj3.mesh.matrix;
            var mt4 = new mat4().translate(-120, 0, 0)
                        .rotate(radian(180), 0, 1, 0)
                        .translate(120, 0, 0);
            assert.isTrue(mt4.transpose().eq(new mat4(mat)),
                        'orbit v.s transform combined');

        // must orbit from where it's stopped
        cube.CmpTweens.startCmds.push(0);
            xworld.update();
            await sleep(500);
            xworld.update();
            mat = cube.Obj3.mesh.matrix;
            mt4 = new mat4();
            assert.isTrue(mt4.transpose().eq(mat),
                        'orbited back to start v.s transform combined');
    });

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
            xworld.update();
            await sleep(300);
            xworld.update();
            await sleep(200);
            xworld.update();
            var mjs = cube.Obj3.mesh.matrix;
            var mt4 = new mat4()
                        .translate(-120, 0, 0)
                        .rotate(radian(180), 0, 1, 0)
                        .translate(120, 0, 0)
                        .rotate(radian(60), 1, 0, 0);
            mt4.reflect(-1, 0, -1).transpose().precision(3);
            console.log('combine transpose: ', mt4);
            console.log('mesh: (column major)', mjs);
            assert.isTrue(mt4.eq(new mat4(mjs)), 'orbit + rotatex v.s transform combined');
    });
});

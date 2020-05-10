
import chai from 'chai'
import { expect, assert } from 'chai'

import chaiStats from 'chai-stats'

const {performance} = require('perf_hooks');

import * as THREE from 'three';
import * as ECS from '../packages/ecs-js/index';
import XWorld from '../lib/xapp/xworld'
import {x} from '../lib/xapp/xworld'
import {sleep} from '../lib/xutils/xcommon'
import {Affine} from '../lib/xmath/affine';

import {Visual, AssetType} from '../lib/component/visual'
import {Obj3Type} from '../lib/component/obj3'
import {AnimType, ModelSeqs} from '../lib/component/morph';
import {vec3, mat4} from '../lib/xmath/vec';
import {XEasing} from '../lib/sys/tween/xtweener'

global.performance = performance;

describe('case: [affine] affines array', function() {
    this.timeout(100000);
    x.log = 4;
	x.test = true;
    var tframe = 20; // ms

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
                            duration: 1.2,
                            axis: [0, 1, 0],
                            pivot: [120, 0, 0],
                            deg: [0, 60],
                            ease: XEasing.Linear.None } }
                  ]] },
            CmpTweens: {}
        });

        xworld.startUpdate();
            // await sleep(300);
            // xworld.update();
            for (var l = 0; l < 1800 / tframe; l++) {
                xworld.update();
                await sleep(tframe);
            }
            // equilateral triangle
            var wp = new THREE.Vector3();
            cube.Obj3.mesh.getWorldPosition(wp);
            var len = new vec3(wp).length();
            // console.log(wp);
            // sin60 = 103.923
            assert.closeTo(len, 120, 4); // 120 = pivot.len
            assert.isTrue(new vec3(wp).eq([60, 0, 103.923], 2), '60, 0, 104');
    });

    it('affine: interpos', async function() {
        const xworld = new XWorld(undefined, 'window', {});
        const ecs = xworld.xecs;

        var cube = ecs.createEntity({
            id: 'inter-pos',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    asset: null },
            ModelSeqs: { script: [[
                  { mtype: AnimType.POSITION,
                    paras: {start: 0,        // auto start,
                            duration: 0.4,
                            translate: [[0, 0, -1], [0, 0, 2]],
                            ease: null} }
                  ]] },
            CmpTweens: {}
        });

        debugger
        /*
        xworld.startUpdate();
            var wp = new THREE.Vector3();
            xworld.update(); // onZinc called (mesh.mat updated) after affine applied
            cube.Obj3.mesh.getWorldPosition(wp);
            assert.isTrue(new vec3(wp).eq([0, 0, -1], 0.1), "0, 0, -1");

            await sleep(200);
            xworld.update();
            xworld.update(); // onZinc called (mesh.mat updated) after affine applied
            cube.Obj3.mesh.getWorldPosition(wp);
            console.log('0.2s', wp);
            assert.isFalse(new vec3(wp).eq([0, 0, 2]), "0.2s: 0, 0, 2");

            await sleep(400);
            xworld.update();
            xworld.update(); // onZinc called (mesh.mat updated) after affine applied
            cube.Obj3.mesh.getWorldPosition(wp);
            console.log('0.4s', wp);
            assert.isTrue(new vec3(wp).eq([0, 0, 2]), "0.4s: 0, 0, 2");
        */

        xworld.startUpdate();
            var wp = new THREE.Vector3();
            xworld.update();
            cube.Obj3.mesh.getWorldPosition(wp);
            assert.isTrue(new vec3(wp).eq([0, 0, -1], 0.1), "0, 0, -1");

            for (var l = 0; l < 200 / tframe; l++) {
                xworld.update();
                await sleep(tframe);
            }
            cube.Obj3.mesh.getWorldPosition(wp);
            // console.log('0.2s', wp);
            assert.isFalse(new vec3(wp).eq([0, 0, 2]), "0.2s: 0, 0, 2");

            for (var l = 0; l < 500 / tframe; l++) {
                xworld.update();
                await sleep(tframe);
            }
            xworld.update();
            cube.Obj3.mesh.getWorldPosition(wp);
            // console.log('0.4s', wp);
            assert.isTrue(new vec3(wp).eq([0, 0, 2], 0.1), "0.4s: 0, 0, 2");
    });
});

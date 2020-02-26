
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
            if (!mt4.eq(mat)) {
                console.log('combine:', mt4.log());
                console.log('mesh: (column major)', mat);
                assert.fail('orbit v.s transform combined');
            }

        // must orbit from where it's stopped, so now should back to the origin
        cube.CmpTweens.startCmds.push(0);
            debugger
            xworld.update();
            await sleep(500);
            xworld.update();
            mat = cube.Obj3.mesh.matrix;
            mt4 = new mat4();
            if (!mt4.eq(mat)){
                console.log('combine:', mt4.log());
                console.log('mesh: (column major)', mat);
                assert.fail('orbited back to start v.s transform combined');
            }
    });
});

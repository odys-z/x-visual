
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

describe('case: [affine ISSUE] orbit parallel to rotate axisy', function() {
    this.timeout(100000);
    x.log = 4;

    it('affine combination: orbit + roate x not combined correctly, WRONG', async function() {
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
                 [{ mtype: AnimType.ROTAXIS,
                    paras: {start: Infinity,
                            duration: 0.4,
                            deg: [0, 60],
                            axis: [1, 0, 0],
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

            // js matrxi must been kept
            xworld.update();
            assert.isFalse(new mat4(cube.Obj3.mesh.matrix).eq(new mat4()), "mesh.matrix 1");
            // console.log('mesh.matrix (0):', new mat4(cube.Obj3.mesh.matrix).log());
            // console.log(cube.Obj3.mesh.matrix);
            assert.closeTo(cube.Obj3.mesh.matrix.elements[12], 240, 1, "300ms (1), translate x = 240")

            xworld.update();
            assert.isFalse(new mat4(cube.Obj3.mesh.matrix).eq(new mat4()), "mesh.matrix 2");

            // shouldn't touch tx no matter how many times updated
            // FIXME this is wrong as tweens[1] affine transformation is applied to m0, and tx = 0 when tweens[0] finished
            // tweens[1].tx = 0, tweens[0].tx = 240 but when it's finished, the combinition lost.
            // This can only fix when Affine is re-designed as a system.
            assert.closeTo(cube.Obj3.mesh.matrix.elements[12], 0, 0.1, "300ms (2), translate x = 0 - WRONG")

            xworld.update();
            assert.isFalse(new mat4(cube.Obj3.mesh.matrix).eq(new mat4()), "mesh.matrix 3");
            assert.closeTo(cube.Obj3.mesh.matrix.elements[12], 0, .1, "300ms (3), translate x = 240")
    });
});

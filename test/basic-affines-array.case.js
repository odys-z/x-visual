
/** @namespace xv.test.tween */

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

describe('case: [affine] affines array', function() {
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
            var wp = new THREE.Vector3();
            cube.Obj3.mesh.getWorldPosition(wp);
            var len = new vec3(wp).length();
            assert.closeTo(len, 120, 1.0); // 120 = pivot.len
    });
});

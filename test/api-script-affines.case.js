
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
            // as rotation happens simutanously, some parts are not the same values
            mt4.m[5] = mt4.m[6] = mt4.m[9] = mt4.m[10] = 0;
            var ele = mjs.elements;
            ele[5] = ele[6] = ele[9] = ele[10] = 0;
            if (!mt4.eq(mjs)) {
                console.log('combine:', mt4.log());
                console.log('mesh: (column major)', mjs);
                assert.fail('orbit + rotatex v.s transform combined');
            }
    });
});

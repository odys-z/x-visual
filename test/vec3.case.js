/**Test case of packages/ecs-js with mocha and chai.
 * Original Author: fritzy@github
 * Original source @ github:
 * https://github.com/fritzy/ecs-js/blob/master/tests/index.js
 *
 */
// const { expect } = require('@hapi/code');
// const Lab = require('@hapi/lab');
// const lab = exports.lab = Lab.script();
// const ECS = require('../src/index');

import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

// const {performance} = require('perf_hooks');

import * as THREE from 'three'
import {vec3} from '../lib/xutils/vec';

describe('case: [vec3] operator basics', () => {

    it('instance operator', () => {
        var v1 = new vec3();
        var v2 = new vec3([1, 2, 3]);
        var v3 = new vec3(2, 4, 6);

        assert.isTrue(v1.add(v2).mul(2).eq(v3));
        assert.closeTo(v3.length() * v3.length(), v3.dot(v3), 0.01);
        assert.closeTo(v3.length() * v3.length(), v2.div(0.5).dot(v2), 0.01);
        assert.isTrue(v2.js() instanceof THREE.Vector3);
        assert.equal(v3.js().z,  6);
    });

});

/**Test css color handling.
 */

import chai from 'chai'
import { expect, assert } from 'chai'
import chaiStats from 'chai-stats'

import {cssColor} from '../../lib/xutils/xcommon';
import {vec3} from '../../lib/xmath/vec'


describe('case: [x-color] css color -> array', () => {
  let results;

  it('#dddddd / #ddd -> []', () => {
    results = cssColor('#000000');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [0, 0, 0]), "000");

    results = cssColor('#030405');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [3/255, 4/255, 5/255]), "345");

    results = cssColor('#fff');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [1, 1, 1]), "fff");
  });

  it('rgb: -> []', () => {
    results = cssColor('rgb(0, 0, 0)');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [0, 0, 0]), "000");

    results = cssColor('rgba(03, 04, 05)');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [3/255, 4/255, 5/255]), "345");

    results = cssColor('rgb(255, 255, 255)');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [1, 1, 1]), "fff");
  });

  it('hsl: -> []', () => {
    results = cssColor('hsl(0, 0%, 0%)');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [0, 0, 0]), "000");

    results = cssColor('hsl(240, 100%, 50%)');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [0, 0, 1]), "blue");

    results = cssColor('hsl(0, 0%, 100%)');
    expect(results.length).to.equal(3);
    assert.isTrue(vec3.eq(results, [1, 1, 1]), "fff");
  });
});

/**
 * Affine Transformation Helper
 * @module xv.xmath.vec
 */

import {vec3} from './vec';

export class Affine {
    constructor() { }

    /** Compose transforms
     * @param {array} affines, array of affine transformations
     * @param {object} combined, { mi, m0 },
     * combined.m0: start snapshot
     * combined.mi: tweeing buffer
     */
    static combine( affines, combined ) {
        if (affines && affines.length > 0) {
            /* affines need a buffer of combined mat4 for all tweening results.
             * reason of mat4 buffer:
             * XTweener must tweening on an object, e.g. affines[{rotate}],
             * but THREE.Object3D.applyMatrix4() can accumulate transformation
             * like rotations, makes rotation tweening faster and faster.
             */
            // mi = I for the first affine of first CmpTween
            var mi = combined.mi;
            for (var ax = 0; ax < affines.length; ax++)
                mi.appAfine(affines[ax]);
            mi.mulpost(combined.m0);
        }
        return combined;
    }

    static orbit( theta, pivot, axis, affines ) {
        if (!Array.isArray(affines))
            affines = [];
        if (axis instanceof vec3)
            axis = axis.arr();
        affines.push({translate: vec3.mul(pivot, -1).arr()}); // translation = 0 - pivot
        // affines.push({rotate: {deg: theta, axis: [0, 1, 0]}});
        affines.push({rotate: {deg: theta, axis}});
        affines.push({translate: Array.isArray(pivot) ? pivot : pivot.arr()});  // - translation
        return affines;
	}
}

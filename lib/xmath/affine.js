/**
 * Affine Transformation Helper
 * @namespace xv.xmath
 */

import {vec3, mat4} from './vec';

/**Affine transformation handler
 * @class Affine
 */
export class Affine {
    constructor() { }

    /**
     * @param {number} theta
     * @param {array | vec3} pivot
     * @param {array | vec3} axis
     * @param {array} affines buffer
     * @return {array} affines
     * @member Affine.orbit
     */
    static orbit( theta, pivot, axis, affines ) {
        if (!Array.isArray(affines))
            affines = [];
        if (axis instanceof vec3)
            axis = axis.arr();
        affines.push({translate: vec3.mul(pivot, -1).arr()}); // translation = 0 - pivot
        affines.push({rotate: {deg: theta, axis}});
        affines.push({translate: Array.isArray(pivot) ? pivot : pivot.arr()});  // - translation
        return affines;
    }

	/**Clear mi (at the start of an update)
	 * @param {object} combined
	 * @member Affine.combineBegin
	 */
    static combineBegin(combined) {
        if (combined.isPlaying) {
            combined.isPlaying = false;
            combined.mi.i(); // created when starting tween triggered in combineUpdate()
        }
    }

    /**Update affine combination for the object. (also trigger m0 snapshot for
     * the first time).
     *
     * Affines need a buffer of combined mat4 for all tweening results.
     * reason of mat4 buffer:
     * XTweener must tweening on an object, e.g. affines[{rotate}],
     * but THREE.Object3D.applyMatrix4() can accumulate transformation
     * like rotations, makes rotation tweening faster and faster.
     */
    static combineUpdate(affines, combined, mesh) {
        combined.isPlaying = true;

        if (!combined.m0) {
            // Starting tween event triggered at first of the tween sequence.
            // m0 == undefined is a flag of starting tweens
            // Handled here to ducking unnecessary "new" operation
            // - XTweener calling combineBegin() repeatedly,
            mesh.updateMatrix();
            combined.m0 = new mat4(mesh.matrix);
            combined.mi = new mat4();
        }

        // combine affines -> combined
        if (affines && affines.length > 0) {
            var mi = combined.mi;
            for (var ax = 0; ax < affines.length; ax++) {
                mi.appAfine(affines[ax]);
            }
            mi.mulpost(combined.m0);
        }
    }

    /**Update combined transform to Obj3.mesh.matrix.
     * first update mesh matrix, then apply affine transformation to it
     * Three.js docs about the order:
     * Convenience properties and matrixAutoUpdate,
     * https://threejs.org/docs/#manual/en/introduction/Matrix-transformations
     */
    static combineEnd(combined, mesh) {
        /* Source of THREE.Object3D
        applyMatrix4: function ( matrix ) {
            if ( this.matrixAutoUpdate ) this.updateMatrix();
            this.matrix.premultiply( matrix );
            this.matrix.decompose( this.position, this.quaternion, this.scale );
        },
        */
        // nothing to do if never started
        if (combined.isPlaying && combined.m0) {
            mesh.matrixAutoUpdate = false;
            if (!combined.mi) {
                debugger;
            }
            combined.mi.put2js( mesh.matrix );
            mesh.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
        }
    }

    static tweenStop(combined, mesh) {
        if (combined.m0) {
            combined.isPlaying = false;
            combined.m0 = undefined;
            mesh.matrixAutoUpdate = true;
        }
    }
}

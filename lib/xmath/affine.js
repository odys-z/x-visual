/**
 * Affine Transformation Helper
 * @module xv.xmath.vec
 */

import {vec3, mat4} from './vec';

export class Affine {
    constructor() { }

    /** Compose transforms
     * @param {array} affines, array of affine transformations
     * @param {object} combined, { mi, m0 },
     * combined.m0: start snapshot
     * combined.mi: tweeing buffer
    static combine( affines, combined ) {
        if (affines && affines.length > 0) {
            /* affines need a buffer of combined mat4 for all tweening results.
             * reason of mat4 buffer:
             * XTweener must tweening on an object, e.g. affines[{rotate}],
             * but THREE.Object3D.applyMatrix4() can accumulate transformation
             * like rotations, makes rotation tweening faster and faster.
             * /
            // mi = I for the first affine of first CmpTween
            var mi = combined.mi;
            if (!mi) {
                debugger;
            }
            for (var ax = 0; ax < affines.length; ax++)
                mi.appAfine(affines[ax]);
            if (combined.m0 === undefined)
                combined.m0 = new mat4();
            mi.mulpost(combined.m0);
        }
        return combined;
    }
     */

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

    static combineBegin(combined) {
		if (combined.isPlaying) {
			combined.isPlaying = false;
			combined.mi.i(); // created when starting tween triggered in combineUpdate()
		}
    }

    static combineUpdate(affines, combined, mesh) {
        // first update mesh matrix, then apply affine transformation to it
        // Three.js docs about the order:
        // Convenience properties and matrixAutoUpdate,
        // https://threejs.org/docs/#manual/en/introduction/Matrix-transformations

        combined.isPlaying = true;

        if (!combined.m0) {
            // starting tween event:
            // first combination of the tween sequence
            // m0 == undefined is a flag of starting tweens
            // triggered here for XTweener calling combineBegin() repeatedly,
            // to ducking unnecessary "new" operation.
            mesh.updateMatrix();
            combined.m0 = new mat4(mesh.matrix);
            combined.mi = new mat4();
        }

        // Affine.combine(affines, combined);
        if (affines && affines.length > 0) {
            /* affines need a buffer of combined mat4 for all tweening results.
             * reason of mat4 buffer:
             * XTweener must tweening on an object, e.g. affines[{rotate}],
             * but THREE.Object3D.applyMatrix4() can accumulate transformation
             * like rotations, makes rotation tweening faster and faster.
             */
            var mi = combined.mi;
            for (var ax = 0; ax < affines.length; ax++) {
                mi.appAfine(affines[ax]);
            }
            mi.mulpost(combined.m0);
        }
    }

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
        combined.isPlaying = false;
        combined.m0 = undefined;
		mesh.matrixAutoUpdate = true;
    }
}

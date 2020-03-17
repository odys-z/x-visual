/** @module xv.ecs.sys.tween */

import * as ECS from '../../packages/ecs-js/index';

/**
 * @class AffineCombiner
 */
export default class AffineCombiner extends ECS.System {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
	}

	update(tick, entities) {
	}

	/**Clear mi (at the start of an update)
	 * @param {object} combined
	 * @member AffineCombiner#combineBegin
	 */
    combineBegin(combined) {
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
	 * @param {array<Affine>} affines
	 * @param {mat4} combined
	 * @param {THREE.Mesh} mesh
	 * @member AffineCombiner#combineUpdate
     */
    combineUpdate(affines, combined, mesh) {
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
	 * @param {mat4} combined
	 * @param {THREE.Mesh} mesh
	 * @member AffineCombiner#combineEnd
     */
    combineEnd(combined, mesh) {
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

	/**
	 * @param {mat4} combined
	 * @param {THREE.Mesh} mesh
	 * @member AffineCombiner#tweenStop
	 */
    tweenStop(combined, mesh) {
        combined.isPlaying = false;
        combined.m0 = undefined;
		mesh.matrixAutoUpdate = true;
    }
}

AffineCombiner.query = {iffall: ['ModelSeqs', 'CmpTweens']};

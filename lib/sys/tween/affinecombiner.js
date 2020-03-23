/** @module xv.ecs.sys.tween */

import * as ECS from '../../../packages/ecs-js/index';

import {mat4} from '../../xmath/vec';
import {Affine} from '../../xmath/affine';

/**Combine affine transformation animated by XTweener.
 *
 * For details, see <a href='https://odys-z.github.io/x-visual/design-memo/affine.html'>doc</a>
 * @class AffineCombiner
 */
export default class AffineCombiner extends ECS.System {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;

 		var ents = ecs.queryEntities({iffall: ['Obj3', 'ModelSeqs', 'CmpTweens']});
		if (ents || ents.length > 0)
			this.initCombined(ents);
	}

	initCombined (entities) {
		for (const e of entities) {
			for (var seqx = 0; seqx < e.CmpTweens.twindx.length; seqx++) {
				for (const twn of e.CmpTweens.tweens[seqx]) {
					// debug notes: TODO test hybriding affine and none-affine tweens
					if (twn.affineCombine) { // flag set by animizer
						var f = twn.onStartHandler ? twn.onStartHandler.onStart : undefined;

						twn.onStartHandler = {onStart: (twnObj) => {
							if (!e.Obj3.mi)
								e.Obj3.mi = new mat4();

							twn.parent.m0s[twn.seqx].setjs(e.Obj3.mesh.matrix);

							if (typeof f === 'function')
								f(twnObj);
						}};
						twn.onStartCallbackFired = false;

						if (!Array.isArray(e.CmpTweens.m0s)) {
							e.CmpTweens.m0s = new Array(e.CmpTweens.twindx.length);
						}
						// if ( !(e.CmpTweens.m0s[seqx] instanceof mat4) ) {
						// 	e.CmpTweens.m0s[seqx] = new mat4(e.Obj3.mesh.matrix);
						// }
						e.CmpTweens.m0s[seqx] = new mat4(e.Obj3.mesh.matrix);
					}
				}
			}
			// onZinc
			var crs = e.CmpTweens.onZinc;
			e.CmpTweens.onZinc = () => {
				if (typeof crs === 'function')
					crs();
				this.combineEnd(e.Obj3, e.Obj3.mesh);
			}
		}
	}

	update(tick, entities) {
		for (const e of entities) {
			if (e.Obj3.mi)
				e.Obj3.mi.i();
			else continue;

			for (var seqx = 0; seqx < e.CmpTweens.twindx.length; seqx++) {
				for (const twn of e.CmpTweens.tweens[seqx]) {
					if (twn.isPlaying && twn.affineCombine // flag set by animizer
						// Debug Notes:
						// twn.onStart is called in XTweener.updateTween, later than startTween,
						// but isPlaying is set in startTween,
						// so there are chance such that twn.isPlaying = true but e.Obj3.mi is not initialized.
						// Shall we revise Tween.js?
						&& e.Obj3.mi !== undefined) {
						this.combineUpdate(e.Obj3, twn.affines, e.CmpTweens.m0s[seqx]);
					}
				}
			}
		}
	}

    /**Update affine combination for the object.
	 * @param {Obj3} combined target object with mi
	 * @param {array<Affine>} affines
	 * @param {mat4} m0 m0_g, m0_f, ...
	 * @member AffineCombiner#combineUpdate
     */
    combineUpdate(combined, affines, m0) {
        if (affines && affines.length > 0) {
            var mi = combined.mi;
            for (var ax = 0; ax < affines.length; ax++) {
                mi.appAffine(affines[ax]);
            }
            mi.mulpost(m0);
        }
    }

    /**Update combined transform to Obj3.mesh.matrix.
     *
	 * Must been called when z is really increased - tweens updated in one loop.
     * - needing first updating mesh matrix, then apply affine transformation to it.
     *
     * Three.js docs about the order:
     *
     * Convenience properties and matrixAutoUpdate,
     *
     * https://threejs.org/docs/#manual/en/introduction/Matrix-transformations
	 * @param {mat4} combined
	 * @param {THREE.Mesh} mesh
	 * @member AffineCombiner#combineEnd
     */
    combineEnd(combined, mesh) {
        mesh.matrixAutoUpdate = false;
        if (combined.mi) {
            combined.mi.put2js( mesh.matrix );
            mesh.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
        }
    }
}

AffineCombiner.query = {iffall: ['Obj3', 'ModelSeqs', 'CmpTweens']};

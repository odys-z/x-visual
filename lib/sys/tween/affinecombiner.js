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
						e.Obj3.m0 = new mat4();
						e.Obj3.mi = new mat4();
						e.CmpTweens.idle = true;
						e.CmpTweens.idleRising = false;
						e.CmpTweens.playRising = false;
					}
				}
			}
		}
	}

	update(tick, entities) {
		for (const e of entities) {
			if (e.Obj3.mi)
				e.Obj3.mi.i();
			else continue;

			if (!e.CmpTweens.idle) {
				if (e.CmpTweens.playRising) {
					e.Obj3.m0.setjs(e.Obj3.mesh.matrix);
				}

				for (var seqx = 0; seqx < e.CmpTweens.twindx.length; seqx++) {
					// for (const twn of e.CmpTweens.tweens[seqx]) {
					// 	if (twn.isPlaying && twn.affineCombine // flag set by animizer
					// 		// Debug Notes:
					// 		// twn.onStart is called in XTweener.updateTween, later than startTween,
					// 		// but isPlaying is set in startTween,
					// 		// so there are chance such that twn.isPlaying = true but e.Obj3.mi is not initialized.
					// 		// Shall we revise Tween.js?
					// 		&& e.Obj3.mi !== undefined) {
					// 		this.combineUpdate(e.Obj3, twn.affines, e.CmpTweens.m0s[seqx]);
					// 	}
					// }
					var twindx = e.CmpTweens.twindx[seqx];
					if (twindx < e.CmpTweens.tweens[seqx].length) {
						var tw = e.CmpTweens.tweens[seqx][twindx];
						this.combineUpdate(e.Obj3, tw.affines);
					}
					// TODO remember mi_f when tween finished
					// - to have other still running tweens combined with this final results.
				}
				this.combineEnd(e.Obj3, e.Obj3.mesh);
			}

			if (e.CmpTweens.idleRising) {
				e.Obj3.m0.setjs(e.Obj3.mesh.matrix);
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
        }
    }

    /**Update combined object transform to Obj3.mesh.matrix.
     *
     * Must been called when z is really increased - tweens updated in one loop.
     * - needing first updating mesh matrix, then apply affine transformation to it.
     *
     * Three.js docs about the order:
     *
     * Convenience properties and matrixAutoUpdate,
     *
     * https://threejs.org/docs/#manual/en/introduction/Matrix-transformations
     * @param {Obj3} obj3 combined
     * @param {THREE.Mesh} mesh
     * @member AffineCombiner#combineEnd
     */
    combineEnd(obj3, mesh) {
        mesh.matrixAutoUpdate = false;
        if (obj3.mi) {
            obj3.mi.mulpost(obj3.m0);
            obj3.mi.put2js( mesh.matrix );
            mesh.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
        }
    }
}

AffineCombiner.query = {iffall: ['Obj3', 'ModelSeqs', 'CmpTweens']};

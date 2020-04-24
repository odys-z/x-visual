
import * as ECS from '../../../packages/ecs-js/index';

import {mat4, AffineType} from '../../xmath/vec';
// import {Affine} from '../../xmath/affine';

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
						twn.onFollowed = (followee) => {
							twn._mf = new mat4(followee.mf);
						};
						if (!e.Obj3.m0) {
							e.Obj3.m0 = new mat4();
							e.Obj3.mi = new mat4();
							e.Obj3.mi_z = new mat4();
							e.CmpTweens.idle = true;
							e.CmpTweens.idleRising = false;
							e.CmpTweens.playRising = false;
						}
					}
				}
			}
		}
	}

	update(tick, entities) {
		for (const e of entities) {
			if (e.Obj3.mi) {
				// console.log(e.Obj3.mi);
				e.Obj3.mi.i();
			}
			else continue;

			if (!e.CmpTweens.idle) {
				if (e.CmpTweens.playRising) {
					e.Obj3.m0.setByjs(e.Obj3.mesh.matrix);
				}

				// Debug Notes:
				// About dirty
				// XTweener is not gurenteed always firing idleRising in mediatly,
				// this makes the following loops may be skipped lefting mi = I.
				// Here using a dirty flag to keep the mi_z not been over writed.
				// And later use it put set mesh matrix when idle is really fired.
				var dirty = false;
				for (var seqx = 0; seqx < e.CmpTweens.twindx.length; seqx++) {
					var twindx = e.CmpTweens.twindx[seqx];
					if (twindx < e.CmpTweens.tweens[seqx].length) {
						var tw = e.CmpTweens.tweens[seqx][twindx];
						if ( tw.affineCombine ) {
							// combine the mf even it's stopped - combine with the last results
							this.combineUpdate(e.Obj3, tw);
							dirty = true;
						}
					}
				}
				if (dirty) {
					this.combineEnd(e.Obj3, e.Obj3.mesh);
					e.Obj3.mi_z.copy(e.Obj3.mi);
				}
			}

			if (e.CmpTweens.idleRising) {
				e.Obj3.mi_z.put2js(e.Obj3.mesh.matrix);
			}
		}
	}

    /**Update affine combination for the object.
     * @param {Obj3} combined target object with mi
     * @param {array<AffineTrans>} affines e.g. [{mi, translate: [x, y, z]}]
     * @member AffineCombiner#combineUpdate
     */
    combineUpdate(combined, tween) {
        var affines = tween.affines;
        if (tween.isPlaying && affines && affines.length > 0) {
            tween.mf.i();
            for (var ax = 0; ax < affines.length; ax++) {
                tween.mf.appAffine(affines[ax]);
            }
        }
        // apply mf of previous tween (in same sequence)
        if (tween._mf instanceof mat4)
            tween.mf.mulpost(tween._mf);

        combined.mi.mulpost(combined.m0);
        combined.mi.mul(tween.mf);
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
            // obj3.mi.mulpost(obj3.m0);
            obj3.mi.put2js( mesh.matrix );
            mesh.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
			// obj3.mi_z.copy(obj3.mi);
        }
    }
}

AffineCombiner.query = {iffall: ['Obj3', 'ModelSeqs', 'CmpTweens']};

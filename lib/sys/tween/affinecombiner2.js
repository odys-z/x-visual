
import * as ECS from '../../../packages/ecs-js/index';

import {mat4, AffineType} from '../../xmath/vec';

/**Combine affine transformation animated by XTweener.
 *
 * For details, see <a href='https://odys-z.github.io/x-visual/design-memo/affine.html'>doc</a>
 * @class AffineCombiner
 */
export default class AffineCombiner2 extends ECS.System {
    constructor(ecs, x) {
        super(ecs);
        this.ecs = ecs;
		console.log('AffineCombiner v2 ...');

        var ents = ecs.queryEntities({iffall: ['Obj3', 'ModelSeqs', 'CmpTweens']});
        if (ents || ents.length > 0)
            this.initCombined(ents);
    }

	initCombined (entities) {
		for (const e of entities) {
			for (var seqx = 0; seqx < e.CmpTweens.twindx.length; seqx++) {
				for (const twn of e.CmpTweens.tweens[seqx]) {
					if (twn.affineCombine) { // flag set by animizer
						if (!e.Obj3.m0) {
							e.Obj3.m0 = new mat4();
							e.Obj3.mi = new mat4();
							e.Obj3.mi_z = new mat4();
							e.CmpTweens.idle = true;
							e.CmpTweens.idleRising = false;
							e.CmpTweens.playRising = false;
							e.CmpTweens._mfs = new Array(e.CmpTweens.twindx.length);
							e.CmpTweens.mf_buff = new Array(e.CmpTweens.twindx.length);
						}
					}
				}
				// a _mf is a finished tween results in a sequnce, for combining
				// a _m0 is a snapshot of _mf when starting a new tween.
				e.CmpTweens._mfs[seqx] = new mat4();
				e.CmpTweens.mf_buff[seqx] = new mat4();
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
					e.Obj3.mi.setByjs(e.Obj3.mesh.matrix);

					for (var seqx = 0; seqx < cmpTweens.twindx.length; seqx++) {
						var twindx = cmpTweens.twindx[seqx];
						cmpTweens.mf_buff[seqx].i();
					}
				}

				var dirty = false;
				dirty = this.combineUpdate(e.Obj3, e.CmpTweens);

				if (dirty) {
					this.combineEnd(e.Obj3, e.Obj3.mesh);
					// e.Obj3.mi_z.copy(e.Obj3.mi);
				}
			}

			if (e.CmpTweens.idleRising) {
				// e.Obj3.mi_z.put2js(e.Obj3.mesh.matrix);
				// e.Obj3.m0.copy(e.Obj3.mi);

				// see also XTweener.update of (twnx + 1 >= e.CmpTweens.tweens[seqx].length)
				for (var fx = 0; fx < e.CmpTweens.endingFiring.length; fx++) {
					if (e.CmpTweens.endingFiring[fx]) {
						e.CmpTweens.endingFiring[fx] = false;
						e.CmpTweens._mfs[fx].copy(e.CmpTweens.mf_buff[fx]);
						if (e.CmpTweens.eFinished
							&& typeof e.CmpTweens.eFinished === 'function') {
							// eFinished is a copy of ModelSeqs.fFinished
							e.CmpTweens.eFinished(e.CmpTweens, fx);
						}
					}
				}
			}
		}
	}

    /**Update affine combination for the object.
     * @param {Obj3} obj3 combined target object with mi
     * @param {CmpTweens} cmpTweens e.g. [{mi, translate: [x, y, z]}]
	 * @return {bool} dirty
     * @member AffineCombiner#combineUpdate
     */
    combineUpdate(obj3, cmpTweens) {
		var dirty = false;
		// obj3.mi.i();
		for (var seqx = 0; seqx < cmpTweens.twindx.length; seqx++) {
			var twindx = cmpTweens.twindx[seqx];
			if (twindx < cmpTweens.tweens[seqx].length) {
				cmpTweens.mf_buff[seqx].i(); // FIXME can't handle multiple tween in a sequence, needing tw.mf
				var tw = cmpTweens.tweens[seqx][twindx];
				if ( tw.affineCombine ) {
					// combine the mf even it's stopped
			        if (// tw.isPlaying &&
						tw.affines && tw.affines.length > 0) {
						dirty = true;
			            for (var ax = 0; ax < tw.affines.length; ax++) {
			                cmpTweens.mf_buff[seqx].appAffine(tw.affines[ax]);
							// appAffine(obj3.mi, tw.affines[ax]);
			            }
			        }
					// else if ( !tw.isPlaying )
					//	TODO we can collect snapshot of a sequence for performance optimization
				}
			}
	        obj3.mi.mul(cmpTweens.mf_buff[seqx]);
		}
		return dirty;
    }

    /**Update combined object transform to Obj3.mesh.matrix.
     *
     * Must been called when z-transform is really increased - tweens updated in one loop.
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
            obj3.mi.put2js( mesh.matrix );
            mesh.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
        }
    }
}

AffineCombiner2.query = {iffall: ['Obj3', 'ModelSeqs', 'CmpTweens']};

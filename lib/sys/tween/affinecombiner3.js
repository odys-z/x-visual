
import * as ECS from '../../../packages/ecs-js/index';

import {AffineType} from '../../xmath/vec';
import {Affine} from '../../xmath/affine';

/**Combine affine transformation animated by XTweener.
 *
 * For details, see <a href='https://odys-z.github.io/x-visual/design-memo/affine.html'>doc</a>
 * @class AffineCombiner
 */
export default class AffineCombiner3 extends ECS.System {
    constructor(ecs, x) {
        super(ecs);
        this.ecs = ecs;
		console.log('AffineCombiner v3 ...');

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
							e.Obj3.m0 = new Affine();
							if (e.Obj3.mesh)
								e.Obj3.m0.decompose(e.Obj3.mesh.matrix);

							e.Obj3.mi = new Affine();
							e.CmpTweens.idle = true;
							e.CmpTweens.idleRising = false;
							e.CmpTweens.playRising = false;
							e.CmpTweens._mfs = new Array(e.CmpTweens.twindx.length);
							e.CmpTweens.mf_buff = new Array(e.CmpTweens.twindx.length);
						}
						twn.mf = new Affine();
					}
				}
				if (e.CmpTweens && e.CmpTweens._mfs) {
					e.CmpTweens._mfs[seqx] = new Affine();
					e.CmpTweens.mf_buff[seqx] = new Affine();
				}
			}
		}
	}

	update(tick, entities) {
		for (const e of entities) {
			if (!e.Obj3.mi) {
				continue; // not initialized by animizer
			}
			else e.Obj3.mi.i();

			if (!e.CmpTweens.idle) {
				var dirty = false;
				dirty = this.combineUpdate(e.Obj3, e.CmpTweens);

				if (dirty) {
					this.combineEnd(e.Obj3, e.Obj3.mesh);
				}
			}

			if (e.CmpTweens.idleRising) {
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
		for (var seqx = 0; seqx < cmpTweens.twindx.length; seqx++) {
			var twindx = cmpTweens.twindx[seqx];
			if (twindx < cmpTweens.tweens[seqx].length) {
				cmpTweens.mf_buff[seqx].i();
				var tw = cmpTweens.tweens[seqx][twindx];
				if ( tw.affineCombine ) {
					dirty = true;
					// combine the mf even it's stopped
			        if ( tw.affines && tw.affines.length > 0) {
						if ( tw.isPlaying ) {
							tw.mf.i();
				            for (var ax = 0; ax < tw.affines.length; ax++) {
				                tw.mf.appAffine(tw.affines[ax]);
				            }
						}
				        cmpTweens.mf_buff[seqx].mul(tw.mf);
			        }
				}
			}
	        if (cmpTweens.mf_buff[seqx])
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
			obj3.mi.mulpost(obj3.m0);
            obj3.mi.composeTo( mesh.matrix );
            mesh.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
        }
    }
}

AffineCombiner3.query = {iffall: ['Obj3', 'ModelSeqs', 'CmpTweens']};

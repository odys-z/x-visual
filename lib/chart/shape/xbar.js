

import * as ECS from '../../../packages/ecs-js/index'
import {x} from '../../xapp/xworld'
import {XError} from '../../xutils/xcommon'

import XSys from '../../sys/xsys'
import {MorphingAnim} from '../../sys/tween/animizer'
import {CoordsGrid} from '../../xmath/chartgrid'
import {vec3} from '../../xmath/vec'

import {Obj3Type} from '../../component/obj3';
import {Sankey} from '../../component/ext/chart'
import {AssetType, ShaderFlag} from '../../component/visual';

/**
 * Subsystem rendering 3d bar chart
 *
 * @class XBar
 */
export default class XBar extends XSys {

	constructor(ecs, options, json) {
		super(ecs);

		if (!x.chart || !x.chart.grid) {
			this.grid = new CoordsGrid(options.chart, json);
			x.chart = Object.assign(x.chart, {grid: this.grid});
		}
		else this.grid = x.chart.grid;

		this.bars(ecs, options.grid, json.bar, json.vectors);
	}


	bars(ecs, grid, chart, vectors) {
		var asset = chart.texture || options.texture;
		var vecs = vectors;
		if (!chart || !vecs || !Array.isArray(vecs))
			throw new XError("XBar(chart, vectors): invalid data: ", chart, vecs);

		if (chart.bars && chart.bars.length > 0)
			console.error("Not yet supported: ", chart.bars);

		this.vecs = new Array(vecs.length);
		for (var brx = 0; brx < vecs.length; brx++) {
			var h = grid.barHeight(bar[2]);
			var bar = vect[brx];
			// init pos: x, y, z=0
			this._buf = grid.worldPos( [bar[0], bar[1]], this._buf );
			this._buf[1] += h * 0.5;

			var animSeqs = [];
				animSeqs.push( [{
					mtype:  xv.XComponent.AnimType.U_MORPHi,
                    paras: {start: 0,            // auto start
                            duration: 0.71,      // seconds
                            uniforms: {
                                u_morph0: [0, 1],
                                u_morph1: [0, 0],
                                u_morph2: [0, 0]
                            },
                            ease: xv.XEasing.Elastic.Elastic} }] );
                animSeqs.push( [{
					mtype:  xv.XComponent.AnimType.U_MORPHi,
                    paras: {start: Infinity,
                            duration: 0.62,
                            uniforms: {
                                u_morph0: [0, 0],
                                u_morph1: [0, 1],
                                u_morph2: [0, 0]
                            },
                            ease: undefined} }] );
                animSeqs.push( [{
					mtype:  xv.XComponent.AnimType.U_MORPHi,
                    paras: {start: Infinity,
                            duration: 0.53,
                            uniforms: {
                                u_morph0: [0, 0],
                                u_morph1: [0, 0],
                                u_morph2: [0, 1] },
                            ease: undefined} }] );

			var bar = ecs.createEntity({
				id: barUId(),
				Obj3: { geom,
						// transform: [{translate: [-1 * scl * 4, y11, 0]}],
						transform: [{ translate: this._buf }],
						box },
				Visual:{vtype: AssetType.mesh,
						asset},
				Bar:{vecIx: brx},
				GpuPickable: {},
				ModelSeqs: { script: animSeqs },
				CmpTweens: {}
			});

		}
	}

}

/**For generating XBar element uuid.
 * @memberof XBar
 */
var baruuid = 0;

/**Get a uuid.
 * @memberof XBar */
function barUId() {
	return `br-${++baruuid}`;
}

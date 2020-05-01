

import * as ECS from '../../../packages/ecs-js/index'
import {x} from '../../xapp/xworld'
import {XError} from '../../xutils/xcommon'

import XSys from '../../sys/xsys'
import {MorphingAnim} from '../../sys/tween/animizer'
import {CoordsGrid} from '../../xmath/chartgrid'
import {vec3} from '../../xmath/vec'

import {Obj3Type} from '../../component/obj3'
import {Bar, GridValue} from '../../component/ext/chart'
import {AssetType, ShaderFlag} from '../../component/visual'

/**
 * Subsystem rendering 3d bar chart
 *
 * @class XBar
 */
export default class XBar extends XSys {

	/**
	 * create bar chart objects
	 * @param {ECS} ecs
	 * @param {object} options
	 * options.chart: the json chart section defining chart grid space, {domain, range, grid, grid-space}
	 * @param {object} jbar the json bar section definint bar chart.<br>
	 * @param {array} vectors the high dimensional vectors.<br>
	 * assumes the last dimension as the y scale value
	 * @constructor XSankey
	 */
	constructor(ecs, options, jbar, vectors) {
		super(ecs);
		ecs.registerComponent('Bar', Bar);
		ecs.registerComponent('GridValue', GridValue);

		if (!x.chart || !x.chart.grid) {
			this.grid = new CoordsGrid(json.chart);
			x.chart = Object.assign(x.chart || {}, {grid: this.grid});
		}
		else this.grid = x.chart.grid;

		this.bars(ecs, this.grid, jbar, vectors, options);
	}

	bars(ecs, grid, chart, vectors, options = {}) {
		var vecs = vectors;
		if (!chart || !vecs || !Array.isArray(vecs))
			throw new XError("XBar(chart, vectors): invalid data: ", chart, vecs);

		if (chart.bars && chart.bars.grid && chart.bars.grid.length > 0)
			console.error("Not yet supported: ", chart.bars);

		var offset = chart.bars.offset || [0, 0, 0];

		var geom = options.geom === undefined ?
					Obj3Type.Cylinder : options.geom;
		var asset = chart.texture || options.texture;

		var animSeqs = [];
			animSeqs.push( [{
				mtype:  xv.XComponent.AnimType.U_MORPHi,
				paras: {start: 0,			// auto start
						duration: 0.71,	  // seconds
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
						duration: 0.55,
						uniforms: {
							u_morph0: [0, 0],
							u_morph1: [0, 0],
							u_morph2: [0, 1] },
						ease: undefined} }] );

		this.vecs = new Array(vecs.length);
		for (var brx = 0; brx < vecs.length; brx++) {
			var bar = vecs[brx];
			var h = grid.barHeight(bar[2]);
			// init pos: x, y, z=0
			// x, y, z = bar[0], 0, bar[1]
			// x, y, z = offset[0], offset[1], offset[2]
			var pos0 = grid.worldPos( [bar[0] + offset[0], offset[1], bar[1] + offset[2]] );
			pos0[1] += h * 0.5;

			// radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
			var box = Array.from(chart.geometry);
			if (!box)
				box = [grid.space(0.1), grid.space(0.1), h, 4];
			else {
				box[0] = grid.space(box[0]);
				box[1] = h;
				box[2] = grid.space(box[2]);
				for (var xl = 3; xl < box.length; xl++ )
					box[xl] = eval(box[xl]);
			}

			var bar = ecs.createEntity({
				id: barUId(),
				Obj3: { geom,
						// transform: [{translate: [-1 * scl * 4, y11, 0]}],
						transform: [{ translate: pos0 }],
						box,
						uniforms: {opacity: 1.0}},
				Visual:{vtype: AssetType.mesh,
						shader: xv.XComponent.ShaderFlag.colorArray,
						// colors' morphing weight variable name: u_morph0, u_morph1, ...
						paras:{ colors:[[1, 0, 0],
										[0, 0, 1],
										[0, 1, 0]] },
						asset},
				Bar:  { vecIx: brx },
				GridValue: {gridx: [bar[0] + offset[0], offset[1], bar[1] + offset[2]],
							val:	bar[2]},
				GpuPickable: {},
				ModelSeqs: { script: animSeqs },
				CmpTweens: {}
			});

		}
	}

	/**Update x.chart.valuePos
	 * @param {int} tick
	 * @param {array<Entity>} entites
	 * @member XBar#update
	 * @function
	 */
	update(tick, entities) {
		// if (x.xview.flag > 0) {
		// 	if (x.xview.picked && x.xview.picked.Bar) {
		// 		x.xchart.gridx = x.xview.picked.Bar.valuePos;
		// 	}
		// 	else if (!x.xview.picked) {
		// 		x.xchart.valPos = [0, 0, 0];
		// 	}
		// }
	}
}

XBar.query = {iffall: ['Bar']};

/**For generating XBar element uuid.
 * @memberof XBar
 */
var baruuid = 0;

/**Get a uuid.
 * @memberof XBar */
function barUId() {
	return `br-${++baruuid}`;
}

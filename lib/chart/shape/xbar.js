import * as ECS from '../../../packages/ecs-js/index'
import {x} from '../../xapp/xworld'
import {XError} from '../../xutils/xcommon'

import XSys from '../../sys/xsys'
import {MorphingAnim} from '../../sys/tween/animizer'
import {CoordsGrid} from '../../xmath/chartgrid'
import {vec3} from '../../xmath/vec'
import xgeom from '../../xmath/geom'

import {Obj3Type} from '../../component/obj3'
import {ElemType, GridValue, Bar} from '../../component/ext/chart'
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

		var dok; // docking
		if (chart.serials && chart.serials.docking && chart.serials.docking.length > 0)
			dok = chart.serials.docking;

		var offset = chart.serials ? chart.serials.pos0 || [1, 0, 1] : [1, 0, 1];

		var geom = chart.Obj3.geom === undefined ?
					Obj3Type.Cylinder : eval(chart.Obj3.geom);
		var asset = chart.texture || options.texture;

		var animSeqs = [];
			animSeqs.push( [{
				mtype:  xv.XComponent.AnimType.U_MORPHi,
				paras: {start: 5,
						duration: 0.71,
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
			// var pos0 = grid.worldPos( [bar[0] + offset[0], offset[1], bar[1] + offset[2]] );
			var pos0;
			var gridx; // position of bar's value lines
			if (dok) {
				pos0 = grid.worldPos( undefined, dok[brx], offset );
				gridx = [dok[brx][0] + offset[0], dok[brx][1] + offset[1], dok[brx][2] + offset[2]];
			}
			else {
				pos0 = grid.worldPos( undefined, [bar[0], 0, bar[1]], offset );
				gridx = [bar[0] + offset[0], offset[1], bar[1] + offset[2]];
			}
			pos0[1] += h * 0.5;

			// Cylinder:
			// radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
			// Box: x, y, z
			var box = [...chart.Obj3.box]; // copy
			for (var xl = 3; xl < box.length; xl++ )
				box[xl] = eval(box[xl]);
			box = XBar.threeGeomParas(grid, geom, box, h);

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
				// GridValue: {gridx: [bar[0] + offset[0], offset[1], bar[1] + offset[2]],
				GridValue: {gridx,
							val: bar[2]},
				GpuPickable: {},
				ModelSeqs: { script: animSeqs },
				CmpTweens: {}
			});

		}

		this.serials(ecs, grid, chart.serials, options);
	}

	serials(ecs, grid, serials, options) {
		// var serials = chart.serials;
		var off = serials.pos0;
		var offsets = serials.offsets;
		var l = serials.labels;
		if (!l || l.length === 0) return;

		var colors = serials["label-colors"] || ['white', 'white', 'white'];
		var box = serials["label-box"] ? serials["label-box"] : [24, 24];
		var xywh = serials["label-canvas"];
		var posyzx = grid.lerposes([l[0].length, l[1].length, l[2].length], off);

		// label at [x, 0, 0]
		// var posx = grid.lerposes([l[0].length, 1, 1], off);
		for (var x = 0; x < posyzx[0][0].length; x++) {
			this.createLabels(ecs, l[0][x], [posyzx[0][0][x][0], 0, 0],
				{ box, xywh,
				  style: colors[0],
				  font: options.font});
		}
		// label at [0, y, 0]
		for (var y = 0; y < posyzx.length; y++) {
			this.createLabels(ecs, l[1][y], [0, posyzx[y][0][0][1], 0],
				{ box, xywh,
				  style: colors[1],
				  font: options.font});
		}
		// label at [0, 0, z]
		for (var z = 0; z < posyzx[0].length; z++) {
			this.createLabels(ecs, l[2][z], [0, 0, posyzx[0][z][0][2]],
				{ box, xywh,
				  style: colors[2],
				  font: options.font});
		}
	}

	createLabels(ecs, lb, pos, options) {
		var box = options.box ? options.box : [24, 24];
		var lablx = ecs.createEntity({
			id: `lb-${pos}`,
			Obj3: { geom: xv.XComponent.Obj3Type.PLANE,
					box,
					transform: [{translate: pos}],
					mesh: undefined },
			Visual:{vtype: xv.AssetType.mesh_basic},
			Dynatex: {text: lb,
					xywh: options.xywh || {x: 0, y: 128},
					dirty: true,
					font: options.font,
					style: options.style},
			GpuPickable: {},
			GridElem: {etype: ElemType.text}
		});
		return lablx;
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

	///////////////////////////////////////////////////////////////////////////
	// helpers
	////////////


	/**Get bars' geometry paras (box) for different geometries.
	 * @param {Obj3Type} geom
	 * @param {array} box [number] parameters
	 * @param {number} valHeight bar, cylinder height
	 * @return {array} parsed geometry paras.
	 */
	static threeGeomParas(grid, geom, box, valHeight) {
		switch (geom) {
			case Obj3Type.BOX:
				box[0] = grid.space(box[0]);
				box[1] = valHeight;
				box[2] = grid.space(box[2]);
				break;
			case Obj3Type.Cylinder:
				box[0] = grid.space(box[0]);
				box[1] = grid.space(box[1]);
				box[2] = valHeight;
				break;
			default:
				throw new XError(`Geometry not supported by XBar: ${geom}`);
		}
		return box;
		// var box = Array.from(chart.Obj3.box);
		// if (!box)
		// 	box = [grid.space(0.1), grid.space(0.1), h, 4];
		// else {
		// 	box[0] = grid.space(box[0]);
		// 	box[1] = h;
		// 	box[2] = grid.space(box[2]);
		// 	for (var xl = 3; xl < box.length; xl++ )
		// 		box[xl] = eval(box[xl]);
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

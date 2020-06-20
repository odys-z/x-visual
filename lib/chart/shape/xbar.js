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

	/**
	 * Create label serials.
	 * @param {ECS} ecs
	 * @param {CoordsGrid} grid
	 * @param {object} serials labels configuration, e.g.<pre>
    {
        "pos0": [1, 0, 1],
		"label-offsetssss": [[0, -0.1, 0], [-0.1, 0.5, -0.1], [0, -0.1, 0]],

        "label-desc": "in bar serials, labels always a 2d array of stirngs, with rows' cardinality of 3",
        "labels": [ ["A", "B", "C"],
                    ["X"],
                    ["- I -", "- II -", "- III -"] ],
        "label-colors": ["red", "green", "#24f"],
        "label-font": "4em Arial",
        "label-canvas": {"x": 24, "y": 144, "w": 256, "h": 256},
        "label-box": [20, 20],
        ...
    }</pre>
	 * @param {object.<{font}>} options
	 * @member XBar#serials
	 * @function
	 */
	serials(ecs, grid, serials, options) {
		// var serials = chart.serials;
		var off = serials.pos0;
		var offsets = serials["label-offsets"];
		var l = serials.labels;
		if (!l || l.length === 0) return;

		var colors = serials["label-colors"] || ['white', 'white', 'white'];
		var boxes = serials["label-boxes"];
		var bg_color = serials["label-bg"] || '#003';

		// label at [x, 0, 0]
		var posx = grid.lerposes( [l[0].length, 1, 1],
								  [off[0], 0, 0],
								  offsets ? offsets[0] : undefined );

		var xywh = boxes && boxes[0] ? boxes[0]
				: serials["label-box"] || {x: 0, y: 0, w: 64, y: 24, size: 16};
		for (var x = 0; x < posx[0][0].length; x++) {
			createLabels(ecs, l[0][x], posx[0][0][x], {
				xywh,  bg_color,
				style: colors[0],
				font:  options.font });
		}
		// label at [0, y, 0]
		var posy = grid.lerposes( [1, l[1].length, 1],
								  [0, off[1], 0],
								  offsets ? offsets[1] : undefined );
		xywh = boxes && boxes[1] ? boxes[1]
				: serials["label-box"] || {x: 0, y: 0, w: 64, y: 24, size: 16};
		for (var y = 0; y < posy.length; y++) {
			// createLabels(ecs, l[1][y], posy[y][0][0], {
			// 	xywh, bg_color,
			// 	style: colors[1],
			// 	font: options.font });
		}
		// label at [0, 0, z]
		var posz = grid.lerposes( [1, 1, l[2].length],
								  [0, 0, off[2]],
								  offsets ? offsets[2] : undefined );
		xywh = boxes && boxes[2] ? boxes[2]
				: serials["label-box"] || {x: 0, y: 0, w: 64, y: 24, size: 16};
		for (var z = 0; z < posz[0].length; z++) {
			// createLabels(ecs, l[2][z], posz[0][z][0], {
			// 	xywh, bg_color,
			// 	style: colors[2],
			// 	font: options.font });
		}

		/**
		 * Create label entity.
		 * @param {ECS} ecs
		 * @param {string} lb label text
		 * @param {object} pos position in world
		 * @param {object.<{font}>} options
		 * @return {Entity} label entity
		 * @member XBar#createLabels
		 * @function
		 */
		function createLabels(ecs, lb, pos, options) {
			var xywh = options.xywh;
			var box = [xywh.w + ( xywh.margin || 0 ) * 2, xywh.h + ( xywh.margin || 0 ) * 2];
			var lablx = ecs.createEntity({
				id: `lb-${pos}`,
				Obj3: { geom: xv.XComponent.Obj3Type.PLANE,
						box,
						transform: [ {translate: pos}, {scale: [1, 1, 1]} ],
						mesh: undefined },
				Visual:{vtype: xv.AssetType.mesh,     // makes GpuPickable working
						shader: xv.ShaderFlag.discard // Dynatex is actually a child
					},
				Dynatex: {text: lb,
						xywh,  //: {x: 0, y: 0, w: 24, size: 32},
						dirty: true,
						'bg-color': options.bg_color,
						'v-align': 'middle',
						font: options.font,
						style: options.style
					},
				GpuPickable: {},
				GridElem: {etype: ElemType.text}
			});
			return lablx;
		}
	}

	/**Update x.chart.valuePos
	 * @param {int} tick
	 * @param {array<Entity>} entites
	 * @member XBar#update
	 * @function
	 */
	update(tick, entities) { }

	///////////////////////////////////////////////////////////////////////////
	// helpers
	//
	/**Get bars' geometry paras (box) for different geometries.
	 * @param {Obj3Type} geom
	 * @param {array} box [number] parameters
	 * @param {number} valHeight bar, cylinder height
	 * @return {array} parsed geometry paras.
	 * @member XBar.threeGeomParas
	 * @function
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
	}
}

/**
 * @property {object.<{iffall: array}>} query - query condition: {iffall: ['Bar']}
 * @member XBar#query
 */
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

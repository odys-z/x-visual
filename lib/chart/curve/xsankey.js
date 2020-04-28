
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
 * Subsystem rendering 3d sankey chart
 *
 * @class XSankey
 */
export default class XSankey extends XSys {
	/**
	 * create sankey objects
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {array} vectors the high dimensional vectors.<br>
	 * deprecated? XSankey assumes the last dimension as the y scale value as in
	 * original 2d sankey chart.
	 * @constructor XSankey
	 */
	constructor(ecs, options, json, vectors) {
		super(ecs);
		this.logged = false;
		this.ecs = ecs;
		this.cmds = {click: undefined};

		/**extruding coordingate index
		 * @member XSankey#extrudingCoord
		 * @property {int} extrudingCoord - coordinate index
		 */
		this.extrudingCoord = -1;

		/**Bars' pivoting (extruding) positions (grid index).
		 * @member XSankey#pivotings
		 * @property {array<array>} pivotings - major index: vector index;<br>
		 * minor index: coord index
		 */
		this.pivotings = undefined;

		/**Bars' pivoting (extruding) positions (grid index).
		 * @member XSankey#barmap
		 * @property barmap */
		this.barmap = undefined;

		/**vectors
		 * @member XSankey#vectors
		 * @property vectors */
		this.vectors = vectors;

		ecs.registerComponent('Sankey', Sankey);

		if (!json)
			throw new XError('XSankey can only been created synchronously with json data for initializing');

		if (ecs) {
			// debug1(ecs, options, json, vectors);
			if (!x.chart || !x.chart.grid) {
				this.grid = new CoordsGrid(options.chart, json);
				x.chart = Object.assign(x.chart, {grid: this.grid});
			}
			else this.grid = x.chart.grid;

			var {barmap, defs} = XSankey.sankey(ecs, this.grid, json, options);
			this.barmap = barmap;

			if (json.pivotings)
				this.setPivoting(json.extruding.coord, json.extruding.pivoting);
		}
		// else testing?

		this.camera = x.xcam.XCamera.cam;
	}

	/**Setup sankey chart with data.
	 * @param {ECS} ecs
	 * @param {CoordsGrid} grid
	 * @param {object} pivotings<br>
	 * @param {object} json where<br>
	 * json.grid-space<br>
	 * json.coordss: array of {label, range}, where range is the discret value serial.<br>
	 * json.vectors: array of hi-dimensional vectors, with last dimesion as value.
	 * @param {object} options<br>
	 * texture: string, bar texture, e.g. './tex/byr0.png', default is ram texture<br>
	 * geom: Obj3Type<br> otpinal, default Cylinder<br>
	 * box: geometry parameters, [radiusTop, radiusBottom, height(ignored), radialSegments = 4]
	 * @return {object} {barmap, defs} where <br>
	 * barmap: map of [coord-index => [bar-entity]]<br>
	 * defs: array of entity definition of sankey bars
	 *
	 * @member XSankey.sankey
	 * @function
	*/
	static sankey( ecs, grid, json, options ) {
		var geom = options.geom === undefined ?
					Obj3Type.Cylinder : options.geom;
		var asset = json.texture || options.texture;

		var vectors = json.vectors;
		var scl = json["grid-space"] || 10;
		var ixVal = json.coordinates.length;

		var defs = [];
		var barmap = new Array(json.bars.length);

		if (Array.isArray(json.geometry))
			// handle inconvenient of json file - turn string like 'Math.PI' into number
			for (var bx = 0; bx < json.geometry.length; bx++) {
				if (typeof json.geometry[bx] === 'string')
					json.geometry[bx] = eval(json.geometry[bx]);
			}

		for (var vidx = 0; vidx < json.bars.length; vidx++) {
			var vect =  json.bars[vidx];
			barmap[vidx] = new Array(vect.length);
			for (var bidx = 0; bidx < vect.length; bidx++) {
				// bar = [ coord-idx, enum-val, h, y0 ], e.g. [0, 1, 6, 15]
				var bar = vect[bidx];
				// init pos: x, y, z=0
				var {pos0, h} = grid.coordPos( bar );

				// radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
				var box = Array.from(json.geometry);
				if (!box)
					box = [grid.space(0.1), grid.space(0.1), h, 4];
				else {
					box[0] = grid.space(box[0]);
					box[1] = grid.space(box[1]);
					box[2] = h;
				}

				var animSeqs = [];
					animSeqs.push( [{
						mtype: xv.XComponent.AnimType.ALPHA,
						paras: {
							start: Infinity,
							duration: 0.3,
							alpha: [0.3, 0.9] }
					}] );
					animSeqs.push( [{
						mtype: xv.XComponent.AnimType.POSITION,
						paras: { // start with some animation?
							start: 0,
							duration: 0.8,
							// set tween object for extruding animation
							translate: [ [0, 0, 0], [0, 0, 0] ] }
					}] );
					animSeqs.push( [{
						mtype: xv.XComponent.AnimType.POSITION,
						paras: {
							start: Infinity,
							duration: 0.7,
							translate: [ [0, 0, 0], [0, 0, 0] ] }
					}] );

				var bar = ecs.createEntity({
					id: skUId(),
					Obj3: { geom,
							// transform: [{translate: [-1 * scl * 4, y11, 0]}],
							transform: [{ translate: pos0 }],
							box },
					Visual:{vtype: AssetType.mesh,
							asset},
					Sankey:{vecIx: vidx,
							coordIx: bidx,
							translated: [0, 0, 0],
							onOver: 0,        // tweens[0], blinking
							onClick:[1, 2] }, // forth & back
					GpuPickable: {},
					ModelSeqs: { script: animSeqs },
					CmpTweens: {}
				});

				barmap[vidx][bidx] = bar;
			}
		}
		return {barmap, defs};
	}

	update(tick, entities) {
		if ( x.xview.flag < 0 ) {
			return;
		}

		this.cmds.click = false;
		for ( var cmd of x.xview.cmds ) {
			if ( cmd.code === 'mouse' && cmd.cmd === 'mouseup' )
				this.cmds.click = true;
				break;
		}

		if ( !this.cmds.click )
			return;

		var e = x.xview.picked;
		if (e && e.GpuPickable && e.GpuPickable.picked
			&& e.Sankey)
			this.extrudextr(e, entities);
	}

	/** Kept until delete branch temp-sankey-debug1 */
	onMouse(cmd, e) {
		if (e.CmpTweens) {
			var twCmd;
			switch (cmd) {
				case 'mousemove':
					twCmd = e.Sankey.onOver;
					return true;
				case 'click':
				case 'mouseup':
					twCmd = e.Sankey.onClick;
					if (twCmd !== undefined)
						sankeyClick(e, twCmd);
					return true;
				default:
			}
		}
		else {
			if (!this.logged) {
				console.error('XSankey.onMouse(): No such tween. eid: ', e.id);
				this.logged = true;
			}
		}
		return false;
	}

	/**Extrude / de-extrude the selected coordinates.
	 *
	 * **Note:** In x-visual 1.0, all sankey bars can only move back and forth,
	 * without moving elsewhere, e.g. from z = 1 to z = 2.
	 *
	 * TODO ignore new translate when tweening
	 * @param {Sankey} e the selected entity
	 * @member XSankey.extrudextr
	 * @function
	 */
	extrudextr(e, entities) {
		if ( this.extrudingCoord >= 0 ) {
			// de-extruding
			// var vix = this.pivotings[this.extrudingCoord];
			// var extrudeds = this.barmap[this.extrudingCoord];
			for (const en of entities) {
				// if ( en.Sankey && en.Sankey.pivotIx[2] > 0 )
				if ( en.Sankey && !vec3.eq(en.Sankey.translated, [0, 0, 0]) )
					en.CmpTweens.startCmds.push(2);
			}
			// TODO if not now, but when ?
			this.extrudingCoord = -1;
		}
		else {
			// extrude = this.pinvotings[this.extrudingCoord]
			this.getPivotings(e.Sankey, (sys, extrude) => {
				// var c = extrude.coordIx;
				sys.extrudingCoord = extrude.coord;
				var p = extrude.pivoting;
				for (const e of entities) {
					var sk = e.Sankey;
					// some bars may not extrudable
					if (sk.vecIx < p.length && sk.coordIx < p[sk.vecIx].length) {
						var grdx = p[sk.vecIx][sk.coordIx];
						var bufArr = e.Sankey.translated;
						var val = sys.vectors[sk.vecIx][sys.vectors[sk.vecIx].length - 1];
						sys.grid.extrudePos( val, grdx, bufArr );
						MorphingAnim.changePosition( e.CmpTweens.tweens[1], bufArr );

						vec3.mulArr( bufArr, -1, bufArr );
						MorphingAnim.changePosition( e.CmpTweens.tweens[2], bufArr );

						e.CmpTweens.startCmds.push(1);
					}
				}
			});
		}
	}

	setPivoting(extruding) {
		// TODO load online data
		if (!this.pivotings)
			this.pivotings = new Map();
		this.pivotings.set(extruding.coord, extruding);
	}

	getPivotings( sankey, onload ) {
		// TODO manage buffer
		if ( this.pivotings && this.pivotings.has(sankey.coordIx) )
			onload( this, this.pivotings.get(sankey.coordIx) );
	}

}

XSankey.query = {
	any: ['Sankey']
};

function sankeyClick(e, twCmd) {
	if (e.CmpTweens !== undefined) {
		if (Array.isArray(twCmd)) {
			if (!e.Sankey.cmd)
				e.Sankey.cmd = {};
			if (e.Sankey.cmd.click === twCmd[0])
				e.Sankey.cmd.click = twCmd[1];
			else
				e.Sankey.cmd.click = twCmd[0];
		}
		e.CmpTweens.startCmds.push(e.Sankey.cmd.click);
	}
}

/**Create some sankey bars.
 * Should been kept. works together with update() in branch temp-sankey-debug1
 * @memberof XSankey
 */
function debug1(ecs, options, json, vectors) {
	var scl = options.xscale || 20;
	var ixVal = json.coordinates.length;

	var h11 = vectors[0][ixVal] * scl;
	var h10 = vectors[1][ixVal] * scl;
	var y11 = h10 + h11/2;
	var y10 = h10/2;
	var z1 = scl * 8;
	var x1 = scl;

	var n11 = ecs.createEntity({
		id: 'n11',
		Obj3: { geom: Obj3Type.Cylinder,
				transform: [{translate: [-1 * scl * 4, y11, 0]}],
				// radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
				box: [10, 10, h11] },
		Visual:{vtype: AssetType.mesh,
				asset: '../../assets/tex/byr0.png'},
		Sankey:{
			onOver: 0,        // tweens[0], blinking
			onClick:[1, 2]    // forth & back
		},
		GpuPickable: {pickid: 4},
		ModelSeqs: {script: [
			 [{ mtype: xv.XComponent.AnimType.ALPHA,
				paras: {
					start: Infinity,
					duration: 0.3,
					alpha: [0.3, 0.9]
			 } }],
			 [{ mtype: xv.XComponent.AnimType.POSITION,
				paras: {
					start: Infinity,
					duration: 1.1,
					translate: [[0., 0, 0.], [0, -h10, z1]]
			 } }],
			 [{ mtype: xv.XComponent.AnimType.POSITION,
				paras: {
					start: Infinity,
					duration: 1.2,
					translate: [[0, 0, 0], [0, h10, -z1]],
			 } }],
		  ]},
		CmpTweens: {}
	});

	var n10 = ecs.createEntity({
		id: 'n10',
		Obj3: { geom: Obj3Type.Cylinder,
				transform: [{translate: [-1 * scl * 4, y10, 0]}],
				box: [10, 10, h10] },
		Visual:{vtype: AssetType.mesh,
			   },
		GpuPickable: {pickid: 3},
		Sankey:{onOver: 0},
		ModelSeqs: {script: [
			 [{ mtype: xv.XComponent.AnimType.ALPHA,
				paras: {
					start: Infinity,
					duration: 1.2,
					alpha: [0.3, 0.9]
			 }}],
		  ]},
		CmpTweens: {}
	});

	var h01 = vectors[2][ixVal] * scl;
	var h00 = vectors[3][ixVal] * scl;
	var y01 = h01/2 + h00;
	var y00 = h00/2;
	var n01 = ecs.createEntity({
		id: 'n01',
		Obj3: { geom: Obj3Type.Cylinder,
				transform: [{translate: [0, y01, 0]}],
				box: [10, 10, h01] },
		Visual:{vtype: AssetType.mesh,
				asset: '../../assets/tex/byr0.png'},
		Sankey:{
			onOver: 0,	   // tweens[0], alpha
			onClick:[1, 2]   // forth & back
		},
		GpuPickable: {pickid: 2},
		ModelSeqs: {script: [
			 [{ mtype: xv.XComponent.AnimType.ALPHA,
				paras: {
					start: Infinity,
					duration: 0.32,
					alpha: [0.3, 0.9]
			 } }],
			 [{ mtype: xv.XComponent.AnimType.POSITION,
				paras: {
					start: Infinity,
					duration: 1.12,	// seconds
					// translate: [[0, 0, 0.], [0, -y01 + h01/2, z1]],
					translate: [[0, 0, 0.], [0, -h00, z1]],
			 }}],
			 [{ mtype: xv.XComponent.AnimType.POSITION,
				paras: {
					start: Infinity,
					duration: 1.22,
					translate: [[0, 0, 0], [0, h00, -z1]],
			 }}],
		  ]},
		CmpTweens: {}
	});

	var n00 = ecs.createEntity({
		id: 'n00',
		Obj3: { geom: Obj3Type.Cylinder,
				transform: [{translate: [0, y00, 0]}],
				box: [10, 10, h00, 20] },
		Visual:{vtype: AssetType.mesh,
			   },
		GpuPickable: {pickid: 1},
		Sankey:{onOver: 0},
		ModelSeqs: {script: [
			 [{ mtype: xv.XComponent.AnimType.ALPHA,
				paras: {
					start: Infinity,
					duration: 1.23,
					alpha: [0.3, 0.9]
			 }}],
		  ]},
		CmpTweens: {}
	});
}

/**For generating sankey element uuid.
 * @memberof XSankey
 */
var skuuid = 0;

/**Get a uuid.
 * @memberof XSankey */
function skUId() {
	return `sk-${++skuuid}`;
}


import * as ECS from '../../../packages/ecs-js/index'
import {x} from '../../xapp/xworld'

import XSys from '../../sys/xsys'
import ChartGrid from '../../xmath/chartgrid'
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
	 * @constructor
	 */
	constructor(ecs, options, json, vectors) {
		super(ecs);
		this.logged = false;
		this.ecs = ecs;
		this.cmd = [];

		ecs.registerComponent('Sankey', Sankey);

		if (!json)
			throw new XError('XSankey can only been created synchronously with json data for initializing');

		if (ecs) {
			this.grid = new ChartGrid(json);
			XSankey.sankey(ecs, this.grid, json, options);
			// debug1(ecs, options, json, vectors);
		}

		this.camera = x.xcam.XCamera.cam;
	}

	/**Setup sankey chart with data.
	 * @param {ECS} ecs
	 * @param {ChartGrid} grid
	 * @param {object} pivotings<br>
	 * @param {object} json where<br>
	 * json.grid-space<br>
	 * json.coordss: array of {lable, range}, where range is the discret value serial.<br>
	 * json.vectors: array of hi-dimensional vectors, with last dimesion as value.
	 * @param {object} options<br>
	 * texture: string, bar texture, e.g. './tex/byr0.png', default is ram texture<br>
	 * geom: Obj3Type<br> otpinal, default Cylinder<br>
	 * box: geometry parameters, [radiusTop, radiusBottom, height(ignored), radialSegments = 4]
	 * @return {array} entity definition of sankey bars
	 *
	 * @member XSankey.sankey
	 * @function
	*/
	static sankey( ecs, grid, json, options ) {
		var geom = options.geom === undefined ?
					Obj3Type.Cylinder : options.geom;
		var asset = options.texture;

		var vectors = json.vectors;
		var scl = json["grid-space"] || 10;
		var ixVal = json.coordinates.length;

		var defs = [];

		for (var vidx = 0; vidx < json.bars.length; vidx++) {
			var vect =  json.bars[vidx];
			for (var bidx = 0; bidx < vect.length; bidx++) {
				// bar = [ coord-idx, enum-val, h, y0 ], e.g. [0, 1, 6, 15]
				var bar = vect[bidx];
				// init pos: x, y, z=0
				var pos0 = grid.pos( [bar[0], bar[1], 0] );
				// var h = vectors[b.v][ixVal] * scl;
				var h = grid.barHeight( bar[2] );

				// radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
				var box = [ options.box ? options.box[0] : 10,
							options.box ? options.box[1] : 10,
							h,
							options.box && options.box.length > 3 ? options.box[3] : 4 ];

				// var yex = grid.getExtrudePos(v.g);
				// var animSeqs = new Array(3);
				// for (var yi = 0; yi < 3; yi++) {
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
				// }
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
							onOver: 0,        // tweens[0], blinking
							onClick:[1, 2] }, // forth & back
					GpuPickable: {},
					ModelSeqs: { script: animSeqs },
					CmpTweens: {}
				});
			}
		}
	}

	static setPivoting(grid, entities, pivotings, bufArr) {
		// var buf = [0, 0, 0];
		for (const e of entities) {
			var sk = e.Sankey;
			if (sk) {
				var grdx = pivotings[sk.vecIx][sk.coordIx];
				grid.pos( grdx, bufArr );
				MorphingAnim.changePosition( e.CmpTweens[0], bufArr );

				vec3.mulArr( pos, -1, bufArr );
				MorphingAnim.changePosition( e.CmpTweens[1], bufArr );
			}
		}
	}

	update(tick, entities) {
		if (x.xview.flag > 0) {
			this.cmd.push(...x.xview.cmds);
		}
		for (var cmd of this.cmd) {
			if (cmd.code === 'mouse' && e.GpuPickable && e.GpuPickable.picked
				&& this.onMouse(cmd.cmd, e))
				break;
		}

		for (const e of entities) {

		}
		this.cmd.splice(0);
	}

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
}

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

XSankey.query = {
	any: ['Sankey']
};

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

/**For generating Pie object uuid.
 * @memberof XSankey
 */
var skuuid = 0;

/**Get a uuid.
 * @memberof XSankey */
function skUId() {
	return `sk-${++skuuid}`;
}

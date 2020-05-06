import * as ECS from '../../packages/ecs-js/index'

import XSys from '../sys/xsys'

import {XError} from '../xutils/xcommon'
import {vec3} from '../xmath/vec';
import {CoordsGrid} from '../xmath/chartgrid'
import {Axes} from '../component/ext/chart';
import {Obj3Type} from '../component/obj3';
import {AssetType, ShaderFlag} from '../component/visual';

/**
 * Subsystem rendering 3d chart axises, including data serials' label.<br>
 * @class Axisys
 */
export default class Axisys extends XSys {

	/**
	 * create axis objects
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {array} json the chart section.
	 * @constructor Axisys
	 */
	constructor(ecs, options, jchart) {
		super(ecs);
		this.logged = false;
		this.ecs = ecs;
		this.cmd = [];

		ecs.registerComponent('Axes', Axes);

		if (!jchart)
			throw new XError('Axis can only been created synchronously with json data for initializing');

		if (ecs) {
			Axisys.axis(ecs, options, jchart);
		}
	}

	/** Generate x, y, z axes.
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {object} jchart json's chart section, can be used to create {@link CoordsGrid}
	 * @member Axisys.axis
	 * @function
	 */
	static axis(ecs, options, jchart) {
		var grid = options.grid ? options.grid : new CoordsGrid(jchart);
		options.grid = grid;
		var s = grid.space(vec3.add(jchart.grid, 1));
		var transAxes = [];

		var _x = ecs.createEntity({
			id: '_x',
			Obj3: { geom: Obj3Type.NA,
					box: [] },
			Visual:{vtype: AssetType.Arrow,
					paras: {
						dir: [1, 0, 0],
						origin: [0, 0, 0],
						length: s[0],
						color: 0xff0000,
						headLength: s[0] * 0.05 } },
			Axes: {}
		});
		transAxes.push( [s[0], 0, 0] );

		var _y = ecs.createEntity({
			id: '_y',
			Obj3: { geom: Obj3Type.NA,
					box: [] },
			Visual:{vtype: AssetType.Arrow,
					paras: {
						dir: [0, 1, 0],
						origin: [0, 0, 0],
						length: s[1],
						color: 0x00ff00,
						headLength: s[1] * 0.05 } },
			Axes: {}
		});
		transAxes.push( [0, s[1], 0] );

		var _z = ecs.createEntity({
			id: '_z',
			Obj3: { geom: Obj3Type.NA,
					box: [] },
			Visual:{vtype: AssetType.Arrow,
					paras: {
						dir: [0, 0, 1],
						origin: [0, 0, 0],
						length: s[2],
						color: 0x0000ff,
						headLength: s[2] * 0.05 } },
			Axes: {}
		});
		transAxes.push( [0, 0, s[2]] );

		if ( Array.isArray(jchart.axes) ) {
			for (var xx = 0; xx < jchart.axes.length; xx++) {
				var _txt = ecs.createEntity({
					id: '|-' + xx,
					Obj3: { geom: Obj3Type.PLANE,
							transform: [{translate: transAxes[xx]}],
							box: [32, 32] },
					Visual:{vtype: AssetType.mesh_basic,
							},
					Dynatex: {text: jchart.axes[xx],
							// x = 128 / 2 - 32, y = 128/2, wh = obj3 size?
							xywh: {x: 0, y: 64, w: 256, h: 256},
							style: 'white',
							dirty: true}
				});
			}
		}

	}
}

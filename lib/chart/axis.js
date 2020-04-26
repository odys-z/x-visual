import * as ECS from '../../packages/ecs-js/index'

import XSys from '../sys/xsys'

import {XError} from '../xutils/xcommon'
import {vec3} from '../xmath/vec';
import {CoordsGrid} from '../xmath/chartgrid'
import {Axes} from '../component/ext/chart';
import {Obj3Type} from '../component/obj3';
import {AssetType, ShaderFlag} from '../component/visual';

/**
 * Subsystem rendering 3d chart axises.<br>
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
	 * @param {object} json
	 * @member Axisys.axis
	 * @function
	 */
	static axis(ecs, options, json) {
		var grid = options.grid ? options.grid : new CoordsGrid(json);
		options.grid = grid;
		var s = grid.space(vec3.add(json.grid, 1));

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
	}
}

import * as ECS from '../../packages/ecs-js/index'

import XSys from '../sys/xsys'

import {XError} from '../xutils/xcommon'
import {vec3} from '../xmath/vec';
import {GridElem} from '../component/ext/chart';
import {Obj3Type} from '../component/obj3';
import {AssetType, ShaderFlag} from '../component/visual';

/**
 * Subsystem manage 3d chart's auxillaries.<br>
 * @class GridVisuals
 */
export default class GridVisuals extends XSys {

	/**
	 * create chart world
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {array} json the chart section.
	 * @constructor GridVisuals	 */
	constructor(ecs, options, jchart) {
		super(ecs);
		this.logged = false;
		this.ecs = ecs;
		this.cmd = [];

		ecs.registerComponent('GridElem', GridElem);

		if (!jchart)
			throw new XError('ChartWorld can only been created synchronously with json data for initializing');

		if (ecs) {
			GridVisuals.elems(ecs, options, jchart);
		}
	}

	/** Generate chart space elements.
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {object} json
	 * @member GridVisuals.elems
	 * @function
	 */
	static elems(ecs, options, json) {
		var grid = options.grid ? options.grid : new CoordsGrid(json);
		options.grid = grid;
		var s = grid.space(vec3.add(json.grid, 1));

		// x, y, z line with value label
		var xyzLine = ecs.createEntity({
			id: 'xyz-line',
			Obj3: { geom: Obj3Type.PointSect,
					box: [] },
			Visual:{vtype: AssetType.DynaSects,
					paras: {
						dir: [1, 0, 0],
						origin: [0, 0, 0],
						length: s[0],
						color: 0xff0000,
						headLength: s[0] * 0.05 } },
			GridElem: {}
		});

		var xyzPlane = ecs.createEntity({
			id: 'xyz-plane',
			Obj3: { geom: Obj3Type.BOX,
					box: [] },
			Visual:{vtype: AssetType.mesh,
					paras: {
						dir: [1, 0, 0],
						origin: [0, 0, 0],
						length: s[0],
						color: 0xff0000,
						headLength: s[0] * 0.05 } },
			GridElem: {}
		});
	}
}

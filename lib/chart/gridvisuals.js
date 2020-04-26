import * as ECS from '../../packages/ecs-js/index'

import XSys from '../sys/xsys'

import {XError} from '../xutils/xcommon'
import {vec3} from '../xmath/vec';
import {CoordsGrid} from '../xmath/chartgrid'
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
	 * options.chart: json chart section
	 * @param {array} json visuas configuration.
	 * @constructor GridVisuals	 */
	constructor(ecs, options, json) {
		super(ecs);
		this.logged = false;
		this.ecs = ecs;
		this.cmd = [];

		ecs.registerComponent('GridElem', GridElem);

		if (!options.chart)
			throw new XError('GridVisuals can only been created synchronously with json data (options.chart) for initializing');

		if (ecs) {
			GridVisuals.elems(ecs, options, json);
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
		var grid = options.grid ? options.grid : new CoordsGrid(options.chart);
		options.grid = grid;
		var s = grid.space(vec3.add(options.chart.grid, 1));

		// x, y, z line with value label
		var idxline = options.lines;
		var xyzLine = ecs.createEntity({
			id: 'xyz-line',
			Obj3: { geom: Obj3Type.PointSect,
					box: [] },
			Visual:{vtype: AssetType.DynaSects,
					paras: {
						sects:[[[1, 1, 1], [0, 1, 1]],
							   [[1, 1, 1], [1, 0, 1]],
							   [[1, 1, 1], [1, 1, 0]]],
						origin: [0, 0, 0],
						scale: s,
						color: idxline && idxline.color || 0xcc00ff } },
			GridElem: {}
		});

		var xyzPlane = ecs.createEntity({
			id: 'xyz-plane',
			Obj3: { geom: Obj3Type.BOX,
					box: s },
			Visual:{vtype: AssetType.mesh,
					paras: {
						origin: [0, 0, 0],
						color: 0x00ff00 } },
			GridElem: {}
		});
	}
}

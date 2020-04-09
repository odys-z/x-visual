import * as ECS from '../../packages/ecs-js/index'

import XSys from '../sys/xsys'
import ChartGrid from '../xmath/chartgrid'

import {XError} from '../xutils/xcommon'
import {Obj3Type} from '../component/obj3';
import {AssetType, ShaderFlag} from '../component/visual';

/**
 * Subsystem rendering 3d chart axises
 *
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

		// ecs.registerComponent('Axis', Axis);

        if (!jchart)
            throw new XError('Axis can only been created synchronously with json data for initializing');

        if (ecs) {
            debugAxis(ecs, options, jchart);
        }
    }
}

/** Generate debugging axis.
 * @param {ECS} ecs
 * @param {object} options
 * @param {object} json
 * @member Axisys.debugAxis
 * @function
 */
function debugAxis(ecs, options, json) {
	var grid = options.grid ? options.grid : new ChartGrid(json);
	options.grid = grid;
	var s = grid.scale;

    var _x = ecs.createEntity({
        id: '_x',
        Obj3: { geom: Obj3Type.NA,
                box: [] },
        Visual:{vtype: AssetType.arrow,
				paras: {
					dir: [1, 0, 0],
					origin: [0, 0, 0],
					length: s[0],
					color: 0xff0000,
					headLength: s[0] * 0.05 } },
    });

    var _y = ecs.createEntity({
        id: '_y',
        Obj3: { geom: Obj3Type.NA,
                box: [] },
        Visual:{vtype: AssetType.arrow,
				paras: {
					dir: [0, 1, 0],
					origin: [0, 0, 0],
					length: s[1],
					color: 0x00ff00,
					headLength: s[1] * 0.05 } },
    });

    var _z = ecs.createEntity({
        id: '_z',
        Obj3: { geom: Obj3Type.NA,
                box: [] },
        Visual:{vtype: AssetType.arrow,
				paras: {
					dir: [0, 0, 1],
					origin: [0, 0, 0],
					length: s[2],
					color: 0x0000ff,
					headLength: s[2] * 0.05 } },
    });
}

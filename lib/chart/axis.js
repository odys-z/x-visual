import * as ECS from '../../packages/ecs-js/index'
import XSys from '../sys/xsys'
import {Obj3Type} from '../component/obj3';
import {Axis} from '../component/ext/chart'
import {AssetType, ShaderFlag} from '../component/visual';

/**
 * Subsystem rendering 3d chart axises
 *
 * @class Axis
 */
export default class Axisys extends XSys {

	/**
	 * create axis objects
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {array} json the vectors.
	 * @constructor
	 */
	constructor(ecs, options, json, vectors) {
        super(ecs);
        this.logged = false;
        this.ecs = ecs;
        this.cmd = [];

		// ecs.registerComponent('Axis', Axis);

        if (!json)
            throw new XError('Axis can only been created synchronously with json data for initializing');

        if (ecs) {
            debugAxis(ecs, options, json);
        }
    }

}

function debugAxis(ecs, opitons, json) {
	var space = [];
	for (var i = 0; i < 3; i++) {
	 	space.push( json.grid[i] * json["grid-space"] );
	}
	var al = space[0] * 0.05;

    var _x = ecs.createEntity({
        id: '_x',
        Obj3: { geom: Obj3Type.NA,
                box: [] },
        Visual:{vtype: AssetType.arrow,
				paras: {
					dir: [1, 0, 0],
					origin: [0, 0, 0],
					length: space[0],
					color: 0xff0000,
					headLength: al } },
    });

    var _y = ecs.createEntity({
        id: '_y',
        Obj3: { geom: Obj3Type.NA,
                box: [] },
        Visual:{vtype: AssetType.arrow,
				paras: {
					dir: [0, 1, 0],
					origin: [0, 0, 0],
					length: space[0],
					color: 0x00ff00,
					headLength: al } },
    });

    var _z = ecs.createEntity({
        id: '_z',
        Obj3: { geom: Obj3Type.NA,
                box: [] },
        Visual:{vtype: AssetType.arrow,
				paras: {
					dir: [0, 0, 1],
					origin: [0, 0, 0],
					length: space[0],
					color: 0x0000ff,
					headLength: al } },
    });
}

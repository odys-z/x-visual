/** @namespace xv.ecs.comp.view */

import * as ECS from '../../packages/ecs-js/index';

/** - Component
 *
 * Nothing but a component indicating only an input sys should use the entity.
 * @memberof xv.ecs.comp.view
 */
const Input = {
    properties: {
        tick: 0     // tick at which this Input is updating
    }
};

/** - Component
 * @memberof xv.ecs.comp.view
 */
const UserCmd = {
  properties: {
    cmds: [ { code: '', cmd: '', flag: 0, e: {} } ]
  }
};

/** - Component
 * @memberof xv.ecs.comp.view
 */
const CmdFlag = {
	properties: {
		flag: 0
	}
}

/** - Component
 * @memberof xv.ecs.comp.view
 */
const XCamera = {
	properties: {
		pos: [0, 0, 0],	// vec3
		cam: {},	// THREE.camera
	}
};

export {Input, UserCmd, CmdFlag, XCamera};

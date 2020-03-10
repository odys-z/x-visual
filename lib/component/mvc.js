/** @namespace xv.ecs.comp */

import * as ECS from '../../packages/ecs-js/index';

/* nothing but a component indicating only an input sys should use the entity.
 */
const Input = {
    properties: {
        tick: 0     // tick at which this Input is updating
    }
};

const UserCmd = {
  properties: {
    cmds: [ { code: '', cmd: '', flag: 0, e: {} } ]
  }
};

const CmdFlag = {
	properties: {
		flag: 0
	}
}

const XCamera = {
	properties: {
		pos: [0, 0, 0],	// vec3
		cam: {},	// THREE.camera
	}
};

export {Input, UserCmd, CmdFlag, XCamera};

/** @module xv.ecs.comp */

import * as ECS from '../../packages/ecs-js/index';

const UserCmd = {
  properties: {
    cmds: [ { code: '', cmd: '', flag: 0 } ]
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

export {UserCmd, CmdFlag, XCamera};

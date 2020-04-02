import * as ECS from '../../packages/ecs-js/index';

/** - Component
 *
 * Nothing but a component indicating only an input sys should use the entity.
 * @type Input
 */
const Input = {
    properties: {
        tick: 0     // tick at which this Input is updating
    }
};

/** - Component
 * @deprecated
 * @type UserCmd
 */
const UserCmd = {
	properties: {
		cmds: [ { code: '', cmd: '', flag: 0, e: {} } ]
	}
};

const View = {
	properties: {
		ref: undefined
	}
}

/** - Component
 */
const CmdFlag = {
	properties: {
		flag: 0
	}
}

/** - Component
 * @type XCamera
 */
const XCamera = {
	properties: {
		pos: [0, 0, 0],	// vec3
		cam: {},	// THREE.camera
	}
};

export {Input, UserCmd, XCamera};

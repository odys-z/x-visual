import * as ECS from '../../packages/ecs-js/index';

/** - Component
 *
 * Nothing but a component indicating only an input sys should use the entity.
 * Notes 0.2.1: reserved for multiple views
 * @type Input
 * @memberof XComponent
 */
const Input = {
    properties: {
        tick: 0,         // tick at which this Input is updating
        view: undefined  // only default view ('xview') are supported currently
    }
};

/** - Component
 * @deprecated
 * @type UserCmd
 * @memberof XComponent
 */
const UserCmd = {
    properties: {
        cmds: [ { code: '', cmd: '', flag: 0, e: {} } ]
    }
};

/** - Component
 * @deprecated
 * @type CmdFlag
 * @memberof XComponent
 */
const CmdFlag = {
    properties: {
        flag: 0
    }
}

/** Camera Component
 * @deprecated
 * @type XCamera
 * @memberof XComponent
 */
const XCamera = {
    properties: {
        pos: [0, 0, 0], // vec3
        cam: {},        // THREE.camera
    }
};

export {Input, UserCmd, XCamera};

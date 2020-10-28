import * as ECS from '../../packages/ecs-js/index';

/** - Component
 *
 * Nothing but a component indicating only an input sys should use the entity.
 * Notes 0.2.1: reserved for multiple views
 * @class Input
 * @memberof XComponent
 */
const Input = {
    properties: {
        tick: 0,         // tick at which this Input is updating
        view: undefined  // only default view ('xview') are supported currently
    }
};

/**Camera controls that {@link XWorld} supported for main scene.
 * @enum {int}
 * @memberof XComponent
 */
const CameraType = {
    /** default camera ctrl */
    Camctrl: 1,
    /** map ctrl */
    Mapctrl: 2,
    /** orbit ctrl */
    Orbitctrl: 3,
};

/** - Component
 * @deprecated
 * @class UserCmd
 * @memberof XComponent
 */
const UserCmd = {
    properties: {
        cmds: [ { code: '', cmd: '', flag: 0, e: {} } ]
    }
};

/** - Component
 * @deprecated
 * @class CmdFlag
 * @memberof XComponent
 */
const CmdFlag = {
    properties: {
        flag: 0
    }
}

/** Camera Component
 * @deprecated
 * @class XCamera
 * @memberof XComponent
 */
const XCamera = {
    properties: {
        pos: [0, 0, 0], // vec3
        cam: {},        // THREE.camera
    }
};

export {CameraType, Input, UserCmd, XCamera};

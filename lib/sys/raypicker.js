import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index';
import {x} from '../xapp/xworld';
import {ramTexture} from '../xutils/xcommon';

const any = ['RayCastee'];

/**Uuid for picking object's id, used by RayPicker.
 * @class rayuuid */
const rayuuid = {
	uuid: 1,
	/**
	 * Get an increase pickable's uuid.
	 * @property inc
	 */
	inc: function () {
		return rayuuid.uuid++;
	},
}

/**Helper for picking scene object, using ray casting.<br>
 * Can only work with Obj3.mesh.
 *
 * <a href='https://threejsfundamentals.org/threejs/lessons/threejs-picking.html'>Tutorial</a>
 * @class RayPicker
 */
export default class RayPicker extends ECS.System {
	/** If any entity has a GpuPickable component, add it to my picking scene.
	 * @constructor RayPicker
	 */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;

		this.initMyPickings(x.ecs, this.scene);
	}

	/** If any entity has a GpuPickable component, add it to my picking scene.
	 * @param {ECS.ECS} ecs
	 * @param {ECS.Scene} scene
	 * @member RayPicker#initMyPickings
	 * @function
	 */
	initMyPickings(ecs, scene) {
		// var scn = scene; // picking scene
		this.idToObject = {0: undefined};

		}
	}

	/** If mouse moved, try pick the object
	 * @param {number} tick
	 * @param {array<Entity>} entities
	 * @member RayPicker#update
	 * @function
	 */
	update(tick, entities) {
		var flag = false;

		if (x.xview.flag === 0 || entities.size === 0)
			return;

	}

	/**Picking test, check is the randered object?
	 * @param {object} canvPos canvas position, in pixel
	 * @param {THREE.Camera} camera
	 * @member RayPicker#pickTest
	 * @function
	 */
	pickTest(canvPos, camera) {
	}
}

RayPicker.query = {any};

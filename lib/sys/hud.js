import * as ECS from '../../packages/ecs-js/index';
import * as THREE from 'three';

/**
 * Displaying HUD {@link Layers}.
 * @class Hud
 */
export default class Hud extends ECS.System {

	/**
	 * @constructor Hud
	 */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
		this.camera = x.xcam.XCamera.cam;
	}

	/**
	 * @param {int} tick
	 * @param {array<Entity>} entities
	 * @member Hud#update
	 * @function
	 */
	update(tick, entities) {
		for (const hud of entities) {
			if (hud.HudGroup) {
				// Thrender has done this
				// hud.Obj3.mesh.matrixAutoUpdate = true;
				hud.Obj3.mesh.position.copy(this.camera.position);
				hud.Obj3.mesh.position.z -= 100;
				hud.Obj3.mesh.quaternion.copy(this.camera.quaternion);
			}
		}
	}
}

Hud.query = {any: ['HudGroup', 'HudWedget']};

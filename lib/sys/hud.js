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
		this.xview = x.xview;
	}

	/**
	 * @param {int} tick
	 * @param {array<Entity>} entities
	 * @member Hud#update
	 * @function
	 */
	update(tick, entities) {
		if (this.xview.flag > 0)
			for (const hud of entities) {
				if (hud.HudGroup) {
					var m = hud.Obj3.mesh;
					m.position.copy(this.camera.position);
					m.position.z -= 100;
					m.quaternion.copy(this.camera.quaternion);
					m.updateMatrix();
				}
			}
	}
}

Hud.query = {any: ['HudGroup', 'HudWedget']};

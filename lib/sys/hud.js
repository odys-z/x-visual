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
		this.filter = new Layers(1);
		this.dirty = false;
		this.camera = x.xcam.XCamera.cam;
	}

	/**
	 * @param {int} tick
	 * @param {array<Entity>} entities
	 * @member Hud#update
	 * @function
	 */
	update(tick, entities) {
		for (const e of entities) {
			if (e.HudGroup) {
				e.Obj3.mesh.lookAt(this.camera.position);
			}
		}
	}
}

Hud.query = {any: ['HudGroup', 'HudWedget']};

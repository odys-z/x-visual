/** @module xv.anim */

import * as ECS from '@fritzy/ecs';

export default class PointsAnim extends ECS.System {

	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
		this.scene = options.scene;
		this.renderer = options.renderer;
		this.camera = options.camera
	}
}

import * as ECS from '../../packages/ecs-js/index';
import * as THREE from '../../packages/three/three.module-r120';

import {LayerChannel, Layers} from '../xmath/layer';

/**
 * Filtering layers using {@link Layers}.
 * @class ChannelFilter
 */
export default class ChannelFilter extends ECS.System {

	/**Let camera showing the channel.
	 * @property {int} ch channel number in [0 ~ 31]
	 * @member ChannelFilter#pass
	 */
	set pass(ch) {
		if (ch > 31 || ch < 0)
			throw new XError("X-visual only has 16 channel (0 ~ 31) for user.")
		this.filter.enable(ch);
		this.dirty = true;
	}

	/**Let camera blind on the channel.
	 * @property {int} ch channel number in [0 ~ 31]
	 * @member ChannelFilter#occlude
	 */
	set occlude(ch) {
		if (ch > 31 || ch < 0)
			throw new XError("X-visual only has 16 channel (0 ~ 31) for user.")
		this.filter.disable(ch);
		this.dirty = true;
	}

	/**
	 * @constructor ChannelFilter
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
	 * @member ChannelFilter#update
	 * @function
	 */
	update(tick, entities) {
		if (this.dirty) {
			this.dirty = false;
			this.filter.set3(this.camera.layers);
		}
	}
}

ChannelFilter.query = {iffall: ['Obj3']};

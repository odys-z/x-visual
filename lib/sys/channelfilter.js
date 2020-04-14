import * as ECS from '../../packages/ecs-js/index';
import * as THREE from 'three';

import {LayerChannel, Layers} from '../xmath/layer';

export default
/**
 * Filtering layers using {@link Layers}.
 */
class ChannelFilter extends ECS.System {

	/**@property {int} ch channel [0, 15]
	 * @member ChannelFilter#pass
	 */
	set pass(ch) {
		if (ch > 15 || ch < 0)
			throw new XError("X-visual only has 16 channel (0 ~ 15) for user.")
		this.filter.enable(ch + LayerChannel.USER);
		this.dirty = true;
	}

	/**@property {int} ch channel [0, 15]
	 * @member ChannelFilter#pass
	 */
	set occlude(ch) {
		if (ch > 15 || ch < 0)
			throw new XError("X-visual only has 16 channel (0 ~ 15) for user.")
		this.filter.disable(ch + LayerChannel.USER);
		this.dirty = true;
	}

	/**
	 * @constructor
	 */
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
		this.filter = new Layers();
		this.dirty = false;
	}

	update(tick, entities) {
		if (dirty) {

		}

	}
}

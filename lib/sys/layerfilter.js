import * as ECS from '../../packages/ecs-js/index';
import * as THREE from 'three';

export default
/**
 * Filtering layers using {@link Layers}.
 */
class LayerFilter extends ECS.System {
	/**
	 * @constructor
	 */
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;
	}
}

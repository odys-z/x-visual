
/**
 * @class GpuPickable
 *
 * @memberof XComponent
 */
const GpuPickable = {
  properties: {
    pickid: 0,	// 0 can not picked - can't distinguished from background
	mesh: {},	// Obj3.mesh
    material: {},	// picking material
    picktick: 0,  // tick that found this being picked.
    picked: false,
  }
};

/**TODO to be implemented
 * @class RayCastee
 * @memberof XComponent
 */
const RayCastee = {
    properties: {
        /**@member RayCastee#castid
		 * @property {int} castid - id for raycasting
		 * @memberof XComponent */
        castid: 0,
        /**@member RayCastee#castick
		 * @property {int} castick - tick that found this being intersected.
		 * @memberof XComponent */
        castick: 0,
    }
}

export {GpuPickable, RayCastee};

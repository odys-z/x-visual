
/**An entity is pickable with {@link GpuPicker}
 * @class GpuPickable
 *
 * @memberof XComponent
 */
const GpuPickable = {
  properties: {
    /**@member GpuPickable#pickid
	 * @property {int} pickid - id for picking, used by x-visual. Don't write this
	 * @memberof XComponent */
    pickid: 0,      // 0 can not picked - can't distinguished from background
    /**@member GpuPickable#mesh
	 * @property {int} mesh - Obj3.mesh copy
	 * @memberof XComponent */
	mesh: undefined,
    /**@member GpuPickable#material
	 * @property {int} mesh - picking material
	 * @memberof XComponent */
    material: {},
    /**@member GpuPickable#picktick
	 * @property {int} picktick - tick that found this being picked.
	 * @memberof XComponent */
    picktick: 0,
    /**@member GpuPickable#picked
	 * @property {int} picked - entity reference
	 * @memberof XComponent */
    picked: false,
  }
};

/**An entity is pickable with {@link RayPicker}.
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

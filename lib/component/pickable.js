
/** @module xv.ecs.comp */

const GpuPickable = {
  properties: {
    pickid: 0,	// 0 can not picked - can't distinguished from background
	mesh: {},	// Obj3.mesh
    material: {},	// picking material
    picktick: 0,  // tick that found this being picked.
    picked: false,
  }
};

const RayCastee = {
    properties: {
        castid: 0,
        castick: 0,  // tick that found this being intersected.
    }
}
export {GpuPickable, RayCastee};

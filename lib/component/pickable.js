
/** @module xv.ecs.comp */

const GpuPickable = {
  properties: {
    pickid: 0,	// 0 can not picked - can't distinguished from background
	geom: {},	//
    tex: {},	// reference to Visual component's texture
    pos: {},	// copy of Visual.mesh. performance?
    rot: {},
    scl: {},
  }
};

export {GpuPickable};

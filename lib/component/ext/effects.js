/** @module xv.ecs.comp.ext.effects */

/** 1 - 31, 0 reserved for all in xscene.
 * see three.js doc:
 * https://threejs.org/docs/index.html#api/en/core/Layers
 */
const LayerFilter = {
	FLOWING_PATH: 1,
	GLOWING_EDGE: 2,
	BLURRING: 3
}

const FlowingPath = {
	properties: {
		script: []
	}
}

const GlowingEdge = {
	properties: {
		script: []
	}
}

const Filming = {
	properties: {
		script: []
	}
}

export { LayerFilter, FlowingPath, GlowingEdge, Filming };

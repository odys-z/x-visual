/** @module xv.ecs.comp.ext.effects */

/**value of 1 - 31, 0 is reserved for all in xscene.
 * For layers, see three.js doc:
 * https://threejs.org/docs/index.html#api/en/core/Layers
 */
const LayerFilter = {
	FLOWING_PATH: 1,
	GLOWING_EDGE: 2,
	BLURRING: 3,
	FILMING: 4
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

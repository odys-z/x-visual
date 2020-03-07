/** @module xv.ecs.comp.ext.effects */

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

const Occluder = {
	properties: {
		occlude: {}, // e.g. FlowingPath: true
	}
}

export { Occluder, FlowingPath, GlowingEdge, Filming };

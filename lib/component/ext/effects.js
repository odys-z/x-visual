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
		FlowingPath: false,
		GlowingEdge: false,
		Filming: false,
	}
}

export { Occluder, FlowingPath, GlowingEdge, Filming };

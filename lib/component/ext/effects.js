/** @namespace xv.ecs.comp.ext.effects */

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

const Glow = {
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
		Glow: false,
		Filming: false,
	}
}

export { Occluder, FlowingPath, Glow, Filming };

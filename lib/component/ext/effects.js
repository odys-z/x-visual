
/**FlowingPath effect component
 * @class FlowingPath
 * @memberof XComponent
 */
const FlowingPath = {
	properties: {
		paras: {}
	}
}

/**GlowingEdge effect component
 * @class GlowingEdge
 * @memberof XComponent
 */
const GlowingEdge = {
	properties: {
		paras: []
	}
}

/**Glow effect component
 * @class Glow
 * @memberof XComponent
 */
const Glow = {
	properties: {
		paras: []
	}
}

/**Filming effect component
 * @class Filming
 * @memberof XComponent
 */
const Filming = {
	properties: {
		paras: []
	}
}

/**Posteffects occluder component
 * @class Occluder
 * @memberof XComponent
 */
const Occluder = {
	properties: {
		FlowingPath: false,
		Glow: false,
		Filming: false,
	}
}

export { Occluder, FlowingPath, Glow, Filming };

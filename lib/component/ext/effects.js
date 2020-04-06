
/**FlowingPath effect component
 * @type FlowingPath
 * @memberof XComponent
 */
const FlowingPath = {
	properties: {
		paras: {}
	}
}

/**GlowingEdge effect component
 * @type GlowingEdge
 * @memberof XComponent
 */
const GlowingEdge = {
	properties: {
		paras: []
	}
}

/**Glow effect component
 * @type Glow
 * @memberof XComponent
 */
const Glow = {
	properties: {
		paras: []
	}
}

/**Filming effect component
 * @type Filming
 * @memberof XComponent
 */
const Filming = {
	properties: {
		paras: []
	}
}

/**Not used?
 * @type Occluder
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


// /**SSAO effect component
//  * @class Ssao
//  * @memberof XComponent
//  */
// const Ssao = {
// 	properties: {
// 		paras: undefined
// 	}
// }

/**FlowingPath effect component
 * @class FlowingPath
 * @memberof XComponent
 */
const FlowingPath = {
	properties: {
		paras: undefined
	}
}

/**GlowingEdge effect component
 * @class GlowingEdge
 * @memberof XComponent
 */
const GlowingEdge = {
	properties: {
		paras: undefined
	}
}

/**Glow effect component
 * @class Glow
 * @memberof XComponent
 */
const Glow = {
	properties: {
		paras: undefined
	}
}

/**Filming effect component
 * @class Filming
 * @memberof XComponent
 */
const Filming = {
	properties: {
		paras: undefined
	}
}

/**Posteffects occluder component
 * @class Occluder
 * @memberof XComponent
 */
const Occluder = {
	properties: {
		Ssao: false,
		FlowingPath: false,
		Glow: false,
		Filming: false,
	}
}

export { Occluder, FlowingPath, Glow, Filming };

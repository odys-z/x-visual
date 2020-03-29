/**
 * @type Sankey
 */
const Sankey = {
	properties: {
		cmd: undefined,  // current cmd
		paras: undefined,
		onOver: undefined,
		onClick: undefined
	}
}

// just a type difference?
/**
 * @type Pie
 */
const Pie = {
	properties: {
		cmd: undefined,
		paras: undefined,
		onOver: undefined,
		onClick: undefined,

		faceCameraXZ: true,
		norm: undefined, // pie plane norm, THREE.Vector3
	}
}

export {Sankey, Pie};

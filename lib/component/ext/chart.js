/**Design MEMO:
 * TODO As axes keept chart grid information, why not let Sankey alike referencing
 * Axes other than keep Grid in global options? It's the way of ECS.
 * @class Axes
 * @memberof chart
 */
const Axes = {
	properties: {
		/** [[x0, x1], [y0, y1], [z0, z1]] */
		domain: undefined,
		/** [[x0, x1], [y0, y1], [z0, z1]] */
		range: undefined,
		/** [x, y, z] */
		label: undefined
	}
}

/**Sankey bar, the data element of Sankey chart.
 *
 * gridIx - Grid index at z=0<br>
 * pivotIx - pivoting at grid<br>
 * @class Sankey
 * @memberof chart
 */
const Sankey = {
	properties: {
		vecIx: -1,
		coordIx: -1,
		gridIx: undefined,
		/** Pivoting at grid */
		pivotIx: undefined,
		/** Translated, a buffer for translating update.<br>
		 * XSankey use this to move back the bar - to avoid percision error */
		translated: undefined,
		/** current cmd, what's for? */
		cmd: undefined,
		paras: undefined,
		onOver: undefined,
		onClick: undefined
	}
}

/**
 * @class Pie
 * @memberof chart
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

export {Axes, Sankey, Pie};

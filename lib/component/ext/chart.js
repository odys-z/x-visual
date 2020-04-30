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
		/** x, y, z at arrow head */
		label: undefined,
		/** serials' data */
		dataMarks: undefined
	}
}

/**Element types
 * @enum {int}
 * @memberof chart
 */
const ElemType = {
	/** Data name, etc. */
	text: 1,
	/** parallel lines under pointer, etc. */
	frameBox: 2,
}

/**Component for defining grid elements, like axis plane, intactive lines, etc.
 * @class GridElem
 * @memberof chart
 */
const GridElem = {
	properties: {
		/**@property {ElemType} etype - element type
		 * @member ElemType#etype
		 * @memberof chart */
		etype: undefined,
		/**@property {int} onClick - animation of click event
		 * @member ElemType#onClick
		 * @memberof chart */
		onClick: undefined,
		/**@property {int} onOver - animation of mouse over event
		 * @member ElemType#onClick
		 * @memberof chart */
		onOver: undefined,
		/**@property {object} paras - data like text strings
		 * @member ElemType#onClick
		 * @memberof chart */
		paras: undefined
	}
}

/**Chart value.
 *
 * GridVisuals use this to pivot value lines.
 * @class GridElem
 * @memberof chart
 */
const GridValue = {
	properties: {
		/**@property {array<int>} gridx - grid idx
		 * @member ChartValue#gridx
		 * @memberof chart */
		gridx: undefined,
		/**@property {array<int>} val - value before scaled
		 * @member ChartValue#val
		 * @memberof chart */
		val: 0
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
		/** vector index
		 * @property {int} vecIx - vertor index, don't modify
		 * @member Sankey#vecIx
		 * @memberof chart
		 */
		vecIx: -1,
		/**
		 * @property {int} vecIx - coordinate index, don't modify
		 * @member Sankey#coordIx
		 * @memberof chart
		 */
		coordIx: -1,
		/**@property {int} gridIx - grid index, don't modify
		 * @member Sankey#gridIx
		 * @memberof chart
		 */
		gridIx: undefined,
		/**@property {int} pivotIx - Pivoting at grid, don't modify
		 * @member Sankey#pivotIx
		 * @memberof chart
		 */
		pivotIx: undefined,
		/** Translated, a buffer for translating update.<br>
		 * XSankey use this to move back the bar - to avoid percision error
		 * @property {int} translated - tranlating buffer, don't modify
		 * @member Sankey#translated
		 * @memberof chart
		 */
		translated: undefined,
		/** current cmd, what's for? */
		cmd: undefined,
		/** paras */
		paras: undefined,
		/** on mouse over, deprecated? */
		onOver: undefined,
		/** on mouse click, deprecated? */
		onClick: undefined
	}
}

/**Pie chart's pie
 * @class Pie
 * @memberof chart
 */
const Pie = {
	properties: {
		cmd: undefined,
		paras: undefined,
		onOver: undefined,
		onClick: undefined,

		lookScreen: false,
		norm: undefined, // pie plane norm, THREE.Vector3
	}
}

/**Define Bar element for {@link XBar}.
 * @class Bar
 * @memberof chart
 */
const Bar = {
	properties: {
		/** vector index
		 * @property {int} vecIx - vertor index, don't modify
		 * @member Bar#vecIx
		 * @memberof chart
		 */
		vecIx: -1,
		// /** Value indicating lines' pivoting point
		//  * @property {array<int>} valuePos - [x, y, z]
		//  * @member Bar#valuePos
		//  * @memberof chart
		//  */
		// valgrid: undefined,
		// /** Value label's text
		//  * @property {array<string>} valuePos - x, y, z value labels
		//  * @member Bar#valText
		//  * @memberof chart
		//  */
		// valText: undefined,
		/** on mouse over, deprecated? */
		onOver: 0,
		/** on mouse click, deprecated? */
		onClick: undefined
	}
}

export {GridElem, GridValue, Axes, Sankey, Pie, Bar};

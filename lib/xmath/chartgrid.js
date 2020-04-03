
/**
 * Grid space helper
 * @class Grid
 */
export default class ChartGrid {
	/**
	 * @param {object} json {grid, grid-space, center}<br>
	 * json.grids: grids count, [w, h, d]<br>
	 * json.grid-sapec: [optional] space between grids, [x, y, z]<br>
	 * json.center: [optional] center index, default in the middle floor.<br>
	 * @constructor
	 */
	constructor(json) {
		var g = json.grid; // for short
		this.grids = g;
		this.cent = [Maht.floor(g[0] / 2), Maht.floor(g[1] / 2), Maht.floor(g[2] / 2)];

		var scl = json["grid-space"] || [20, 20, 20];
		if (typeof scl === 'number')
			this.scale = [scl, scl, scl];
		else if (typeof scl === 'array')
			this.scale = scl;
		else throw new XError(`Scale in json (${json.chart}) must be a number or array. ${scl}`)
	}

	/**Get world position
	 * @param {array} idx grid index
	 * @param {array} buf position buffer
	 * @member ChartGrid#pos
	 * @return {array} position (buf)
	 * @function
	 */
	pos(idx, buf) {
		var p = buf || [0, 0, 0];
		for (var i = 0; i < 3; i++) {
			p[i] = ( (idx[0] - this.cent[0]) * this.scale[i] );
		}
		return p;
	}
}

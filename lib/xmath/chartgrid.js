
/**
 * Grid space helper
 * @class ChartGrid
 */
export default class ChartGrid {
	/**
	 * @param {object} chart {grid: [w, h, d], grid-space: number, center, domain, range}
	 * chart.grid: grids count, [w, h, d]<br>
	 * chart.domain: <br>
	 * chart.range: <br>
	 * chart.grid-sapec: deprecated [optional] space between grids, [x, y, z]<br>
	 * chart.center: [optional] center index, default in the middle floor.<br>
	 * @constructor ChartGrid
	 */
	constructor(chart) {
		var g = chart.grid; // for short
		this.grids = g;
		this.cent = [Math.floor(g[0] / 2), Math.floor(g[1] / 2), Math.floor(g[2] / 2)];
		// this.coords = json.coordinates;

		// var scl = chart["grid-space"] || [20, 20, 20];
		var scl = [20, 20, 20];
		if ( typeof scl === 'number' )
			this.scale = [scl, scl, scl];
		else if ( Array.isArray(scl) )
			this.scale = scl;
		else throw new XError(`Scale in json.chart not correct. (${chart})`);

		// TODO x (coord), y (value), z (extrude)
		this.scale = [120/2, 160/21, 100/2];
	}

	/**Get world position
	 * @param {array} idx grid index, [ coord-idx, enum-val, h, y0 ]
	 * @param {array} buf position buffer
	 * @member ChartGrid#pos
	 * @return {object} {pos0, h} position z = 0 (buf) and bar height
	 * @function
	 */
	pos(idx, buf) {
		var h = this.barHeight(idx[2]);
		var p = buf || [0, 0, 0];
		p[0] = ( (idx[0] - this.cent[0]) * this.scale[1] );
		// y_enum * s + h * s / 2 + y0 * s
		p[1] = ( (idx[1] - this.cent[1]) * this.scale[1] + h / 2 + this.barHeight(idx[3]) );
		p[2] = 0;
		return {pos0: p, h};
	}

	barHeight(val) {
		// TODO scale to max range
		return val * this.scale[1];
	}

	/** Get pivot (grid index) for a parallel range. E.g. coord-1, [0, 1]
	getExtrudePos(idx, buf) {
		var p = buf || new Array(this.grid[1]); // y length
		var ry = this.coords[x].range;          // y range

		// for (var x = 0; x < this.grid.length; x++) {
		// 	for (var z = 0; z < this.coords[x]; z++) {
		// 		p[x][z] = [y, z];
		// 	}
		// }
		p.push( [0, 0] );
		p.push( [0, 1] );
		p.push( [1, 0] );
		p.push( [0, 1] );
	}
	 */
}

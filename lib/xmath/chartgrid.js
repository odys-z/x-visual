
import {vec3} from './vec';

/**
 * Grid space helper for parallel coordinates chart, including XSankey.
 * @class CoordsGrid
 */
export class CoordsGrid {
	/**
	 * @param {object} chart {grid: [w, h, d], grid-space: number, center, domain, range}
	 * chart.grid: grids count, [w, h, d]<br>
	 * chart.domain: <br>
	 * chart.range: <br>
	 * chart.grid-sapec: deprecated [optional] space between grids, [x, y, z]<br>
	 * chart.center: [optional] center index, default in the middle floor.<br>
	 * @constructor CoordsGrid
	 */
	constructor(chart) {
		var g = chart.grid; // for short
		/**Grid bounds
		 * @member CoordsGrid#grid
		 * @property {array<int>} grid - grid bounds, [w, h, d]
		 */
		this.grid = g;

		/**Grid center index.
		 * @member CoordsGrid#cent
		 * @property {int} cent - grid center, in grid index
		 */
		this.cent = [Math.floor(g[0] / 2), Math.floor(g[1] / 2), Math.floor(g[2] / 2)];

		var scl = chart["grid-space"] || [20, 20, 20];
		if ( typeof scl === 'number' )
			this.scale = [scl, scl, scl, 0];
		else if ( Array.isArray(scl) )
			this.scale = [...scl, 0];
		else throw new XError(`Scale (grid-space) in json.chart is not correct. (${chart})`);

		var r = chart.range[1];
		var d = chart.domain[1];
		/**Scales convert 1 to world size.<br>
		 * x (coord), y (value), z (extrude), w (value)<br>
		 * where w = grid-yscale * range / domain
		 * @member CoordsGrid#scale
		 * @property {array<int>} scale - x, y, z scale
		 */
		// this.scale[3] = this.scale[1] * g[1] * (r[1] - r[0]) / (d[1] - d[0]);
		// range is only used for label
		this.scale[3] = this.scale[1] * g[1] / (d[1] - d[0]);
	}

	/**Get world position and height (parallel coords).
	 * @param {array} idx grid index, [ coord-idx, enum-val, h, y0 ]
	 * @param {array} buf position buffer
	 * @return {object} {pos0, h} position z = 0 (buf) and bar height
	 * @member CoordsGrid#pos
	 * @function
	 */
	pos(idx, buf) {
		var h = this.barHeight(idx[2]);
		var p = buf || [0, 0, 0];
		// p[0] = ( (idx[0] - this.cent[0]) * this.scale[0] );
		p[0] = idx[0] * this.scale[0];
		// y_enum * s + h * s / 2 + y0 * s
		// p[1] = ( (idx[1] - this.cent[1]) * this.scale[1] + h / 2 + this.barHeight(idx[3]) );
		p[1] = idx[1] * this.scale[1] + h / 2 + this.barHeight(idx[3]);
		p[2] = 0;
		return {pos0: p, h};
	}

	barHeight(val) {
		return val * this.scale[3];

	}

	/**Scale grid index value to world position.<br>
	 * E.g. if v = [0.2], grid scale is [5, 5, 1], return [1, 1, 0.2].
	 *
	 * **Note: [design MEMO]**<br>
	 * User must take care of how the grid is scaled. It's y scale is usually
	 * useless as the scale is calculated from value range.<br>
	 * See {@link D3Pie.pies} source for how it's handled by user - scale for pie's
	 * width and height, set in Obj3.box.
	 * @param {array | vec3 | number} v value in grid
	 * @return {array | number} value in world
	 * @member CoordsGrid#space
	 * @function
	 */
	space(v) {
		if (Array.isArray(v)) {
			for (var ix = 0; ix < v.length && ix < this.scale.length; ix++)
				v[ix] *= this.scale[ix];
		}
		else if (v instanceof vec3) {
			return [v.x * this.scale[0],
					v.y *= this.scale[1],
					v.z *= this.scale[2] ];
		}
		else v *= this.scale[0];
	 	return v;
	}
}

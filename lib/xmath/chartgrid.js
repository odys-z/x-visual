import {vec3} from './vec';

/**
 * Grid space helper for parallel coordinates chart, including XSankey.
 *
 * <b>Note: x, y, z in world space of THREE coordinates.</b>
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

	/**Get world position of gird index.
	 *
	 * <b>Note: x, y, z in world space of THREE coordinates.</b>
	 * @param {array} buf position buffer
	 * @param {array} gridx grid index, [ x, y = 0, z], if y ignored, return [x, 0, z] in world
	 * @param {...array} offset [x, y, z], offset in grid
	 * @return {object} position (buf)
	 * @member CoordsGrid#worldPos
	 * @function
	 */
	worldPos(buf, gridx, ...offset) {
		var p = buf || [0, 0, 0];
		if (gridx.length > 2) {
			p[0] = gridx[0]; // * this.scale[0];
			p[1] = gridx[1]; // * this.scale[1];
			p[2] = gridx[2]; // * this.scale[2];
		}
		else {
			p[0] = gridx[0]; // * this.scale[0];
			p[1] = 0;
			p[2] = gridx[1]; // * this.scale[2];
		}
		if (offset) {
			for (var i = 0; i < offset.length; i++) {
				if (Array.isArray(offset[i])) {
					p[0] += offset[i][0];
					p[1] += offset[i][1];
					p[2] += offset[i][2];
				}
				else if (typeof offset[i] === 'number'){
					p[0] += offset[i];
					p[1] += offset[i];
					p[2] += offset[i];
				}
			}
		}

		p[0] *= this.scale[0];
		p[1] *= this.scale[2];
		p[2] *= this.scale[2];

		return p;

	}

	/**Get world position and height stick to parallel coords (z = 0).
	 *
	 * <b>Note: x, y, z in world space of THREE coordinates.</b>
	 * @param {array} gridx grid index, [ coord-gridx, enum-val, h, y0 ]
	 * @param {array} buf position buffer
	 * @return {object} {pos0, h} position z = 0 (buf) and bar height
	 * @member CoordsGrid#coordPos
	 * @function
	 */
	coordPos(gridx, buf) {
		var h = this.barHeight(gridx[2]);
		var p = buf || [0, 0, 0];
		p[0] = gridx[0] * this.scale[0];
		// y_enum * s + h * s / 2 + y0 * s
		p[1] = gridx[1] * this.scale[1] + h / 2 + this.barHeight(gridx[3]);
		p[2] = 0;
		return {pos0: p, h};
	}

	/**Get world position and height at extruded pivoting.
	 * @param {int} v vector value
	 * @param {array} gridx grid index, [ x, y, z, y0, h(optional, will use the vector value) ]
	 * @param {array} buf position buffer
	 * @return {array} position (buf)
	 * @member CoordsGrid#extrudePos
	 * @function
	 */
	extrudePos(v, gridx, buf) {
		var h = this.barHeight(v);
		var p = buf || [0, 0, 0];
		// p[0] = gridx[0] * this.scale[0];
		p[0] = 0; // parallel coord's bar vertical extrude, keeping x without changed.
		p[1] = gridx[1] * this.scale[1] + h / 2;
		if (gridx.length > 4)
			p[1] += this.barHeight(gridx[3]);
		p[2] = gridx[2] * this.scale[2];
		return p;
	}

	/**Get bar height in world.
	 * @param {number} val vector value
	 * @return {number} height in world position
	 * @member CoordsGrid#barHeight
	 * @function
	 */
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
		else v *= this.scale[0]; // number
		return v;
	}

	/** Get lerped posion in world .
	 *
	 * <b>Note</b>: All position arrays, [x, y, z] are created in memory, user
	 * should being aware of performance problem.
	 * @param {array} cxyz, [x, y, z] position count
	 * @param {...array} offset [x, y, z], offset in grid
	 * @return {array} 4D array of positions, in [x, y, z] of x, y, z
	 * @member CoordsGrid#lerposes
	 * @function
	 */
	lerposes(cxyz, offset = [0, 0, 0]) {
		var poses = new Array(cxyz[1]);
		for (var iy = 0; iy < cxyz[1]; iy++) {
			var posxz = [];
			for (var iz = 0; iz < cxyz[2]; iz++) {
				var posx = [];
				for (var ix = 0; ix < cxyz[0]; ix++) {
					// TODO lerp with range x, y, z
					// TODO lerp with range x, y, z
					// TODO lerp with range x, y, z
					// TODO lerp with range x, y, z
					var p = this.worldPos(undefined, [ix, iy, iz], offset);
					posx.push(p);
				}
				posxz.push(posx);
			}
			poses[iy] = posxz;
		}
		return poses;
	}

	/**Get the grid bounds in world.
	 * @return {array} x, y, z bounds in world
	 * @member CoordsGrid#spaceBound
	 * @function
	 */
	spaceBound() {
		return [this.grid[0] * this.scale[0],
				this.grid[1] * this.scale[1],
				this.grid[2] * this.scale[2]];
	}
}

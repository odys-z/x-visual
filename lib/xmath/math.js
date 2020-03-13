/**
 * A collection of common math function.
 * @class xmath
 */
export class xmath {

	/**
	 * @member xmath.radian */
	static radian(degree) {
	    return degree * Math.PI/180;
	}

	/**Get point alone path, at weight t, and set result point in buffer.
	 *
	 * Stolen from SplineCurve.prototype.getPoint
	 *
	 * https://github.com/mrdoob/three.js/blob/master/src/extras/curves/SplineCurve.js
	 *
	 * @param {THREE.Vector3} pointBuffer
	 * @param {array<THREE.Vector3>} path point array of THREE.Vector3
	 * @param {number} t weight, range 0 - 1
	 * @member xmath.getPointAt */
	static getPointAt(pointBuffer, path, t) {
		var point = pointBuffer || new Vector3();

		var points = path; //.points;
		var p = ( points.length - 1 ) * t;

		var intPoint = Math.floor( p );
		if (intPoint < 0) {
			console.warn('Point index out of range. P: ',
				intPoint, 'buffer: ', pointBuffer, 't: ', t, 'path: ', path);
			intPoint = 0;
		}
		var weight = p - intPoint;

		var p0 = points[ intPoint === 0 ? intPoint : intPoint - 1 ];
		var p1 = points[ intPoint ];
		var p2 = points[ intPoint > points.length - 2 ? points.length - 1 : intPoint + 1 ];
		var p3 = points[ intPoint > points.length - 3 ? points.length - 1 : intPoint + 2 ];

		point.set(
			catmullRom( weight, p0.x, p1.x, p2.x, p3.x ),
			catmullRom( weight, p0.y, p1.y, p2.y, p3.y ),
			catmullRom( weight, p0.z, p1.z, p2.z, p3.z )
		);

		return point;
	}

	/**@deprecated not used?
	 * <pre>exampels:
	 * round_to_precision(11, 8);    // outputs 8
	 * round_to_precision(3.7, 0.5); // outputs 3.5</pre>
	 * @param {number} x
	 * @param {number} precision, default 1
	 * @return {number} round up
	 * @member xmath.round_to_precision */
	static round_to_precision(x, precision) {
    var y = +x + (precision === undefined ? 0.5 : precision/2);
    return y - (y % (precision === undefined ? 1 : +precision));
}
}

/**Doc:
 * <a href='https://threejs.org/docs/#api/en/extras/core/Curve.getPoint'>
 * Returns a vector for a given position on the curve</a>.
 *
 * Stolen from:
 * https://github.com/mrdoob/three.js/blob/b11f897812a8a48bcd81e9bd46785d07939ec59e/src/extras/core/Interpolations.js#L8
 *
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 * Bezier Curves formulas obtained from
 * http://en.wikipedia.org/wiki/Bézier_curve
 * @member xmath.catmullRom */
function catmullRom( t, p0, p1, p2, p3 ) {
	var v0 = ( p2 - p0 ) * 0.5;
	var v1 = ( p3 - p1 ) * 0.5;
	var t2 = t * t;
	var t3 = t * t2;
	return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;
}

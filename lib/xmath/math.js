/**
 * A collection of common math function.
 * @class xmath
 */
export default class xmath {

	/**
	 * @member xmath.radian
	 */
	static radian(degree) {
	    return degree * Math.PI/180;
	}

	/**@deprecated not used?
	 * <pre>exampels:
	 * round_to_precision(11, 8);    // outputs 8
	 * round_to_precision(3.7, 0.5); // outputs 3.5</pre>
	 * @param {number} x
	 * @param {number} precision, default 1
	 * @return {number} round up
	 * @member xmath.round_to_precision
	 */
	static round_to_precision(x, precision) {
	    var y = +x + (precision === undefined ? 0.5 : precision/2);
	    return y - (y % (precision === undefined ? 1 : +precision));
	}

}

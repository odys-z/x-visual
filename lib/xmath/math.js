/**
 * A collection of common math function.
 * @class xmath
 */
export default class xmath {

	/**Convert degree to radian
	 * @member xmath.radian
	 * @function
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
	 * @function
	 */
	static round_to_precision(x, precision) {
	    var y = +x + (precision === undefined ? 0.5 : precision/2);
	    return y - (y % (precision === undefined ? 1 : +precision));
	}

	/**Get a norm vector form *frm* to *to*, using *buf* as buffer.
	 * @param {THREE.Vector3} buf buffer can not be null.
	 * @param {number} to
	 * @param {number} frm
	 * @return {THREE.Vector3} buf
	 * @member xmath.normxy
	 * @function
	 */
	static normxz(buf, to, frm) {
		buf.copy(to);
		buf.y = frm.y;
		buf.sub(frm);
		buf.normalize();
		return buf;
	}
}

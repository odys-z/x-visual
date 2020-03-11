/**
 * @namespace xv.xutils
 */

import * as THREE from 'three';

/**
 * Stub for jsdoc, a collection of common methods
 * <b>NOTE: no 'xutils.' prefix when calling functions.</b>
 * <br>This class name is all in lower case. X-visual use this convention for a
 * collection of common global methods when using jsdoc generating API doc.
 * @class xutils
 */
function xutils() { }

/**
 * example: await sleep(1000);
 * @param {number} ms
 * @member xutils.sleep
 */
export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a texture generated in memory.
 * @param {number} w 0 - 1
 * @param {number} h 0 - 1
 * @param {number} alpha 0 - 1
 * @return {Unit8Array} size = w * h * 4
 * @member xutils.ramTexture
 */
export function ramTexture(w, h, alpha) {
	var size = w * h;
	var data = new Uint8Array( 4 * size );

	var a = Math.floor( alpha * 255 );

	for ( var i = 0; i < size; i ++ ) {

		var stride = i * 4;

		var x = i + 127
		data[ stride ] = (x % w) / w * 255;
		data[ stride + 1 ] = (x / w) / h * 255;
		data[ stride + 2 ] = (data[ stride ] + data[ stride + 1]) / 2;
		data[ stride + 3 ] = a;
	}

	var texture = new THREE.DataTexture( data, w, h, THREE.RGBAFormat );
	return texture;
}

/**
 * Get a randome integer, between min (0), max
 * @param {number} min
 * @param {number} [max]
 * @member xutils.randInt
 */
export function randInt(min, max) {
	if (max === undefined) {
		max = min;
		min = 0;
	}
	return Math.random() * (max - min) + min | 0;
}

/**
 * Get a randome color
 * @return {string} e.g. '0x0f3271'
 * @member xutils.randomColor
 */
export function randomColor() {
	return `#${randInt(0x1000000).toString(16).padStart(6, '0')}`
}

/**
 * Get a randome color
 * @return {THREE.Color} color
 * @member xutils.randomRGB
 */
export function randomRGB() {
	var color = new THREE.Color(randInt(0, 0xffffff));
	return color;
}

// export function vec3(xyz) {
// 	throw new XError('xcommon.vec3() is replaced by xv.packages.vec.vec3.js()');
// 	return new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
// }
//
// /**
//  * @deprecated use {@link mat4}
//  * @param {THREE.Matrix4} [mat]
//  * @param {number} [max]
//  * @return {THREE.Matrix4}
//  * @member xutils.mat4
// export function mat4(mat) {
// 	throw new XError('xcommon.mat4() is replaced by xv.packages.vec.mat4.js()');
// 	if (mat instanceof THREE.Matrix4)
// 		return new THREE.Matrix4().set(mat.clone());
// 	else return new THREE.Matrix4();
// }
//  */

/**
 * example: throw new XError('msg', 0);
 * @param {number} err error message
 * @param {number} [code] error code
 * @class XError
 */
export function XError(err, code) {
	this.code = code;
	this.message = err;
	this.name = 'XError';
}

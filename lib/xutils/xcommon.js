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
 * @function
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
 * @function
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
 * @function
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
 * @function
 */
export function randomColor() {
	return `#${randInt(0x1000000).toString(16).padStart(6, '0')}`
}

/**
 * Get a randome color
 * @return {THREE.Color} color
 * @member xutils.randomRGB
 * @function
 */
export function randomRGB() {
	var color = new THREE.Color(randInt(0, 0xffffff));
	return color;
}

/** Get browser name and version.
 * @param {bool} log true will log with console.
 * @return {object} {name, version}
 * @function
 */
export function browserVer(log) {
    var ua = navigator.userAgent,
		tem,
		M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name:'IE', version:(tem[1]||'') };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\bOPR|Edge\/(\d+)/)
        if (tem != null) {
			return {name:'Opera', version:tem[1]};
		}
    }
    M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if ( (tem = ua.match(/version\/(\d+)/i) ) != null ) {
		M.splice(1, 1, tem[1]);
	}
    var rep = {
		name: M[0],
		version: M[1]
    };
	if (log) console.log(rep);
	return rep;
}

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

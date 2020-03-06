
/**
 * @module xv.xutils
 */

import * as THREE from 'three';

/**
 * example: await sleep(1000);
 * @param {number} ms
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function ramTexture(w, h, alpha) {
    var size = w * h;
    var data = new Uint8Array( 4 * size );

    // var r = Math.floor( color.r * 255 );
    // var g = Math.floor( color.g * 255 );
    // var b = Math.floor( color.b * 255 );
    // var a = Math.floor( (color.a || 1) * 255 );
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

export function randInt(min, max) {
	if (max === undefined) {
		max = min;
		min = 0;
	}
	return Math.random() * (max - min) + min | 0;
}

export function randomColor() {
	return `#${randInt(0x1000000).toString(16).padStart(6, '0')}`
}

export function randomRGB() {
	var color = new THREE.Color(randInt(0, 0xffffff));
    return color;
}

export function vec3(xyz) {
    throw new XError('xcommon.vec3() is replaced by xv.packages.vec.vec3.js()');
    return new THREE.Vector3(xyz[0], xyz[1], xyz[2]);
}

export function mat4(mat) {
    throw new XError('xcommon.mat4() is replaced by xv.packages.vec.mat4.js()');
    if (mat instanceof THREE.Matrix4)
        return new THREE.Matrix4().set(mat.clone());
    else return new THREE.Matrix4();
}

export function XError(err, code) {
    this.code = code;
	this.message = err;
	this.name = 'XError';
}

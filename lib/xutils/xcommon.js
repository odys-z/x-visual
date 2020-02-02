
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

export function ramTexture(w, h, color) {
    var size = w * h;
    var data = new Uint8Array( 3 * size );

    var r = Math.floor( color.r * 255 );
    var g = Math.floor( color.g * 255 );
    var b = Math.floor( color.b * 255 );

    for ( var i = 0; i < size; i ++ ) {

    	var stride = i * 3;

    	data[ stride ] = r;
    	data[ stride + 1 ] = g;
    	data[ stride + 2 ] = b;
    }

    var texture = new THREE.DataTexture( data, w, h, THREE.RGBFormat );
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

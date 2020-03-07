/**
 * @module xv.xmath.layer
 */

/**value of 1 - 31, 0 is reserved for all in xscene.
 * For layers, see three.js doc:
 * https://threejs.org/docs/index.html#api/en/core/Layers
 */
const LayerFilter = {
	NONE: 0,
	ALL: 0xffffffff,
	FLOWING_PATH: 1,
	GLOWING_EDGE: 2,
	BLURRING: 3,
	FILMING: 4

	// arr2mask: function (arrMask) {
	// 	if (Array.isArray(arrMask)) {
	// 		var mask = LayerFilter.NONE;
	// 		for (var msk of arrMask) {
	// 			if (msk < 0 || msk > 31)
	// 				throw new XError('Mask in array is invalid:', msk, arrMask);
	// 			mask |= 1 << msk;
	// 		}
	// 		return mask;
	// 	}
	// }
}

/**
 * Orignal Source: https://github.com/mrdoob/three.js/blob/master/src/core/Layers.js
 * by mrdoob / http://mrdoob.com/
 * LICENSE: MIT
 *
 * Layer flags.
 * Note: This is not the component - it's integer in Obj3.layers and occluding.
 * Post effect system like PathEffect use this as it's pass-layer flags.
 * @author odys-z@github.com
 */

function Layers() { this.mask = 1 | 0; }

Object.assign( Layers.prototype, {
	set: function ( channel ) {
		this.mask = 1 << channel | 0;
		return this;
	},

	enable: function ( channel ) {
		this.mask |= 1 << channel | 0;
		return this;
	},

	enableAll: function () {
		this.mask = 0xffffffff | 0;
		return this;
	},

	toggle: function ( channel ) {
		this.mask ^= 1 << channel | 0;
		return this;
	},

	disable: function ( channel ) {
		this.mask &= ~ ( 1 << channel | 0 );
		return this;
	},

	disableAll: function () {
		this.mask = 0;
		return this;
	},

	visible: function ( mask ) {
		return ( this.mask & mask ) !== 0;
	},

	occlude: function ( mask ) {
		return this.visible ( ~mask );
	}

} );

export { LayerFilter, Layers };

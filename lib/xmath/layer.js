/**
 * @module xv.xmath.layer
 */

/**value of 1 - 31, 0 is reserved for all in xscene.
 * For layers, see three.js doc:
 * https://threejs.org/docs/index.html#api/en/core/Layers
 */
const LayerFilter = {
	FLOWING_PATH: 1,
	GLOWING_EDGE: 2,
	BLURRING: 3,
	FILMING: 4
}

/**
 * @author mrdoob / http://mrdoob.com/
 * SOURCE: https://github.com/mrdoob/three.js/blob/master/src/core/Layers.js
 * LICENSE: MIT
 */

function Layers() { this.mask = 1 | 0; }

Object.assign( Layers.prototype, {
	set: function ( channel ) {
		this.mask = 1 << channel | 0;
	},

	enable: function ( channel ) {
		this.mask |= 1 << channel | 0;
	},

	enableAll: function () { this.mask = 0xffffffff | 0; },

	toggle: function ( channel ) {
		this.mask ^= 1 << channel | 0;
	},

	disable: function ( channel ) {
		this.mask &= ~ ( 1 << channel | 0 );
	},

	disableAll: function () { this.mask = 0; },

	visible: function ( layers ) {
		return ( this.mask & layers.mask ) !== 0;
	}
} );

export { LayerFilter, Layers };

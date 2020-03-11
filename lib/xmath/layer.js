/**
 * @namespace xv.xmath.layer
 */

/**value of 1 - 31, 0 is reserved for all in xscene.
 *
 * For layers, see three.js doc:
 * https://threejs.org/docs/index.html#api/en/core/Layers
 * @memberof xv.xmath.layer */
const LayerChannel = {
	NONE: 31,
	ALL: 0,	// mask = 1 for all
	FLOWING_PATH: 1,
	GLOW: 2,
	BLURRING: 3,
	FILMING: 4
}

/**Layer flags. (Visible Filter)
 *
 * Orignal Source: https://github.com/mrdoob/three.js/blob/master/src/core/Layers.js <br>
 * by mrdoob / http://mrdoob.com/ <br>
 * LICENSE: MIT
 *
 * Note: This is not the component - it's integer in Obj3.layers and occluding.
 * Post effect system like PathEffect use this as it's pass-layer flags.
 * @author odys-z@github.com
 * @class Layers
 */
function Layers() { this.mask = 0; } // default enable none, THREE use '1' stands for 'all'

Object.assign( Layers.prototype, {
	/**@memberof Layers */
	set: function ( channel ) {
		this.mask = 1 << channel | 0;
		return this;
	},

	/**@memberof Layers */
	enable: function ( channel ) {
		this.mask |= 1 << channel | 0;
		return this;
	},

	/**@memberof Layers */
	enableAll: function () {
		this.mask = 0xffffffff | 0;
		return this;
	},

	/**@memberof Layers */
	toggle: function ( channel ) {
		this.mask ^= 1 << channel | 0;
		return this;
	},

	/**@memberof Layers */
	disable: function ( channel ) {
		this.mask &= ~ ( 1 << channel | 0 );
		return this;
	},

	/**@memberof Layers */
	disableAll: function () {
		this.mask = 0;
		return this;
	},

	/**@memberof Layers */
	test: function ( layers ) {
		return ( this.mask & layers.mask ) !== 0;
	},

	/**@memberof Layers */
	visible: function ( visibleMask ) {
		return ( this.mask & visibleMask ) !== 0;
	},

	/**@memberof Layers */
	occlude: function ( occludingMask ) {
		return this.visible ( occludingMask );
	}
} );

export { LayerChannel, Layers };

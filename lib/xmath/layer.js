/**value of 0 - 31, 0 is reserved for all in xscene. (mask = 1)
 *
 * For layers, see three.js doc:
 * https://threejs.org/docs/index.html#api/en/core/Layers
 *
 * NONE: all invisible
 * USER: the starting chennle for ChannelFilter.
 * ALL: show all objects
 * FLOWING_PATH: {@link PathEffect} effect pass
 * GLOW: {@link GlowEffect} effect pass
 * BLURRING: not used?
 * FILMING: {@link FilmEffect} effect pass
 * @type LayerChannel
 */
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
 * **Note**: This is not the component - it's integer in Obj3.layers and occluding.
 *
 * Post effect system like PathEffect use this as it's pass-layer flags.
 * {@link ChannelFilter} also use this for channel filtering.
 * @author odys-z@github.com
 * @param {int32} [mask] intitial flage, default 0.
 * @class Layers
 */
function Layers(mask) {
	/**layer mask value. Default enable none.
	 * THREE use '1' stands for 'all' - channel 0.
	 * @member Layers#mask
	 * @property {int32} mask - mask flag
	 */
	this.mask = mask || 0;
}

Object.assign( Layers.prototype, {
	/**Set channel value (visible), channel 0 for all visible.
	 * @member Layers#set
	 * @function
	 */
	set: function ( channel ) {
		this.mask = 1 << channel | 0;
		return this;
	},

	/**Set this mask to THREE.Layers' mask
	 * @param {THREE.Layers | Layers} l3 target
	 * @member Layers#set3
	 * @function
	 */
	set3: function ( l3 ) {
		l3.mask = this.mask;
	},

	/**@member Layers#enable
	 * @function
	 */
	enable: function ( channel ) {
		this.mask |= 1 << channel | 0;
		return this;
	},

	/**@member Layers#enableAll
	 * @function
	 */
	enableAll: function () {
		this.mask = 0xffffffff | 0;
		return this;
	},

	/**@member Layers#toggle
	 * @function
	 */
	toggle: function ( channel ) {
		this.mask ^= 1 << channel | 0;
		return this;
	},

	/**@member Layers#disable
	 * @function
	 */
	disable: function ( channel ) {
		this.mask &= ~ ( 1 << channel | 0 );
		return this;
	},

	/**@member Layers#disableAll
	 * @function
	 */
	disableAll: function () {
		this.mask = 0;
		return this;
	},

	/**Also enable channels of *layers*.
	 * @member Layers#test
	 * @function
	 */
	unify: function ( layers ) {
		if (layers)
			this.mask |= layers.mask;
		return this;
	},

	/**@member Layers#test
	 * @function
	 */
	test: function ( layers ) {
		return ( this.mask & layers.mask ) !== 0;
	},

	/**@member Layers#visible
	 * @function
	 */
	visible: function ( visibleMask ) {
		return ( this.mask & visibleMask ) !== 0;
	},

	/**
	 * @param {int} occludingMask channel flags to occlude
	 * @member Layers#occlude
	 * @function
	 */
	occlude: function ( occludingMask ) {
		return this.visible ( occludingMask );
	}
} );

export { LayerChannel, Layers };

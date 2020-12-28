import * as THREE from '../../packages/three/three.module-MRTSupport';

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
 * @param {object} options
 * alpha: 0 - 1<br>
 * color: number, optional, if not exists, will create a blocking texture.
 * @return {Unit8Array} size = w * h * 4
 * @member xutils.ramTexture
 * @function
 */
export function ramTexture(w, h, options) {
	var size = w * h;
	var data = new Uint8Array( 4 * size );

	var a = Math.floor(
		(options.alpha === undefined ? 1 : options.alpha) * 255 );

	for ( var i = 0; i < size; i ++ ) {

		var stride = i * 4;

		if (typeof options.color === 'number') {
			data[ stride ] = options.color >> 8;
			data[ stride + 1 ] = options.color >> 16;
			data[ stride + 2 ] = options.color >> 24;
			data[ stride + 3 ] = options.color;
		}
		else {
			var x = i + 127
			data[ stride ] = (x % w) / w * 255;
			data[ stride + 1 ] = (x / w) / h * 255;
			data[ stride + 2 ] = (data[ stride ] + data[ stride + 1]) / 2;
			data[ stride + 3 ] = a;
		}
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

/**
 * Get an array of paths and urls
 * @param {string | array} path or url - if array, only first used
 * @return {string} url or assets/path, only first used
 * @member xutils.paths
 * @function
 */
export function paths(p) {
	p = Array.isArray(p) ? p[0] : p;
	if (validURL(p))
		return p;
	else return 'assets/' + p;
}

/**Is the str is a valid url?
 * https://stackoverflow.com/a/5717133
 * @param {string} str
 * @return {bool}
 * @member xutils.validURL
 * @function
 */
function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}

/**
 * Get color array that's common in shader uniform parameter format<br>
 * Stolen from <a href='https://github.com/mrdoob/three.js/blob/fd046cbc06b7a93ed2e34090e7fe19c72afdde9f/src/math/Color.js#L151'>
 * Three.js/Color#setStyle</a>.
 * @param {number} min
 * @return {array} color [r, g, b], without 'a'.
 * @member xutils.cssColor
 * @function
 */
 export function cssColor( style ) {
	function handleAlpha( string ) {
		if ( string === undefined ) return;
		if ( parseFloat( string ) < 1 ) {
			console.warn( 'xutils.cssColor: Alpha component of ' + style + ' will be ignored.' );
		}
	}
	function clamp( value, min, max ) {
		return Math.max( min, Math.min( max, value ) );
	}
	function hue2rgb( p, q, t ) {
		if ( t < 0 ) t += 1;
		if ( t > 1 ) t -= 1;
		if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
		if ( t < 1 / 2 ) return q;
		if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
		return p;
	}
	function setHSL( h, s, l ) {
		let r, g, b;
		// h,s,l ranges are in 0.0 - 1.0
		h = ( ( h % 1 ) + 1 ) % 1;
		s = clamp( s, 0, 1 );
		l = clamp( l, 0, 1 );
		if ( s === 0 ) {
			r = g = b = l;
		} else {
			const p = l <= 0.5 ? l * ( 1 + s ) : l + s - ( l * s );
			const q = ( 2 * l ) - p;
			r = hue2rgb( q, p, h + 1 / 3 );
			g = hue2rgb( q, p, h );
			b = hue2rgb( q, p, h - 1 / 3 );
		}
		return [r, g, b];
	}
	function hexNum(hex) {
		return [( hex >> 16 & 255 ) / 255,
				( hex >> 8 & 255 ) / 255,
				( hex & 255 ) / 255 ];
	}
	function hexString(css) {
		var hex = Math.floor( eval(css) );
		return hexNum(hex);
	}

	let m;
	if ( m = /^((?:rgb|hsl)a?)\(\s*([^\)]*)\)/.exec( style ) ) {
		// rgb / hsl
		let color;
		const name = m[ 1 ];
		const components = m[ 2 ];

		switch ( name ) {
			case 'rgb':
			case 'rgba':
				if ( color = /^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec( components ) ) {
					// rgb(255,0,0) rgba(255,0,0,0.5)
					let r = Math.min( 255, parseInt( color[ 1 ], 10 ) ) / 255;
					let g = Math.min( 255, parseInt( color[ 2 ], 10 ) ) / 255;
					let b = Math.min( 255, parseInt( color[ 3 ], 10 ) ) / 255;

					handleAlpha( color[ 5 ] );

					return [r, g, b];
				}

				if ( color = /^(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec( components ) ) {

					// rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)
					let r = Math.min( 100, parseInt( color[ 1 ], 10 ) ) / 100;
					let g = Math.min( 100, parseInt( color[ 2 ], 10 ) ) / 100;
					let b = Math.min( 100, parseInt( color[ 3 ], 10 ) ) / 100;

					handleAlpha( color[ 5 ] );
					return [r, g, b];
				}
				break;
			case 'hsl':
			case 'hsla':
				if ( color = /^([0-9]*\.?[0-9]+)\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?$/.exec( components ) ) {
					// hsl(120,50%,50%) hsla(120,50%,50%,0.5)
					const h = parseFloat( color[ 1 ] ) / 360;
					const s = parseInt( color[ 2 ], 10 ) / 100;
					const l = parseInt( color[ 3 ], 10 ) / 100;

					debugger
					handleAlpha( color[ 5 ] );
					return setHSL( h, s, l );
				}
				break;
		}
	}
	else if ( m = /^\#([A-Fa-f0-9]+)$/.exec( style ) ) {
		// hex color
		const hex = m[ 1 ];
		const size = hex.length;
		if ( size === 3 ) {
			// #ff0
			let r = parseInt( hex.charAt( 0 ) + hex.charAt( 0 ), 16 ) / 255;
			let g = parseInt( hex.charAt( 1 ) + hex.charAt( 1 ), 16 ) / 255;
			let b = parseInt( hex.charAt( 2 ) + hex.charAt( 2 ), 16 ) / 255;
			return [r, g, b];
		} else if ( size === 6 ) {
			// #ff0000
			let r = parseInt( hex.charAt( 0 ) + hex.charAt( 1 ), 16 ) / 255;
			let g = parseInt( hex.charAt( 2 ) + hex.charAt( 3 ), 16 ) / 255;
			let b = parseInt( hex.charAt( 4 ) + hex.charAt( 5 ), 16 ) / 255;
			return [r, g, b];
		}
	}
	else if ( m = /^0[Xx]([A-Fa-f0-9]+)$/.exec( style ) ) {
		return hexString(style);
	}
	else if (typeof style === 'number') {
		return hexString(style)
	}

	if ( style && style.length > 0 ) {
		// return this.setColorName( style );
		console.error("TODO handle color name: ", style);
	}
	return [0, 0, 0];
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

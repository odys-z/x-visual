/**
 * Stolen from: <a href='https://github.com/mrdoob/three.js/blob/ac9e83c3c63b059aa5176993e32a1578f5d13b8d/src/renderers/WebGLMultiRenderTarget.js'>
 * three.js/src/renderers/WebGLMultiRenderTarget.js</a>,
 * last Commits on Jun 10, 2020, retrieved on Tue Oct 20 14:29:06 HKT 2020.
 *
 * See also: <a href='https://github.com/mrdoob/three.js/pull/16390'>
 * MRT Support #16390</a>
 *
 * @author Takahiro (no license section) https://github.com/takahirox)
 */
// import { WebGLRenderTarget } from './WebGLRenderTarget.js';
import { WebGLRenderTarget } from '../three.module-MRTSupport';

/**
 * @author Matt DesLauriers / @mattdesl
 * @author Takahiro https://github.com/takahirox
 */

function WebGLMultiRenderTarget( width, height, numAttachments, options ) {

	WebGLRenderTarget.call( this, width, height, options );

	this.textures = [];

	for ( let i = 0; i < numAttachments; i ++ ) {

		this.textures[ i ] = this.texture.clone();

	}

}

WebGLMultiRenderTarget.prototype = Object.assign( Object.create( WebGLRenderTarget.prototype ), {

	constructor: WebGLMultiRenderTarget,

	isWebGLMultiRenderTarget: true,

	copy: function ( source ) {

		WebGLRenderTarget.prototype.copy.call( this, source );

		this.textures.length = 0;

		for ( let i = 0, il = source.textures.length; i < il; i ++ ) {

			this.textures[ i ] = source.textures[ i ].clone();

		}

		return this;

	},

	setNumAttachments( num ) {

		if ( this.textures.length !== num ) {

			this.dispose();

			if ( num > this.textures.length ) {

				for ( let i = this.textures.length; i < num; i ++ ) {

					this.textures[ i ] = this.texture.clone();

				}

			} else {

				this.textures.length = num;

			}

		}

	}

} );


export { WebGLMultiRenderTarget };


import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index'

import AssetKeepr from '../xutils/assetkeepr.js';
import XSys from './xsys';
import {Visual, Canvas, AssetType, ShaderFlag} from '../component/visual.js'
import {Obj3, Obj3Type} from '../component/obj3.js'

/**
 * @property {array} iffall - query condition: {iffall: ['Visual', 'Dynatex', 'Obj3']}
 * @member CanvTex#iffall
 */
const iffall = ['Visual', 'Dynatex', 'Obj3'];

const buf = {p0: new THREE.Vector3(),
			 p : new THREE.Vector3(),
			 q : new THREE.Quaternion(),
			 q_: new THREE.Quaternion(), // conjugate
		 	 s : new THREE.Vector3()
			};

/**@class CanvTex
 * @classdesc
 * Handle dynamic texture with a underlying canvas. Hidden canvas are referenced
 * by component {@link Dynatex}.
 *
 * Reference: <a href='https://github.com/jeromeetienne/threex.dynamictexture'>
 * jeromeetienne/threex.dynamictexture</a>
 */
export default class CanvTex extends XSys {
	/**
	 * @param {ECS} ecs
	 * @param {x} x {options, ...}
	 * @constructor CanvTex
	 */
	constructor (ecs, x) {
		super(ecs);
		this.camera = x.xcam.XCamera.cam;
		// var ents = ecs.queryEntities({iffall});
		this.xview = x.xview;
		this.refresh = true;
		this.ecs = ecs;
	}

	/**
	 * clear the canvas
	 *
	 * @param {String} [fillStyle] the fillStyle to clear with, if not provided, fallback on .clearRect
	 * @return {CanvTex} the object itself, for chained texture
	 * @member CanvTex#clear
	 * @function
	 */
	clear (fillStyle) {
		// depends on fillStyle
		if( fillStyle !== undefined ){
			this.context.fillStyle	= fillStyle
			this.context.fillRect(0,0,this.canvas.width, this.canvas.height)
		}else{
			this.context.clearRect(0,0,this.canvas.width, this.canvas.height)
		}
		// make the texture as .needsUpdate
		this.texture.needsUpdate	= true;
		// for chained API
		return this;
	}

	/**
	 * execute the drawImage on the internal context
	 * the arguments are the same the official context2d.drawImage
	 *
	 * For parameters, see <a href='https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage'>
	 * MDN CanvasRenderingContext2D.drawImage()</a>
	 * @return {CanvTex} - the object itself, for chained texture
	 * @member CanvTex#drawImage
	 * @function
	 */
	drawImage (/* same params as context2d.drawImage */) {
		// call the drawImage
		this.context.drawImage.apply(this.context, arguments)
		// make the texture as .needsUpdate
		this.texture.needsUpdate = true;
		// for chained API
		return this;
	}

	/** Set new text to entity.
	 * @param {Entity} e
	 * @param {String} txt
	 * @member CanvTex.setext
	 * @function
	 */
	static setext(e, txt) {
		if (e.Dynatex) {
			e.Dynatex.dirty = true;
			e.Dynatex.text = txt;
		}
	}

	/**Update texture of canvas if Dynatex.dirty is true;
	 	*
	 * If the Dynatex.lookScreen is true, also turn it to facing screen.
	 *
	 * This update checking will dynamically update canvas visual results.
	 * @param {int} tick
	 * @param {Array.<Entity>} entities
	 * @member CanvTex#update
	 * @function
	 */
	update(tick, entities) {
		if (this.xview.flag <= 0 && !this.refresh)
			return;
		this.refresh = false;

		for (const e of entities) {
			if ( e.Dynatex && e.Dynatex.dirty) {
				if ( e.Visual.shader !== ShaderFlag.colorArray
					|| !e.Obj3.mesh.material.uniforms
					|| !e.Obj3.mesh.material.uniforms.u_tex )
					console.error('Dyantex needs a colorArray shader with texture to update texture. e = ', e);
				else {
					e.Dynatex.dirty = false;

					var tex = AssetKeepr.drawText(e.Dynatex);
					tex.needsUpdate = true;

					// e.Obj3.mesh.material.map = tex;
					e.Obj3.mesh.material.uniforms.u_tex.value[0] = tex;
				}
			}

			if (e.Dynatex.lookScreen && e.Obj3) {
				// TODO merge with D3Pie?
				var m = e.Obj3.mesh;
				if (m) {
					// snapshot q0
					if (!e.Obj3.transform)
						e.Obj3.transform = {};
					if (!e.Obj3.transform.q0) {
						e.Obj3.transform.q0 = new THREE.Quaternion();
						m.matrix.decompose( buf.p, e.Obj3.transform.q0, buf.s );

						// collect parent's rotation
						var parnt = e.Obj3.group;
						const g = this.ecs.getEntity(parnt);
						if (g && g.Obj3.mesh && g.Obj3.mesh.matrixWorld) {
							g.Obj3.mesh.matrixWorld.decompose( buf.p, buf.q_, buf.s );
							e.Obj3.transform.q0.multiply( buf.q_.conjugate() );
						}
					}

					//
					m.matrix.decompose( buf.p, buf.q, buf.s );
					buf.q.copy(e.Obj3.transform.q0);
					buf.q.multiply(this.camera.quaternion);
					m.matrix.compose( buf.p0, buf.q, buf.s );// p0: rotate at [0, 0, 0]
					m.matrix.setPosition( buf. p );
					m.matrixAutoUpdate = false;
				}
			}
		}
	}
}

CanvTex.query = {iffall};

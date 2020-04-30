
import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index'

import AssetKeepr from '../xutils/assetkeepr.js';
import XSys from './xsys';
import {Visual, Canvas, AssetType} from '../component/visual.js'
import {Obj3, Obj3Type} from '../component/obj3.js'

const iffall = ['Visual', 'Dynatex', 'Obj3'];

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
		// TODO ...
		// var width = 64;
		// var height = 64;

		// var canvas = {};
		// var ctx
		// if (document) {
		// 	canvas = document.createElement( 'canvas' )
		// 	ctx	= canvas.getContext( '2d' )
		// 	// this.texture = new THREE.Texture(canvas)
		// 	this.texture = new THREE.CanvasTexture(ctx.canvas);
		// 	this.canvas = canvas
		// 	this.context = ctx
		// }
		// canvas.width = width
		// canvas.height = height

		// this.count = 0;
		var ents = ecs.queryEntities({iffall});
		// this.init(ecs, ents);
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

	// init (ecs, entities) {
	// 	for (const e of entities) {
	// 		// e.Obj3.mesh.material.map = this.texture;
	// 		CanvTex.setext(e, e.Dynatex.text); // any performance issue?
	// 	}
	// }

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

	/**
	 * @param {int} tick
	 * @param {Array.<Entity>} entities
	 * @member CanvTex#update
	 * @function
	 */
	update(tick, entities) {
		// this.count++;
		// this.clear('white');
		// this.drawText(`${this.count}`, 5, 22, 'red');
		for (const e of entities) {
			if (e.Dynatex && e.Dynatex.dirty) {
				e.Dynatex.dirty = false;

				var tex = AssetKeepr.drawText(e.Dynatex);
				tex.needsUpdate = true;
				// e.Dynatex.tex = tex;
				e.Obj3.mesh.material.map = tex;
			}
		}
	}
}

CanvTex.query = {iffall};

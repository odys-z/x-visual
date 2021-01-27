
import * as THREE from '../../../packages/three/three.module-MRTSupport';
import * as ECS from '../../../packages/ecs-js/index'

import AssetKeepr from '../xutils/assetkeepr.js';
import {Visual, Canvas, AssetType} from '../../component/visual.js'
import {Obj3, Obj3Type} from '../../component/obj3.js'

/**
 * A helper class for creating text label in 3d scene.
 * @class Textag
 * @classdesc
 * Combine multiple texute include a text canvas, multiple (svg) image texture.
 * The text canvas can not be transparent.
 *
 */
export default class Textag {
	/**
	 * @param {ECS} ecs
	 * @param {x} x {options, ...}
	 * @constructor Textag
	 */
	constructor (ecs, x) {
		super(ecs);
		this.camera = x.xcam.XCamera.cam;
		this.xview = x.xview;
		this.refresh = true;
		this.ecs = ecs;
	}

	/**
	 * @param {array.<{text: string, pos: array}>} texts [].pos position in xworld
	 * @param {obejct} options
	 * tagsize {array}: plane geometry, [width, height];<br>
	 * textbox {object}: x, y, size, same as {@link XComponent.Dynatex}.xywh, default {x: 0, y: 0, size: 32};<br>
	 * lookScreen {bool}: facing screen;<br>
	 * offset {array}: [x, y, z] offset to text position;<br>
	 * svg-assets: {asset: url, nodes: [string]}}
	 * @return {array.<object>} entitie definitions
	 * @member Textag.createTags
	 * @function
	 */
	static createTags (texts, options) {
		var entities = [];
		if (!options || !Array.isArray( options.tagsize ))
			throw new XError( "Textag must has parameter tagsize." );

		var box = options.tagsize;
		var translate = options.offset ? options.offset : [0, box[1]/2, box[2]/2];
		var xywh = Object.assign( {x: 0, y: 0, size: 32}, options.textbox );
		var lookScreen = !!options.lookScreen;
		var font = options.font || 'Arial';
		var style = options.color || options.font || 'grey';

		for (var txt of texts) {
			var id = tagUuid();
			entities.push( {
				id,
				Obj3: { geom: xv.XComponent.Obj3Type.PLANE,
						box,
						transform: [ { translate: vec3.add(txt.pos, translate) } ] },
				Visual:{vtype: xv.AssetType.mesh},
				Dynatex: {text: txt.text,
						xywh, lookScreen, font, style,
						svgs: options.svgs,
						dirty: true },
			} );

			// var bg1 = ecs.createEntity({
			// 	id: id + '-bg',
			// 	Obj3: { geom: xv.XComponent.Obj3Type.PLANE,
			// 			box: [128, 128],
			// 			transform: [ {translate: [0, -60, 0] } ],
			// 			group: id },
			// 	Visual:{vtype: xv.AssetType.mesh,
			// 			asset: 'tex/uestc.svg'},
			// });
		}

		return entities;
	}

	/**
	 * clear the canvas
	 *
	 * @param {String} [fillStyle] the fillStyle to clear with, if not provided, fallback on .clearRect
	 * @return {Textag} the object itself, for chained texture
	 * @member Textag#clear
	 * @function
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
	 */

	/** Set new text to entity.
	 * @param {Entity} e
	 * @param {String} txt
	 * @member Textag.setext
	 * @function
	static setext(e, txt) {
		if (e.Dynatex) {
			e.Dynatex.dirty = true;
			e.Dynatex.text = txt;
		}
	}
	 */

	/**Update texture of canvas if Dynatex.dirty is true;
	 *
	 * If the Dynatex.lookScreen is true, also turn it to facing screen.
	 *
	 * This update checking will dynamically update canvas visual results.
	 * @param {int} tick
	 * @param {Array.<Entity>} entities
	 * @member Textag#update
	 * @function
	update(tick, entities) {
		if (this.xview.flag <= 0 && !this.refresh)
			return;
		this.refresh = false;

		for (const e of entities) {
			if (e.Dynatex && e.Dynatex.dirty) {
				e.Dynatex.dirty = false;

				var tex = AssetKeepr.drawText(e.Dynatex);
				tex.needsUpdate = true;
				e.Obj3.mesh.material.map = tex;
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
	 */
}

/**For generating uuid.
 * @memberof Textag
 */

var taguuid = 0;
/**Get a tag entity id.
 * @memberof Textag */
function tagUuid() {
	return `tg-${++taguuid}`;
}

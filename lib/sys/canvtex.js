
import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index'

import AssetKeepr from '../xutils/assetkeepr.js';
import XSys from './xsys';
import Thrender from './thrender';
import {Visual, Canvas, AssetType, ShaderFlag} from '../component/visual.js'
import {Obj3, Obj3Type} from '../component/obj3.js'

/**
 * @property {array} iffall - query condition: {iffall: ['Visual', 'Dynatex', 'Obj3']}
 * @member CanvTex#iffall
 */
const iffall = ['Visual', 'Dynatex', 'Obj3'];

const buf = {p0: new THREE.Vector3(),    // usually for pos
			 p : new THREE.Vector3(),    // usually for pos
			 q : new THREE.Quaternion(), // usually for quaternion
			 q_: new THREE.Quaternion(), // quaternion conjugate
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
		this.xview = x.xview;
		this.refresh = true;
		this.ecs = ecs;

		// add a plane to Obj3
		var ents = ecs.queryEntities({iffall});
		this.init(ents);
	}

	/**Create text planes.
	 * Each plane is rendered with xshader colorArray.
	 * @param {array.<[Entity]>} entities
	 * @member CanvTex.init
	 * @function
	 */
	init(entities) {
		if (!entities) return this;

		for (const e of entities) {
			var {mesh, vparas} = createTextPlane( e.Obj3, e.Visual, e.Dynatex );
			if (e.Obj3.mesh)
			 	e.Obj3.mesh.add(mesh);
			else if (e.Obj3)
				e.Obj3.add(mesh);
			else //
				console.warn('Why parent object is null?');
			e.Dynatex.dirty = true;

			if (e.Visual.vtype === AssetType.Extension) {
				e.Visual.shader = ShaderFlag.colorArray;
				e.Visual.paras = Object.assign(e.Visual.paras || new Object(), vparas);
			}

		}
		return this;

		function createTextPlane( obj3, visual, dynatex ) {
			var uniforms = Object.assign(new Object(), obj3.uniforms);
			uniforms = Object.assign(uniforms, visual.uniforms);

			var u_tex = dynatex.u_tex ? dynatex.u_tex : [];
			u_tex.push( 'data:application/x-visual+img,gray-pixel' );

			var vparas = {
				colors: [dynatex.hue || [0, 0, 0]],
				u_texWeight: dynatex.u_texWeight === undefined ? 1 : dynatex.u_texWeight,
				u_tex};
			var mat = Thrender.createXShaderMaterial(ShaderFlag.colorArray, uniforms, vparas);

			var w = dynatex.xywh.w;
			// using 'h' instead of 'size' is a frequently found mistake
			var h = dynatex.xywh.h || (dynatex.xywh.size  + (dynatex.xywh.margin || 0) * 2);

			var m = Thrender.createObj3mesh({box: [w, h]}, Obj3Type.PLANE, mat);

			// transform
			var margin = dynatex.xywh.margin || 0;
			var y0 = obj3.box[1] || 0;
			var valign = dynatex['v-align'];
			if (!valign) valign = 'top';
			if (valign === 'top')
				y0 = y0/2 - h/2;
			else if (valign === 'bottom')
				y0 = -y0/2 + h/2;
			// 'middle'
			else y0 = 0;

			var transform = [ { translate: [0, y0, 0] } ];
			// var transform = [ { translate: [0, 96, 0] } ];
			Thrender.applyTransform( m, transform );
			Thrender.applyTransform( m, dynatex.transform );

			dynatex.textplane = m;
			return {mesh: m, vparas: vparas};
		}
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
			if ( e.Dynatex && e.Dynatex.dirty ) {
				if ( !e.Dynatex.textplane )
					// || !e.Obj3.mesh.material.uniforms
					// || !e.Obj3.mesh.material.uniforms.u_tex )
					console.error('Dyantex.textplane is not ready when updating?', e);
				else {
					e.Dynatex.dirty = false;

					var tex = AssetKeepr.drawText(e.Dynatex);
					tex.needsUpdate = true;

					var l = e.Dynatex.textplane.material.uniforms.u_tex.value.length;
					e.Dynatex.textplane.material.uniforms.u_tex.value[l - 1] = tex;
				}
			}

			if (e.Dynatex.lookScreen && e.Obj3) {
				// TODO merge with D3Pie?
				var m = e.Obj3.mesh;
				if (m) {
					// snapshot q0
					if (!e.Obj3.transform)
						e.Obj3.transform = new Object();
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

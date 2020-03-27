/** @namespace xv.ecs.sys.ext */

import AssetKeepr from '../../xutils/assetkeepr.js';
import XSys from '../xsys';
import {Visual, Canvas, AssetType} from '../../component/visual.js'
import {Obj3, Obj3Type} from '../../component/obj3.js'

const iffall = ['Visual', 'Canvas', 'Obj3'];
/**Rendering html content as dynamic texture.
 *
 * This system take each entity with one and only one html content, then rendering
 * to multiple THREE.Object3D in scene with help of xv.ecs.sys.Thrender.
 *
 * Htmltex is an extension of ECS.subsystems. User must add it to ECS explicitly.
 * To create a new instance, entities definition must provided as options arg of
 * constructor.
 *
 * These definition can be generated with help of Htmltex.createEntityDefs()
 * For exmaple, see htmltex.case.js
 *
 * @class Htmltex
 */
export default class Htmltex extends XSys {
	/**
	 * @param {ECS} ecs
	 * @param {object} options
	 * @constructor
	 */
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// keeping canvas map for update later
		this.canvas = {};
		var canvEnts = ecs.queryEntities({iffall});
		for(var e of canvEnts) {
			this.canvas[e.Canvas.domId] = e.Canvas;
		}
	}

	/**
	 * @param {int} tick
	 * @param {Entity[]} entities
	 * @member Htmltex#refresh
	 * @function
	 */
	update(tick, entities) {
		for (const e of entities) {
			var m = e.Obj3.mesh
			if (e.Canvas.dirty && m) {
				e.Canvas.dirty = false;
				e.Canvas.tex.needsUpdate = true;
				m.material.map = e.Canvas.tex;
			}
		}
	}

	/**
	 * @param {string} htmlId
	 * @param {function} onRefresh
	 * @member Htmltex#refresh
	 * @function
	 */
	refresh(htmlId, onRefresh) {
		const canv = this.canvas[htmlId];
		if (!canv) {
			console.error(`Htmltex.refresh(${htmlId}): component not found.`);
		}
		else {
			AssetKeepr.loadCanvtex(canv, undefined, onRefresh);
		}
	}

	/**
	 * @param {object} options
	 * options.objcanvas: array of [{domId, eid, texsize, visual}]<br>
	 * where<br>
	 * *objcanvas.domId*: string - canvs id for texture<br>
	 * *objcanvas.eid*: string - optinal<br>
	 * *objcanvas.texsize*: {width, height} - optinal, default 256x256<br>
	 * *objcanvas.visual*: {vtype: AssetType} - optional, default AssetType.canvas<br>
	 * Other types are not supported.
	 * @return {array<object>} entity definitions
	 * @member Htmltex.createEntityDefs
	 * @function
	 */
	static createEntityDefs(options) {
		const entDefines = [];
		options.objcanvas.forEach(function(def, dx) {
			if (def.eid === undefined)
				def.eid = h5uuid();

			const wh = Object.assign({width: 256, height: 256},
				def.texsize || def.wh);

			const obj3 = Object.assign({
					geom: Obj3Type.PLANE,
					box: [wh.width, wh.height, 0],	// plane size
					mesh: undefined },	// Thrender will handle this
				options.obj3);

			const vis = Object.assign({vtype: AssetType.canvas },
				def.visual || def.Visual);

			var entidef = { id: def.eid,
							Obj3: obj3,
							Visual: vis,
							Canvas: {domId: def.domId,
									 options: wh,	// buffer texture canvas size
									},
						  };
			entDefines.push(entidef);
		});
		return entDefines;
	}
}

Htmltex.query = { has: iffall };

var myH5uuid = 0;
/**
 * @memberof Htmltex */
function h5uuid() {
	return `htmltex-${myH5uuid++}`;
}

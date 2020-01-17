/** @module xv.ecs.sys */

import AssetKeepr from '../xutils/assetkeepr.js';
import XObj from './xobj';
import {Visual, Canvas, AssetType} from '../component/visual.js'
import {Obj3, Obj3Type} from '../component/obj3.js'

/**Rendering html content as dynamic texture.
 * This system take each entity with one and only on html content, then rendering
 * to multiple THREE.Object3D in scene with help of xv.ecs.sys.Thrender.
 *
 * TODO docs
 * ---------
 * Htmltex is an extension of ECS.subsystems. User must add it to ECS explicitly.
 * To create a new instance, entities definition must provided as options arg of
 * constructor.
 * These definition can be generated with help of Htmltex.createEntityDefs()
 * For exmaple, see htmltex.case.js
 *
 * @class
 */
export default class Htmltex extends XObj {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// this.entitys = this.initCanvas(ecs, options);
		// keeping canvas map for update later
		this.canvas = {};
		if (options.entDefines) {
			for (var d of options.entDefines) {
				this.canvas[d.Canvas.domId] = d;
			}
		}
		else {
			console.error('No Canvas components?');
		}
	}

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

	// initCanvas(ecs, options) {
	// 	const obj3 = Object.assign({
	// 			geom: Obj3Type.PLANE,
	// 			box: [100, 100, 0],	// bounding box also plane size
	// 			mesh: undefined },	// Thrender will handle this
	// 		options.obj3);
	//
	// 	const wh = Object.assign({width: 256, height: 256},
	// 		options.texsize);
	//
	// 	const eid = options.eid || 'screen1';
	//
	// 	if (ecs) {
	// 		var plane = ecs.createEntity({
	// 			id: eid,
	// 			Obj3: obj3,
	// 			Visual: {vtype: AssetType.canvas },
	// 			Canvas: {domId: options.domId,
	// 					 options: wh,	// buffer texture canvas size
	// 					},
	// 		});
	// 		return plane;
	// 	}
	// }

	refresh(htmlId) {
		// if (typeof htmlId === 'string') {
		// 	AssetKeepr.initCanvtex(this.entitys[htmlId].Canvas);
		// }
		// else {
		// 	const ents = Object.values(this.entitys);
		// 	if (ents && ents.length > 0) {
		// 		ents.forEach(function(e, ix) {
		// 			AssertKeepr.initCanvtex(e.Canvas, this.tick);
		// 		});
		// 	}
		// }
		AssetKeepr.initCanvtex(this.canvas[htmlId], 0);
	}

	static createEntityDefs(options) {
		const entDefines = [];
		options.objcanvas.forEach(function(def, dx) {
			if (def.eid === undefined)
				def.eid = h5uuid();

			const obj3 = Object.assign({
					geom: Obj3Type.PLANE,
					box: [100, 100, 0],	// bounding box also plane size
					mesh: undefined },	// Thrender will handle this
				options.obj3);

			const wh = Object.assign({width: 256, height: 256},
				def.texsize || def.wh);

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

Htmltex.query = { has: ['Visual', 'Canvas', 'Obj3'] };

var myH5uuid = 0;
function h5uuid() {
	return `htmltex-${myH5uuid++}`;
}

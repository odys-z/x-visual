/** @module xv.ecs.sys */

import * as ECS from '../../packages/ecs-js/index';
import XObj from './xobj';

/**
 * @class
 */
export default class Htmltex extends XObj {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		this.entity = this.initCanvas(options.domId, ecs, options.xscene);
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

	initCanvas(domId, ecs, scene) {
		if (ecs) {
			var plane = ecs.createEntity({
				id: 'screen1',
				Obj3: { geom: xv.XComponent.Obj3Type.PLANE,
						box: [100, 100, 0],		// bounding box also plane size
						mesh: undefined },		// Thrender will handle this
				Visual: {vtype: xv.AssetType.canvas },
				Canvas: {domId: domId,
						 options: {width: 256, height: 256}, // buffer tex size
						},
			});
			return plane;
		}
	}

	refresh() {
		xv.AssetKeepr.initCanvtex(this.entity.Canvas);
	}
}

Htmltex.query = { has: ['Visual', 'Canvas', 'Obj3'] };

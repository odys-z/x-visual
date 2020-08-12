import * as ECS from '../../packages/ecs-js/index'
import {x} from '../xapp/xworld'
import {XError} from '../xutils/xcommon'

import {CBoundCubes} from '../component/ext/geo'
import XSys from '../sys/xsys'
import xgeom from '../xmath/geom'
import AssetKeepr from '../xutils/assetkeepr'
import Thrender from '../sys/thrender'

import {AssetType, ShaderFlag} from '../component/visual'

class Buildings {

}

const iffall = {iffall: ['CBoundCubes']};

export class BoundingCubes extends XSys {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// ecs.registerComponent('CBoundCubes', CBoundCubes );

		var ents = ecs.queryEntities(iffall);
		this.init(ents);
	}

	init(entities) {
		for (var e of entities) {
			if (!e.Visual.paras)
				e.Visual.paras = {};
			if (e.CBoundCubes.only)
				e.Obj3.filter = e.CBoundCubes.only;

			// AssetKeepr will ignore features other than properties.area = 'virtual'
			// TODO can be extended to Obj3 ?

			if (e.CBoundCubes.area) {
				if (e.CBoundCubes && !e.Visual.paras.features)
					e.Visual.paras.features = [];
				var fs = e.CBoundCubes.area.features;
				for (var f of fs) {
					if (f.properties.area === 'virtual') {
						var points = f.geometry.coordinates;
						// area plane
						e.Visual.paras.features.push( {
							properties: {height: f.properties.height},
							geometry: {coordinates: points} } );

						// area boxes
						e.Visual.paras.features = createBoxes(
							e.Visual.paras.features, points, // xzwh, loc,
							f.properties.boxes || e.CBoundCubes.boxes,
							f.properties.boxHeight);

						if (!e.Visual.paras.geostyle)
							e.Visual.paras.geostyle = {};
					}
				}
			}
			else if (e.CBoundCubes.uri) {
				if (e.Visual) {
					e.Visual.paras.uri = e.CBoundCubes.uri;
					e.Visual.paras.boxes = e.CBoundCubes.boxes;
					e.Visual.paras.onFeature = ( ctx, f, featOpt, vFeatures ) => {
						if (f.properties && f.properties.area === 'virtual') {
							// create area virtual boxes
							// FIXME what about area has multiple polygon?
							var {xzwh, loc} = xv.xgeom.xzBox(f.geometry.coordinates[0]);

							var boxes = createBoxes(vFeatures, // Visual.paras.features
										f.geometry.coordinates, featOpt.boxes );
							for (var box of boxes) {
								// referencing parent's options except geoCentre
								var opts = Object.assign(
									{geoCentre: [ loc[0] + featOpt.geoCentre[0],
												  loc[1] + featOpt.geoCentre[1] ] },
									featOpt);
								opts.height = f.properties.boxHeight !== undefined ?
									f.properties.boxHeight :
									featOpt.geostyle ? featOpt.geostyle.height || 1 : 1;
								xv.AssetKeepr.feature2Prism(ctx, box, opts);
							}
						}
					}
				}
			}
		}

		function createBoxes (target, srcArea, box, heightScale) {
			var fs = target || [];

			for (var points of srcArea) {
				var {xzwh, loc} = xgeom.xzBox(points);
				for (var [x, z, w, d, h] of box) {
					x = xzwh.x + xzwh.w * x;
					z = xzwh.z + xzwh.h * z;
					w = xzwh.w * Math.abs(w);
					d = xzwh.h * Math.abs(d);
					h = Math.abs(h) * (heightScale === undefined ? 1 : heightScale);

					fs.push( {
						properties: { height: h },
						geometry: { coordinates: [[[x, z], [x+w, z], [x+w, z+d], [x, z+d]]] } } );
				}
			}
			return fs;
		}
	}

	update(tick, entities) {
	}
}

BoundingCubes.query = iffall;

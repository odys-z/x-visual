import * as ECS from '../../packages/ecs-js/index'
import {x} from '../sys/xapp/xworld'
import {XError} from '../xutils/xcommon'

import XSys from '../sys/xsys'
import xgeom from '../xmath/geom'
import AssetKeepr from '../xutils/assetkeepr'
import Thrender from '../../sys/thrender'

import {AssetType, ShaderFlag} from '../component/visual'

class Buildings {

}

const iffall = {iffall: ['BoundCubes']};

export class BoundingCubes extends XSys {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		var ents = ecs.queryEntities(iffall);
		this.init(ents);
	}

	init(entities) {
		for (var e of entities) {
			if (e.BoundCubes && !e.Visual.paras.features)
				e.Visual.paras.features = [];
			if (e.BoundCubes.area) {
				var fs = e.BoundCubes.area.features;
				for (var f of fs) {
					if (f.properties.area === 'virtual') {
						// if (!e.Visual.paras.features)
						// 	e.Visual.paras.features = [];

						var points = f.geometry.coordinates;
						// area plane
						e.Visual.paras.features.push( {
							properties: {height: f.properties.areaHeight},
							geometry: {coordinates: points} } );

						// area boxes
						createBoxes(e.Visual.paras, points, // xzwh, loc,
							f.properties.boxes || e.BoundCubes.boxes);
					}
				}
			}
			else if (e.BoundCubes.uri) {
				if (e.Visual) {
					if (!e.Visual.paras)
						e.Visual.paras = {};
					e.Visual.paras.uri = e.BoundCubes.uri;
					e.Visual.paras.onFeature =
						( ctx, f ) => {
							if (f.properties.area === 'virtual') {
								// if (!e.Visual.paras.features)
								// 	e.Visual.paras.features = [];

								// create area virtual boxes
								var boxes = createBoxes(e.Visual.paras, // xzwh, loc,
											f.geometry.coordinates, e.BoundCubes.boxes );
								for (var box of boxes) {
									var opts = Thrender.formatPrismOption(e.Visual.paras);
									opts.height = f.properties.boxHeight !== undefined ?
										f.properties.boxHeight :
										e.Visual.paras.geostyle ? e.Visual.paras.geostyle.height || 1 : 1;
									AssetKeepr.feature2Prism(ctx, box, opts);
								}
							}
						}
				}
			}
		}

		function createBoxes (target, srcArea, config) {
			var fs = target.features;
			// var mxheight = target.maxHeight || 100;

			for (var points of srcArea) {
				var {xzwh, loc} = xgeom.xzBox(points);
				for (var [x, z, w, d, h] of config) {
					x = xzwh.x + xzwh.w * x;
					z = xzwh.z + xzwh.h * z;
					w = xzwh.w * Math.abs(w);
					d = xzwh.h * Math.abs(d);
					h = Math.abs(h);

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

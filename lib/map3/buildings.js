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

		ecs.registerComponent('CBoundCubes', CBoundCubes );

		var ents = ecs.queryEntities(iffall);
		this.init(ents);
	}

	init(entities) {
		for (var e of entities) {
			if (!e.Visual.paras)
				e.Visual.paras = {};

			if (e.CBoundCubes.area) {
				if (e.CBoundCubes && !e.Visual.paras.features)
					e.Visual.paras.features = [];
				var fs = e.CBoundCubes.area.features;
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
							f.properties.boxes || e.CBoundCubes.boxes);
					}
				}
			}
			else if (e.CBoundCubes.uri) {
				if (e.Visual) {
					e.Visual.paras.uri = e.CBoundCubes.uri;
					e.Visual.paras.onFeature = ( ctx, f, featOpt, vFeatures ) => {
						if (f.properties.area === 'virtual') {
							// create area virtual boxes
							// FIXME what about area has multiple polygon?
							var {xzwh, loc} = xv.xgeom.xzBox(f.geometry.coordinates[0]);

							var boxes = createBoxes(vFeatures, // Visual.paras.features
										f.geometry.coordinates, featOpt.boxes );
							for (var box of boxes) {
								// var opts = xv.Thrender.formatPrismOption(featOpt);
								var opts = featOpt;
								opts.geoCentre = [ loc[0] + featOpt.origin[0],
												   loc[1] + featOpt.origin[1] ];
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

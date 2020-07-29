class Buildings {

}

const iffall = {iffall: ['BoundCubes']};

class BoundingCubes extends xv.XSys {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		var ents = ecs.queryEntities(iffall);
		this.init(ents);
	}

	init(entities) {
		for (var e of entities) {
			if (e.VirtualCubes.area) {
				// TODO
			}
			else if (e.VirtualCubes.uri) {
				if (e.Visual) {
					if (!e.Visual.paras)
						e.Visual.paras = {};
					e.Visual.paras.uri = e.VirtualCubes.uri;
					e.Visual.paras.onFeature =
						( ctx, f ) => {
							if (f.properties.area === 'virtual') {
								// create area virtual boxes
								if (!e.Visual.paras.features)
									e.Visual.paras.features = [];

								var boxes = createBoxes(e.Visual.paras, // xzwh, loc,
											f.geometry.coordinates, e.VirtualCubes.boxes );
								for (var box of boxes) {
									var opts = xv.Thrender.formatPrismOption(e.Visual.paras);
									opts.height = f.properties.boxHeight !== undefined ?
										f.properties.boxHeight :
										e.Visual.paras.geostyle ? e.Visual.paras.geostyle.height || 1 : 1;
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
				var {xzwh, loc} = xv.xgeom.xzBox(points);
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

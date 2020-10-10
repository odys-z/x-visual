/**<h3>JS lib for showing, projecting osm tiles into 3D scene.</3>
 * <p> For OSM tiles, see <a href='https://wiki.openstreetmap.org/wiki/Zoom_levels'>
 * OSM XYZ</a></p>
 * <p> For Mercator Projection, see
 * <a href='https://en.wikipedia.org/wiki/Mercator_projection#Cylindrical_projections'>
 * wikipedia: Mercator Projection</a></p>
 *
 */

import * as THREE from '../../packages/three/three.module-r120';

const blankMaterial = new THREE.MeshBasicMaterial(
						{color: 0xc0c0c0, side: THREE.DoubleSide} );

/*
 * @class ThreeWrapper
 */
class ThreeWrapper {
	/**Create a position buffer represting the segments vertices.
	 * @param {THREE.Camera} cam the camera position - camera position must initialized,
	 * @param {object} sects {w, h, sx, sy} section definition,
	 * width, height, width segment, height segment
	 * @return {Float32Array} the dir verices buffer, in world
	 */
	static getRayDirs (cam, sects) {
		var castsGeom = new THREE.PlaneBufferGeometry (
							sects.w, sects.h, sects.sx || 2, sects.sy || 2);
		/* in this geometry, all z is zero
		For w =4, h = 3, poses =
		0:  -2  1.5 0
		3:   0  1.5 0
		6:   2  1.5 0
		9:  -2   -0 0
		12:  0   -0 0
		15:  2   -0 0
		18: -2 -1.5 0
		21:  0 -1.5 0
		24:  2 -1.5 0 */
		var poses = castsGeom.attributes.position;

		for ( var ix = 0; ix < poses.count; ix++ ) {
			var v = new THREE.Vector3(poses.getX(ix),
						poses.getY(ix), poses.getZ(ix));

			v.applyMatrix4(cam.matrixWorld);

			v = Vec3.minus(v, cam.position);

			poses.setXYZ(ix, v[0], v[1], v[2]);
		};
		return poses;
	}

	static createTileMesh (center, tile, xyz) {
		tile.mesh = new THREE.Mesh(ThreeWrapper.geom(center), blankMaterial);
		tile.mesh.name = `${xyz[2]}-${xyz[0]}-${xyz[1]}`
		return tile
	}

	/**Create plane geometry for tile, world position is translated according to
	 * world center (c0).
	 * @param {array} c0 world centre, [x, y, z]
	 * @return {THREE.PlaneBufferGeometry} plane geometry
	 */
	static geom (c0) {
		if (c0 === undefined)
			c0 = [0, 0, 0];
		// FIXME What's w & h?
		var g = new THREE.PlaneBufferGeometry( 500, 500 );
		// g.rotateX(-Math.PI * 0.5);
		//g.rotateY(Math.PI * 0.5);
		g.applyMatrix( new THREE.Matrix4()
		 					.makeTranslation(c0[0], c0[1], c0[2]) );
		return g;
	}
}

/** Earth Radius hold by OSM,
 * see <a href='https://wiki.openstreetmap.org/wiki/Zoom_levels'>osm wiki: zoom level</a>
 *
 * TODO use EPSG parameters as a common module.
 * */
export const R = 6372.7982;

const rad_degree = Math.PI / 180;

export const OsmOptions = {
			osmServ: 'https://a.tile.openstreetmap.org/'};

/**<p>Helper for axis convertion or OSM tiles calculation.</p>
 * <p>OsmUtils only handle vector in GeoCoord system.</p>
 * <img src='https://raw.githubusercontent.com/odys-z/O3/master/lib/osm/res/coords.jpg'></img>
 * <p><a href='https://github.com/odys-z/O3/blob/master/lib/osm/README.md'>References</a></p>
 * @class
 */
class OsmUtils {
	constructor(verbos, osmOpts) {
		OsmUtils.verbose = verbos || 5;
		if (osmOpts)
			Object.assign(OsmOptions, osmOpts);
	}


	/**Convert long-lat to world position in Cartesian.
	 * <img src='https://raw.githubusercontent.com/odys-z/O3/master/lib/osm/res/coords.jpg'></img>
	 * @param {number} long longitude in radians ( degree *= pi / 180)
	 * @param {number} lat latitude in radians ( degree *= pi / 180)
	 * @param {number} a a of Mercator Projection, see
	 * <a href=https://en.wikipedia.org/wiki/Mercator_projection#Cylindrical_projections'>Mercator Projection</a>
	 * @return {object} x, y, z in world
	 */
	static rad2cart(long, lat, a) {
		a = a || R;
		var r = a * Math.cos(lat);
		var x = r * Math.sin(long);
		var y = a * Math.sin(lat);
		var z = r * Math.cos(long);
		return {x : x, y: y, z: z};
	}

	static rad2cartDegree(long, lat, a) {
		return OsmUtils.rad2cart( rad_degree * long, rad_degree * lat, a);
	}

	/**See https://keisan.casio.com/exec/system/1359533867
	 * and https://en.wikipedia.org/wiki/Spherical_coordinate_system
	 * @param {object} p position {x, y, z}
	 * @param {object} c0 center (x, y, z)
	 * @return {object} {lon, lat, r}
	 */
	static cart2rad (p, c0) {
		if (c0 === undefined)
			c0 = {x: 0, y: 0, z: 0};
		var x = p.x - c0.x;
		var y = p.y - c0.y;
		var z = p.z - c0.z;

		var r = Math.sqrt(x * x + y * y + z * z);

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
		// The Math.atan2() function returns the angle in the plane (in radians)
		// between the positive x-axis and the ray from (0,0) to the point (x,y),
		// for Math.atan2(y,x)
		/* backup
		var phi = Math.atan2(-z, x); // x = 0, z = a, phi = 0, it's -90;

		if (x > r) x = r;
		if (x < -r) x = -r;
		// ∀x∊[-1;1],
		// Math.acos(x) = arccos(x) = the unique y∊[0;π] such that cos(y) = x
		var theta = Math.PI / 2 - Math.acos( y / r);

		// with prime meridian at z = 0, x = R, y = 0, to north, negative z to the east hemishphere.
		return {long: phi, lat: theta, r};
		*/

		// x = 0, y = a, phi = Pi/2,
		// x = a, y = 0, phi = 1, should be
		var phi = Math.atan2(y, x); // x = 0, y = a, phi = 0, it's -90;

		if (z > r) z = r;
		if (z < -r) z = -r;

		var lambda = Math.acos( z / r );
		if (x < 0)
			lambda = -lambda
		return {lon: lambda, lat: phi, r};
	}

	static long2tile (lon, zoom1) {
	    var tt = Number(lon);
	    return (Math.floor((tt + 180) / 360 * Math.pow(2, zoom1)));
	}

	static lat2tile (lat, zoom2) {
	    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180)
	        + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom2)));
	}

	static tile2long (x, z) {
	    return (x / Math.pow(2, z) * 360 - 180);
	 }

	static tile2lat (y, z) {
	    var n=Math.PI - 2 * Math.PI * y / Math.pow(2, z);
	    return (180 / Math.PI * Math.atan( 0.5 *( Math.exp(n) - Math.exp(-n))));
	}

	/**Get tile url of OSM X/Y/Z.
	 * url = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	static urlTile (x, y, z) {
	    // return `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;
	    return `${OsmOptions.osmServ}/${z}/${x}/${y}.png`;
	}

	/**Set img (#id)'s src as tile of OSM X/Y/Z.
	 * src = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
	 * @param {string} id img id
	 * @param {object} xyz {x, y, z}
	 */
	static loadImgTile(id, xyz) {
		// map.addMapTiles('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png');
	    // var url = `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;
	    var url = urlTile(xyz.x, xyz.y, xyz.z);
	    document.querySelector(`#${id}`).src = url;
	}

	/**Find out sphere intersect point with ray.
	  * @param {vec3} eye camera position in world
	  * @param {vec3} dir direction norm
	  * @param {float} r sphere radius
	  * @param {vec3} c0 shpere center position in world
	  * @return {object} (x, y, z, w): intersect position in world, w = distance from eye
	 */
	static castPosition(eye, dir, r, c0) {
		r = r || R;
		if (c0 === undefined) {
			c0 = [0, 0, 0];
		}

		var d = this.distSphere(eye, dir, r, c0);
		if (d < 0)
			return;
		else {
			var p = [d * dir[0], d * dir[1], d * dir[2]];
			// return [p[0] + eye[0], p[1] + eye[1], p[2] + eye[2]];
			return {x: p[0] + eye[0], y: p[1] + eye[1], z: p[2] + eye[2], w: d};
		}
	}

	/**Vector distance  to orignal point.
	 * See https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
	 * @param {vec3} eye camera position in world
	 * @param {vec3} l direction, will be normalized
	 * @param {float} r sphere radius
	 * @param {vec3} cent shpere center position in world
	 * @return distance
	 */
	static distSphere( eye, l, r, cent ) {
		l = this.normalize(l);
		// e = o - c, where o = eye, c = cent
		var e = [eye[0] - cent[0], eye[1] - cent[1], eye[2] - cent[2]];
		// delta = (l . (o - c))^2 + r^2 - |(o - c)|^2
		var delta = Math.pow( Vec3.dot( l, e ), 2. ) + Math.pow( r, 2. ) - Vec3.dot( e, e );
		if (delta < 0.) return delta;
		// d = - u.e +/- delta^0.5
		delta = Math.pow( delta, 0.5 );
		var dotprod = Vec3.dot( l, e );
		// return Math.min( - this.dot( l, e ) + delta, - this.dot( l, e ) - delta );
		return Math.min( - dotprod + delta, - dotprod - delta );
	}

	/**Find OMS zoom level according to distance.
	 * @param {number} d distance
	 * @param {number} a
	 * @return {int} z */
	static stepz(d, a) {
		// z ∊ [0, 19), see https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Zoom_levels
		// d = 2a, z = 0
		// d = a,  z = 1
		// d = a / 2, z = 2
		// ...
		// d = 0,  z = 19
		if (d <= 1.0e-15) { return 19; }
		else {
			var z = Math.floor(Math.log2(a * 2 / d));
			console.log ('d, a, z', d, a, z);
			return Math.round(z);
		}
	}

	/**Normalize vector v - v0
	 * @param {vec3} v
	 * @param {vec3} v0
	 * @return {vec3} norm [x, y, z]
	 */
	static normalize( v, v0 ) {
		if ( v0 === undefined )
			v0 = [0, 0, 0];

		v = [v[0] - v0[0], v[1] - v0[1], v[2] - v0[2]];
		var mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
		if (mag - 0. < 0.0000000001) {
			console.warn('magnitude is too small to find norm: ', v, v0);
			return [0, 0, 1];
		}
		else {
			return [v[0] / mag, v[1] / mag, v[2] / mag];
		}
	}

	/**Step through all tile girds, then change longitude / latitude to Cartesian,
	 * with prime meridian at z = 0, x = R, y = 0, to north, negative z to the east hemishphere.
	 * @param {number} OSM Z level
	 * @param {number} a model's radius
	 * see https://en.wikipedia.org/wiki/Mercator_projection#Cylindrical_projections
	 * @return {Float32Array} the verices buffer
	 * For z = 6, the closest points include:<pre>
	 	left
		2973: -48.77, 48.93, 495.20
		2976: -49.01, 0, 497.59
		2979: -48.77, -48.93, 495.20

		center
		3168: 3.0e-14, 0, 500

		right
		3549: 97.08, 48.93, 488.04
		3552: 97.55, 0, 490.39
		3555: 97.08, -48.93, 488.04</pre>
	 */
	static osmGlobeTiles (zoom, a) {
		// X goes from 0 (left edge is 180 °W) to 2zoom − 1 (right edge is 180 °E)<br>
		// Y goes from 0 (top edge is 85.0511 °N) to 2zoom − 1 (bottom edge is 85.0511 °S) in a Mercator projection
		zoom = Math.min(zoom, 8);
		var max = Math.pow(2, zoom);
		var grids = new Float32Array( max * max * 3 );
		for (var ix = 0; ix < max; ix++) {
			var long = tile2long(ix, zoom);
			long *= Math.PI / 180;
			for (var iy = 0; iy < max; iy++) {
				var lat = tile2lat(iy, zoom);
				lat *= Math.PI / 180;
				// var r = a * Math.cos(lat);
				// var x = r * Math.cos(long);
				// var y = a * Math.sin(lat);
				// var z = -r * Math.sin(long);
				var wld = rad2cart(long, lat, a);
				var idx = (ix * max + iy) * 3;
				grids[idx] = wld.x;
				grids[idx + 1] = wld.y;
				grids[idx + 2] = wld.z;
		    }
		}
		if (debug) console.log(`osm tiles (z = ${zoom})`, grids);
		return grids;
	}

	/**Build points buffer, convert all tile grid into world position.
	 * @param {number} z zoom level of OSM XYZ
	 * @param {number} a a of Mercator Projection, see
	 * <a href=https://en.wikipedia.org/wiki/Mercator_projection#Cylindrical_projections'>Mercator Projection</a>
	 * @return {THREE.Points} points
	 */
	static pointsBuff (z, a) {
		if (a === undefined)
			a = 500;
		var step = 10;

		var points = osmGlobeTiles(z, a); // a = 500
		var geometry = new THREE.BufferGeometry();
		geometry.addAttribute( 'position', new THREE.BufferAttribute( points, 3 ) );

		var grid = new THREE.Points(geometry,
				new THREE.PointsMaterial( { color: 0xffffff, size: 3 } ) );
		return grid;
	}
}

/** A number[3] and number[3/4][3/4] operations' helper, not a data type.
 * @class
 */
class Vec3 {
	static toVec3(obj) {
		var a = [obj.x, obj.y];
		if (obj.z)
			a.push(obj.z);
		if (obj.w)
			a.push(obj.w);
		return a;
	}

	static minus (a, b) {
		if (Array.isArray(a))
			return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
		else return [ a.x - b.x, a.y - b.y, a.z - b.z ];
	}

	static add (a, b) {
		if (Array.isArray(a))
			return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
		else return [ a.x + b.x, a.y + b.y, a.z + b.z ];
	}

	static dot( v, u ) {
		if (!Array.isArray(v))
			v = Vec3.toVec3(v);
		if (!Array.isArray(u))
			u = Vec3.toVec3(u);

		var s = 0;
		for (var ix = 0; ix < v.length; ix ++) {
			s += v[ix] * u[ix];
		}
		return s;
	}
}

/// /// /// /// /// test /// /// /// /// ///
function addRandomesh(scene, count) {
	if (count === undefined)
		count = 200;
	var geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
	geometry.translate( 0, 0, 0.5 );
	var material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
	for ( var i = 0; i < count; i ++ ) {
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.x = Math.random() * 1600 - 800;
		mesh.position.y = Math.random() * 1600 - 800;
		mesh.position.z = 0;
		mesh.scale.x = 20;
		mesh.scale.y = 20;
		mesh.scale.z = Math.random() * 80 + 10;
		mesh.updateMatrix();
		mesh.matrixAutoUpdate = false;
		scene.add( mesh );
	}
}

export {OsmUtils, ThreeWrapper, Vec3}

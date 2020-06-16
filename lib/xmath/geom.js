import * as THREE from 'three'
import {vec3} from './vec';
import {XError} from '../xutils/xcommon'
import {Obj3Type} from '../component/obj3'
import {DirTubeBufferGeometry, DirTubeGeometry} from '../../packages/three/geometries/TubeGeometry'

/**
 * A collection of common math function for geometry manipulation.
 * @class xgeom
 */
export default class geom {

	/**Generate curve
	 * @param {object} cmpObj3 Obj3
	 * @param {object} paras e.g. Visual.paras
	 * paras.curve {@link CurveType}<pre>
	   paras.segments: only for CurveType.randomCurve, | randomSegament generated curve segments
	   paras.range: only for CurveType.randomCurve | randomSegament, generated range, default 400
	   paras.points array of point, point = [nubmer, number, number]</pre>
	 * @return {object} {curve, points}, where geomCurve is THREE.BufferGeometry,
	 * points is the THREE.Vector3 array
	 * @member xgeom.generateCurve
	 * @function
	 */
	static generateCurve(cmpObj3, paras) {
		var dvsion = cmpObj3.box && cmpObj3.box.length > 0 ? cmpObj3.box[0] : 6;
		var o = Array.isArray(paras.origin) ? paras.origin : [0, 0, 0];
		var s = paras.scale;
		s = Array.isArray(s) ? s : typeof s === 'number' ? [s, s, s] : [1, 1, 1];
		switch ( cmpObj3.geom ) {
			case Obj3Type.RandomCurve:
			case Obj3Type.RandomSects:
				var points = [];
				var r = paras.range === undefined ? 400 : paras.range;
				for ( var i = 0; i < (cmpObj3.box[0] || 2); i ++ ) {
				// for ( var i = 0; i < 2; i ++ ) {
					var x = Math.random() * r - r / 2;
					var y = Math.random() * r - r / 2;
					var z = Math.random() * r - r / 2;
					points.push( new THREE.Vector3( x, y, z ) );
					// TODO add other attributes like colour here
				}
				// var line,
				var geomCurve, line;
				if (cmpObj3.geom === Obj3Type.RandomCurve) {
				 	line = new THREE.CatmullRomCurve3( points );
					var samples = line.getPoints( points.length * dvsion )
					geomCurve = new THREE.BufferGeometry().setFromPoints( samples );
				}
				else {
					geomCurve = new THREE.BufferGeometry().setFromPoints( points );
					// line = new THREE.LineSegments(geomCurve);
				}
				return {geomCurve, points, curve: line};
			case Obj3Type.PointSects:
				// FIXME API needing to be redesigned
				// FIXME There should be a regularized way to express geometry paramters
				// E.g. paras.sects can be the same for both GeomCurve and DynaSects
				var points = [];
				for (var segx = 0; segx < paras.points.length; segx ++) {
					var xyz = paras.points[segx];
					points.push( new THREE.Vector3( (xyz[0] + o[0]) * s[0],
													(xyz[1] + o[1]) * s[1],
													(xyz[2] + o[2]) * s[2] ) );
				}
				var geomCurve = new THREE.BufferGeometry().setFromPoints( points );
				return {geomCurve, points};
			case Obj3Type.PointGrid:
			case Obj3Type.PointCurve:
				var points = [];
				for (var segx = 0; segx < paras.points.length; segx++) {
					var xyz = paras.points[segx];
					points.push( new THREE.Vector3( (xyz[0] + o[0]) * s[0],
								(xyz[1] + o[1]) * s[1], (xyz[2] + o[2]) * s[2] ) );
				}
			 	var line = new THREE.CatmullRomCurve3( points );
				var samples = line.getPoints( points.length * dvsion );	// not for svg path
				geomCurve = new THREE.BufferGeometry().setFromPoints( samples );
				return {geomCurve, points, curve: line};
			case Obj3Type.SvgPath:
			default:
				throw new XError('Unsupported curve: ', cmpObj3.geom, cmpObj3);
		}
	}

	/**
	 *
	 * @return {object} {tube, path}, where geomCurve is THREE.BufferGeometry,
	 */
	static generateDirTube(obj3, paras) {
		var {geomCurve, points, curve} = geom.generateCurve(obj3, paras);

		if (!curve)
			throw new XError('Only curve can be used for generating tube mesh. Entity ',
							obj3.entitye.id);

		// var tube = new THREE.TubeBufferGeometry( curve, paras.tubularSegments || 20,
		// 				paras.radius || 2, paras.radialSegments || 6, paras.closed || false );
		var tube = new DirTubeBufferGeometry( curve, paras.tubularSegments || 20,
						paras.radius || 2, paras.radialSegments || 6, paras.closed || false );

		return {tube, path: curve};
	}

	/**Generate curve
	 * @param {object} cmpObj3 Obj3
	 * @param {object} paras e.g. Visual.paras
	   paras.points: 2d array of points, segment = [[x, y, z], [x, y, z]]
	   paras.scale: scale of points, useful when mappig grid index to chart world</pre>
	 * @return {object} {curve, points}, where geomCurve is THREE.BufferGeometry,
	 * points is the THREE.Vector3 array
	 * @member xgeom.generateDynaSects
	 * @function
	 */
	static generateDynaSects(cmpObj3, paras) {
		switch (cmpObj3.geom) {
			case Obj3Type.RandomSect:
				throw new XError('geom.generateLines: TODO RandomSect');
				break;
			case Obj3Type.PointSects:
				var sects = [];
				var threeVec3s = [];
				var o = Array.isArray(paras.origin) ? paras.origin : [0, 0, 0];
				var s = paras.scale === undefined ? 1 : paras.scale;
				var sx, sy, sz;
				if (Array.isArray(s)) {
					sx = s[0]; sy = s[1]; sz = s[2];
				}
				else if (typeof s === 'number') {
					sx = sy = sz = s;
				}
				else sx = sy = sz = 1;

				for ( var segx = 0; segx < paras.sects.length; segx++ ) {
					var xyz = paras.sects[segx][0];
					var p1 = new THREE.Vector3( (xyz[0] + o[0]) * sx,
												(xyz[1] + o[1]) * sy,
												(xyz[2] + o[2]) * sz );
					xyz = paras.sects[segx][1];
					var p2 = new THREE.Vector3( (xyz[0] + o[0]) * sx,
												(xyz[1] + o[1]) * sy,
												(xyz[2] + o[2]) * sz );
					var geom = new THREE.BufferGeometry().setFromPoints( [p1, p2] );
					threeVec3s.push( [p1, p2] );
					sects.push( geom );
				}
				return {geoms: sects, points: threeVec3s};
			default:
				throw new XError('geom.generateLines: Unsupported line geometry: ',
								cmpObj3.geom, cmpObj3);
		}
	}

	static generateWayxz(paths, y0, origin, style) {
		// for face, use plane XZ (y = 0)
		// for path, use line segments
		const halfW = style ? style.halfWidth || 10 : 10;
		const geoScale = style ? style.geoScale || 1 : 1;
		const o = origin || [0, 0, 0];
		y0 = y0 || 0;
		var l0 = [0, 0, 0];
		var r2 = [0, 0, 0];
		var l1_ = [0, 0, 0]; //
		var r1_ = [0, 0, 0]; //
		var dir = [0, 0, 0];
		var plen = 0;
		var plen_done = 0;
		for (var path of paths)
			plen += path.geometry.coordinates.length;

		var waypoints = new Float32Array(2 * plen * 3); // double side
		var uvs = new Float32Array(2 * plen * 2);
		var normals = new Float32Array(2 * plen * 3);;
		var dirs = new Float32Array(2 * plen * 3);
		var index = [];

		for (var geoFeature of paths) {
			var path = geoFeature.geometry.coordinates;
			var pleni = path.length;
			for (var pi = 0; pi < pleni; pi++) {
				var u = pleni > 1 ? pi / (pleni - 1) : pi; // reset u for each segment
				if (pi > 0)
					dir = pathDir(path, pi, dir);
				else
					dir = pathDir(path, pi+1, dir);

				var l_i0, l_i1, l_i2, r_i0, r_i1, r_i2; // way points indices
				l_i0 = 2 * plen - 1 - (pi + plen_done);
				r_i2 = pi + plen_done;
				if (pi > 0) {
					l_i1 = l_i0 + 1;
					r_i1 = r_i2 - 1;
				}

				vec3.scaleTo(1, dir);
				dirs.set(dir, pi * 3);

				// var p0 = [path[pi][0] - o[0], 0, path[pi][1] - o[1]];    // in xz plane of geo point
				var p0 = [(path[pi][0] - o[0]) * geoScale,
							y0 || 0,
						  (path[pi][1] - o[1]) * geoScale];    // in xz plane of geo point
				// console.log(p0[0], p0[2]);

				l0 = geom.xzExpandWaypoint(p0, dir, halfW, y0, l0, true);

				r2 = geom.xzExpandWaypoint(p0, dir, halfW, y0, r2);

				if (pi > 1) {
					// previous path point, used for finding the 2nd segment
					// var p_1 = path[pi - 1];
					var p_1 = [(path[pi-1][0] - o[0]) * geoScale,
								y0 || 0,
							   (path[pi-1][1] - o[1]) * geoScale];    // in xz plane of geo point
					var l1_ = geom.xzExpandWaypoint([p_1[0], y0, p_1[1]], dir, halfW, y0, l1_, true);
					var r1_ = geom.xzExpandWaypoint([p_1[0], y0, p_1[1]], dir, halfW, y0, r1_);

					// plen = 12,
					// i = 0,         i = 1;          i = 2;        i = 3
					// r0: 0, l2: 21; r1: 3, l1: 18; r2: 6, l2: 15; r3: 9, l3: 12
					l_i2 = l_i0 + 2;
					r_i0 = r_i2 - 2;
					var l1 =  [ waypoints[l_i1 * 3],
								waypoints[l_i1 * 3 + 1],
								waypoints[l_i1 * 3 + 2] ];
					var l2 =  [ waypoints[l_i2 * 3],
								waypoints[l_i2 * 3 + 1],
								waypoints[l_i2 * 3 + 2] ];
					l1 = checkSide(l0, l1_, l1, l2);  // note index in reversed order
					waypoints.set(l1, l_i1 * 3);

					var r1 =  [ waypoints[r_i1 * 3],
								waypoints[r_i1 * 3 + 1],
								waypoints[r_i1 * 3 + 2] ];
					var r0 =  [ waypoints[r_i0 * 3],
								waypoints[r_i0 * 3 + 1],
								waypoints[r_i0 * 3 + 2] ];
					r1 = checkSide(r0, r1, r1_, r2);
					waypoints.set(r1, r_i1 * 3);
				}

				waypoints.set(l0, l_i0 * 3);
				uvs.set([u, 0], l_i0 * 2);
				normals.set([0, 1, 0], l_i0 * 3);
				dirs.set(dir, l_i0 * 3);

				waypoints.set(r2, r_i2 * 3);
				uvs.set([u, 1], r_i2 * 2);
				normals.set([0, 1, 0], r_i2 * 3);
				dirs.set(dir, r_i2 * 3);

				if (pi > 0) {
				    var a = l_i1, b = r_i1, c = r_i2, d = l_i0;
				    index.push(a, b, d);
				    index.push(b, c, d);
				}
			}
			plen_done += pleni;
			// TODO add round cap?
		}

		var pathGeometry = new THREE.BufferGeometry();
		pathGeometry.setAttribute("position", new THREE.BufferAttribute(waypoints, 3));
		pathGeometry.setAttribute("geoLoc", new THREE.Float32BufferAttribute(path, 3));
		pathGeometry.setAttribute("geoDir", new THREE.BufferAttribute(dirs, 3));

		pathGeometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
		pathGeometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

		pathGeometry.setIndex(index);

		return pathGeometry;

		function pathDir(geopath, ix, buff, y0) {
			// vec3.subArr(path[ix + 1], path[ix], buff)
			return vec3.subArr(
				[geopath[ix][0], y0 || 0, geopath[ix][1]],
				[geopath[ix-1][0], y0 || 0, geopath[ix-1][1]], buff);
		}

		function checkSide(p0, p1, p2, p3) {
			var reslt = geom.checkLineIntersection(
				p0[0], p0[2], p1[0], p1[2],
				p2[0], p2[2], p3[0], p3[2] );

			p1[0] = reslt.x;
			p1[2] = reslt.y;
			return p1;
		}
	}

	/**Generate face of polygon from geo-path.
	 * A discussion at stackoverflow:
	 * https://stackoverflow.com/questions/15247711/convert-an-svg-path-to-polygons-for-use-within-javascript-clipper
	 * https://gis.stackexchange.com/questions/7159/pure-javascript-library-for-geometry-operations
	 *
	 * renferences
	 * paper.js (path geom) http://paperjs.org/features/#paths-x26-segments
	 * mapshaper https://mapshaper.org/
	 * polygon-tool (2d intersection, ect.)
	 *     home: https://floorplanner.github.io/polygon-tools/
	 *     jsfiddle: https://jsfiddle.net/timknip/2tjkuvvj/
	 * @param {array} path 2d array, each element is a vec2 array (geojson polygon point)
	 * @param {number} [y0=0] the xz plane's y
	 * @param {object} style {halfWidth: number}
	static generateWayxz(path, y0, style) {
		// for face, use plane XZ (y = 0)
		// for path, use line segments
		const halfW = style ? style.halfWidth || 10 : 10;
		y0 = y0 || 0;
		var l0 = [0, 0, 0];
		var r2 = [0, 0, 0];
		var l1_ = [0, 0, 0]; //
		var r1_ = [0, 0, 0]; //
		var dir = [0, 0, 0];
		var plen = path.length;

		var waypoints = new Float32Array(2 * plen * 3); // double side
		var uvs = new Float32Array(2 * plen * 2);
		var normals = new Float32Array(2 * plen * 3);;
		var dirs = new Float32Array(2 * plen * 3);
		var index = [];

		for (var pi = 0; pi < plen; pi++) {
			if (pi > 0)
				dir = pathDir(path, pi, dir);
			else
				dir = pathDir(path, pi+1, dir);

			var l_i0, l_i1, l_i2, r_i0, r_i1, r_i2; // way points indices
			l_i0 = 2 * plen - 1 - pi;
			r_i2 = pi;
			if (pi > 0) {
				l_i1 = l_i0 + 1;
				r_i1 = r_i2 - 1;
			}
			var u = pi / (plen - 1);

			vec3.scaleTo(1, dir);
			dirs.set(dir, pi * 3);

			var p0 = [path[pi][0], 0, path[pi][1]];    // in xz plane of geo point

			l0 = geom.xzExpandWaypoint(p0, dir, halfW, y0, l0, true);

			r2 = geom.xzExpandWaypoint(p0, dir, halfW, y0, r2);

			if (pi > 1) {
				// previous path point, used for finding the 2nd segment
				var p_1 = path[pi - 1];
				var l1_ = geom.xzExpandWaypoint([p_1[0], y0, p_1[1]], dir, halfW, y0, l1_, true);
				var r1_ = geom.xzExpandWaypoint([p_1[0], y0, p_1[1]], dir, halfW, y0, r1_);

				// plen = 12,
				// i = 0,         i = 1;          i = 2;        i = 3
				// r0: 0, l2: 21; r1: 3, l1: 18; r2: 6, l2: 15; r3: 9, l3: 12
				l_i2 = l_i0 + 2;
				r_i0 = r_i2 - 2;
				var l1 =  [ waypoints[l_i1 * 3],
							waypoints[l_i1 * 3 + 1],
							waypoints[l_i1 * 3 + 2] ];
				var l2 =  [ waypoints[l_i2 * 3],
							waypoints[l_i2 * 3 + 1],
							waypoints[l_i2 * 3 + 2] ];
				l1 = checkSide(l0, l1_, l1, l2);  // note index in reversed order
				waypoints.set(l1, l_i1 * 3);

				var r1 =  [ waypoints[r_i1 * 3],
							waypoints[r_i1 * 3 + 1],
							waypoints[r_i1 * 3 + 2] ];
				var r0 =  [ waypoints[r_i0 * 3],
							waypoints[r_i0 * 3 + 1],
							waypoints[r_i0 * 3 + 2] ];
				r1 = checkSide(r0, r1, r1_, r2);
				waypoints.set(r1, r_i1 * 3);
			}

			waypoints.set(l0, l_i0 * 3);
			uvs.set([u, 0], l_i0 * 2);
			normals.set([0, 1, 0], l_i0 * 3);
			dirs.set(dir, l_i0 * 3);

			waypoints.set(r2, r_i2 * 3);
			uvs.set([u, 1], r_i2 * 2);
			normals.set([0, 1, 0], r_i2 * 3);
			dirs.set(dir, r_i2 * 3);

			if (pi > 0) {
			    var a = l_i1, b = r_i1, c = r_i2, d = l_i0;
			    index.push(a, b, d);
			    index.push(b, c, d);
			}
		}
		// TODO add round cap?

		var pathGeometry = new THREE.BufferGeometry();
		pathGeometry.setAttribute("position", new THREE.BufferAttribute(waypoints, 3));
		pathGeometry.setAttribute("geoLoc", new THREE.Float32BufferAttribute(path, 3));
		pathGeometry.setAttribute("geoDir", new THREE.BufferAttribute(dirs, 3));

		pathGeometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
		pathGeometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

		pathGeometry.setIndex(index);

		return pathGeometry;

		function pathDir(geopath, ix, buff, y0) {
			// vec3.subArr(path[ix + 1], path[ix], buff)
			return vec3.subArr(
				[geopath[ix][0], y0 || 0, geopath[ix][1]],
				[geopath[ix-1][0], y0 || 0, geopath[ix-1][1]], buff);
		}

		function checkSide(p0, p1, p2, p3) {
			var reslt = geom.checkLineIntersection(
				p0[0], p0[2], p1[0], p1[2],
				p2[0], p2[2], p3[0], p3[2] );

			p1[0] = reslt.x;
			p1[2] = reslt.y;
			return p1;
		}
	}
	 */

	static xzExpandWaypoint(p, dir, w, y0, buf, isLeft) {
		var off = [0, 0, 0];
		vec3.crossArr(dir, [0, isLeft ? -1 : 1, 0], off);
		vec3.scaleTo(w, off);
		vec3.addArr(p, off, buf);
		if (y0 !== undefined)
			buf[1] = y0;
		return buf;
	}

	/**Find 2d line intersection<br>
	 * Line1: [(x1, y1), (x2, y2)]<br>
	 * Line2: [(x3, y3), (x4, y4)]<br>
	 * Reference:
	 * <a href='http://jsfiddle.net/justin_c_rounds/Gd2S2/'>
	   justin_c_rounds's Calculating the intersection of two lines</a>
	 * <a href='https://mathjs.org/docs/reference/functions/intersect.html'>
	 * Math.js 3D version</a>
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 * @param {number} x3
	 * @param {number} y3
	 * @param {number} x4
	 * @param {number} y4
	 * @return {object} {x: number | null, y: number | null, onL1: bool, onL2: bool}
	 * @member xgeom.generateDynaSects
	 * @function
	 */
 	static checkLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
	    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
	    var denominator, a, b, numerator1, numerator2, result = {
	        // x: null,
	        // y: null,
	        // onLine1: false,
	        // onLine2: false
			x: x2,
			y: y2,
			onLine1: true,
			onLIne2: true
	    };
	    denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
	    if (denominator == 0) {
	        return result;
	    }
	    a = y1 - y3;
	    b = x1 - x3;
	    numerator1 = ((x4 - x3) * a) - ((y4 - y3) * b);
	    numerator2 = ((x2 - x1) * a) - ((y2 - y1) * b);
	    a = numerator1 / denominator;
	    b = numerator2 / denominator;

	    // if we cast these lines infinitely in both directions, they intersect here:
	    result.x = x1 + (a * (x2 - x1));
	    result.y = y1 + (a * (y2 - y1));

		/*
	    // it is worth noting that this should be the same as:
	       x = x3 + (b * (x4 - x3));
	       y = x3 + (b * (y4 - y3));
	    */
	    // if line1 is a segment and line2 is infinite, they intersect if:
	    if (a > 0 && a < 1) {
	        result.onLine1 = true;
	    }
	    // if line2 is a segment and line1 is infinite, they intersect if:
	    if (b > 0 && b < 1) {
	        result.onLine2 = true;
	    }
	    // if line1 and line2 are segments, they intersect if both of the above are true
	    return result;
	}

	/**Get point alone path, at weight t, and set result point in buffer.
	 *
	 * Stolen from SplineCurve.prototype.getPoint
	 *
	 * https://github.com/mrdoob/three.js/blob/master/src/extras/curves/SplineCurve.js
	 *
	 * @param {THREE.Vector3} pointBuffer
	 * @param {array<THREE.Vector3>} path point array of THREE.Vector3
	 * @param {number} t weight, range 0 - 1
	 * @return {THREE.Vector3} point
	 * @member xgeom.getPointAt
	 * @function
	 */
	static getPointAt(pointBuffer, path, t) {
		var point = pointBuffer || new Vector3();

		var points = path; //.points;
		var p = ( points.length - 1 ) * t;

		var intPoint = Math.floor( p );
		if (intPoint < 0) {
			console.warn('Point index out of range. P: ',
				intPoint, 'buffer: ', pointBuffer, 't: ', t, 'path: ', path);
			intPoint = 0;
		}
		var weight = p - intPoint;

		var p0 = points[ intPoint === 0 ? intPoint : intPoint - 1 ];
		var p1 = points[ intPoint ];
		var p2 = points[ intPoint > points.length - 2 ? points.length - 1 : intPoint + 1 ];
		var p3 = points[ intPoint > points.length - 3 ? points.length - 1 : intPoint + 2 ];

		point.set(
			geom.catmullRom( weight, p0.x, p1.x, p2.x, p3.x ),
			geom.catmullRom( weight, p0.y, p1.y, p2.y, p3.y ),
			geom.catmullRom( weight, p0.z, p1.z, p2.z, p3.z )
		);

		return point;
	}

	/**Doc:
	 * <a href='https://threejs.org/docs/#api/en/extras/core/Curve.getPoint'>
	 * Returns a vector for a given position on the curve</a>.
	 *
	 * Stolen from:
	 * https://github.com/mrdoob/three.js/blob/b11f897812a8a48bcd81e9bd46785d07939ec59e/src/extras/core/Interpolations.js#L8
	 *
	 * @author zz85 / http://www.lab4games.net/zz85/blog
	 *
	 * Bezier Curves formulas obtained from
	 * http://en.wikipedia.org/wiki/Bézier_curve
	 * @member xgeom.catmullRom
	 * @function
	 */
	static catmullRom( t, p0, p1, p2, p3 ) {
		var v0 = ( p2 - p0 ) * 0.5;
		var v1 = ( p3 - p1 ) * 0.5;
		var t2 = t * t;
		var t3 = t * t2;
		return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;
	}
}

// https://discourse.threejs.org/t/simple-rectangular-geometry-extrusion-anyone/743/14
function ProfiledContourGeometry(profileShape, contour, contourClosed) {

	contourClosed = contourClosed !== undefined ? contourClosed : true;

	let profileGeometry = new THREE.ShapeBufferGeometry(profileShape);
	profileGeometry.rotateX(Math.PI * .5);
	let profile = profileGeometry.attributes.position;

	let profilePoints = new Float32Array(profile.count * contour.length * 3);

	// odys: generate profiles alone contour
	for (let i = 0; i < contour.length; i++) {
	  let v1 = new THREE.Vector2().subVectors(contour[i - 1 < 0 ? contour.length - 1 : i - 1], contour[i]);
	  let v2 = new THREE.Vector2().subVectors(contour[i + 1 == contour.length ? 0 : i + 1], contour[i]);
	  let angle = v2.angle() - v1.angle();
	  let halfAngle = angle * .5;

	  let hA = halfAngle;
	  let tA = v2.angle() + Math.PI * .5;
	  if (!contourClosed){
	  	if (i == 0 || i == contour.length - 1) {hA = Math.PI * .5;}
	    if (i == contour.length - 1) {tA = v1.angle() - Math.PI * .5;}
	  }

	  let shift = Math.tan(hA - Math.PI * .5);
	  let shiftMatrix = new THREE.Matrix4().set(
	        1,  0, 0, 0,
	    -shift, 1, 0, 0,
	        0,  0, 1, 0,
	        0,  0, 0, 1
	  );


	  let tempAngle = tA;
	  let rotationMatrix = new THREE.Matrix4().set(
	    Math.cos(tempAngle), -Math.sin(tempAngle), 0, 0,
	    Math.sin(tempAngle), Math.cos(tempAngle), 0, 0,
	    0, 0, 1, 0,
	    0, 0, 0, 1
	  );

	  let translationMatrix = new THREE.Matrix4().set(
	    1, 0, 0, contour[i].x,
	    0, 1, 0, contour[i].y,
	    0, 0, 1, 0,
	    0, 0, 0, 1,
	  );

	  let cloneProfile = profile.clone();
	  shiftMatrix.applyToBufferAttribute(cloneProfile);
	  rotationMatrix.applyToBufferAttribute(cloneProfile);
	  translationMatrix.applyToBufferAttribute(cloneProfile);

	  profilePoints.set(cloneProfile.array, cloneProfile.count * i * 3);
	}

	let fullProfileGeometry = new THREE.BufferGeometry();
	fullProfileGeometry.addAttribute("position", new THREE.BufferAttribute(profilePoints, 3));
	let index = [];

	let lastCorner = contourClosed == false ? contour.length - 1: contour.length;
	for (let i = 0; i < lastCorner; i++) {
	  for (let j = 0; j < profile.count; j++) {
	    let currCorner = i;
	    let nextCorner = i + 1 == contour.length ? 0 : i + 1;
	    let currPoint = j;
	    let nextPoint = j + 1 == profile.count ? 0 : j + 1;

	    let a = nextPoint + profile.count * currCorner;
	    let b = currPoint + profile.count * currCorner;
	    let c = currPoint + profile.count * nextCorner;
	    let d = nextPoint + profile.count * nextCorner;


	    index.push(a, b, d);
	    index.push(b, c, d);
	  }
	}

	fullProfileGeometry.setIndex(index);
	fullProfileGeometry.computeVertexNormals();

	return fullProfileGeometry;
}

// source of three.module.js/Curve line 36499
function computeFrenetFrames( segments, closed ) {
	// see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

	var normal = new Vector3();

	var tangents = [];
	var normals = [];
	var binormals = [];

	var vec = new Vector3();
	var mat = new Matrix4();

	var i, u, theta;

	// compute the tangent vectors for each segment on the curve

	for ( i = 0; i <= segments; i ++ ) {

		u = i / segments;

		tangents[ i ] = this.getTangentAt( u );
		tangents[ i ].normalize();

	}

	// select an initial normal vector perpendicular to the first tangent vector,
	// and in the direction of the minimum tangent xyz component

	normals[ 0 ] = new Vector3();
	binormals[ 0 ] = new Vector3();
	var min = Number.MAX_VALUE;
	var tx = Math.abs( tangents[ 0 ].x );
	var ty = Math.abs( tangents[ 0 ].y );
	var tz = Math.abs( tangents[ 0 ].z );

	if ( tx <= min ) {

		min = tx;
		normal.set( 1, 0, 0 );

	}

	if ( ty <= min ) {

		min = ty;
		normal.set( 0, 1, 0 );

	}

	if ( tz <= min ) {

		normal.set( 0, 0, 1 );

	}

	vec.crossVectors( tangents[ 0 ], normal ).normalize();

	normals[ 0 ].crossVectors( tangents[ 0 ], vec );
	binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


	// compute the slowly-varying normal and binormal vectors for each segment on the curve

	for ( i = 1; i <= segments; i ++ ) {

		normals[ i ] = normals[ i - 1 ].clone();

		binormals[ i ] = binormals[ i - 1 ].clone();

		vec.crossVectors( tangents[ i - 1 ], tangents[ i ] );

		if ( vec.length() > Number.EPSILON ) {

			vec.normalize();

			theta = Math.acos( _Math.clamp( tangents[ i - 1 ].dot( tangents[ i ] ), - 1, 1 ) ); // clamp for floating pt errors

			normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

		}

		binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

	}

	// if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

	if ( closed === true ) {

		theta = Math.acos( _Math.clamp( normals[ 0 ].dot( normals[ segments ] ), - 1, 1 ) );
		theta /= segments;

		if ( tangents[ 0 ].dot( vec.crossVectors( normals[ 0 ], normals[ segments ] ) ) > 0 ) {

			theta = - theta;

		}

		for ( i = 1; i <= segments; i ++ ) {

			// twist a little...
			normals[ i ].applyMatrix4( mat.makeRotationAxis( tangents[ i ], theta * i ) );
			binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

		}

	}

	return {
		tangents: tangents,
		normals: normals,
		binormals: binormals
	};

}

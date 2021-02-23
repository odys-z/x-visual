import * as THREE from '../../packages/three/three.module-MRTSupport';
import earcut from 'earcut'
import {DirTubeBufferGeometry, DirTubeGeometry} from '../../packages/three/geometries/TubeGeometry'

import {XError} from '../xutils/xcommon'
import {vec3} from './vec'
import {Obj3Type} from '../component/obj3'
import {TexFlag} from '../component/visual'

/**
 * A collection of common math function for geometry manipulation.
 * @class xgeom
 */
export default class geom {
	/**@constructor xgeom */
	constructor() {}

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
				// var points = [];
				// for (var segx = 0; segx < paras.points.length; segx ++) {
				// 	var xyz = paras.points[segx];
				// 	points.push( new THREE.Vector3( (xyz[0] + o[0]) * s[0],
				// 									(xyz[1] + o[1]) * s[1],
				// 									(xyz[2] + o[2]) * s[2] ) );
				// }
				// var geomCurve = new THREE.BufferGeometry().setFromPoints( points );
				// return {geomCurve, points};

				// var sects = [];
				var points = [];
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
					// var geom = new THREE.BufferGeometry().setFromPoints( [p1, p2] );
					points.push( p1, p2 );
					// sects.push( geom );
				}
					var geom = new THREE.BufferGeometry().setFromPoints( points );
				// return {geomCurve: sects, points};
				return {geomCurve: geom, points};
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

	/**Create a {@link DirTubeBufferGeometry} for rendering and tweening.
	 *
	 * The vertices should include attributes of 'a_tan', and uniform 'wpos', the
	 * world pos can by tweend as {@link XComponent.AnimType}.U_PATH_MORPH.
	 *
	 * @return {object} {tube, path}, where tube is THREE.BufferGeometry,
	 * @member xgeom.generateDirTube
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

	/**<p id='generateWayxz'>Generate a x-z plane road polygon alone paths.</p>
	 * Generated road model is applied with geostyle.scale, default 1. So if the
	 * referencing path is scaled, the wpos/wtan for shader to animate also been
	 * scaled.
	 * @param {array} paths array of geojson features.
	 * @param {number} y0 y for all vertices
	 * @param {array} origin [x, y, z]
	 * @param {object} style {halfWidth: number, scale: number}
	 * @param {number} [angleEpsilon=0.2] minimum angle to be taken as a stright segament.
	 * - using second point as intersecting point to avoid error (precision problem?)
	 * @return {object} {geom: geometry, path: {points: Float32Array}}
	 * @member xgeom.generateWayxz
	 * @function
	 */
	static generateWayxz(paths, y0, origin, style, angleEpsilon) {
		const epsilon = angleEpsilon || 0.2;
		const halfW = style ? style.halfWidth || 10 : 10;
		const geoScale = style ? style.scale || 1 : 1;
		const o = origin || [0, 0, 0];
		y0 = y0 || 0;
		var l0 = [0, 0, 0], l1 = [0, 0, 0], l2 = [0, 0, 0];
		var r2 = [0, 0, 0], r1 = [0, 0, 0], r0 = [0, 0, 0];
		var l1_ = [0, 0, 0], r1_ = [0, 0, 0];
		var dir = [0, 0, 0], dir1 = [0, 0, 0];
		var plen = 0, plen_done = 0;

		var pathIsArray = true;
		for (var path of paths) {
			if (Array.isArray(path)) {
				plen += path.length;
				pathIsArray = true;
			}
			else {
				plen += path.geometry.coordinates.length;
				pathIsArray = false;
			}
		}

		var waypoints = new Float32Array(2 * plen * 3); // double side
		var uvs = new Float32Array(2 * plen * 2);
		var normals = new Float32Array(2 * plen * 3);;
		var dirs = new Float32Array(2 * plen * 3);
		var pos = new Float32Array(2 * plen * 3);
		var index = [];

		for (var geoFeature of paths) {
			var path;
			if ( !pathIsArray )
				path = geoFeature.geometry.coordinates;
			else ; // paths must be a 2D array

			var pleni = path.length;
			for (var pi = 0; pi < pleni; pi++) {
				var u = pleni > 1 ? pi / (pleni - 1) : pi; // reset u for each segment
				if (pi > 0)
					dir = pathDir(path, pi, dir);
				else
					dir = pathDir(path, pi+1, dir);

				// var l_i0, l_i1, l_i2, r_i0, r_i1, r_i2; // way points indices
				l_i0 = 2 * plen - 1 - (pi + plen_done);
				r_i2 = pi + plen_done;
				var l_i0, l_i1, r_i1, r_i2; // way points indices
				if (pi > 0) {
					l_i1 = l_i0 + 1;
					r_i1 = r_i2 - 1;
				}

				vec3.scaleTo(1, dir);
				dirs.set(dir, pi * 3);

				// current path point
				var p0 = [(path[pi][0] - o[0]) * geoScale,
						   y0 || 0,       // in xz plane of geo point
						  (path[pi][1] - o[1]) * geoScale]; // +z = south (3857 smaller y)
				pos.set(p0, pi * 3);

				vec3.copyArr(l2, l1);
				vec3.copyArr(l1, l0);
				l0 = geom.xzExpandWaypoint(p0, dir, halfW, y0, l0, true);

				vec3.copyArr(r0, r1);
				vec3.copyArr(r1, r2);
				r2 = geom.xzExpandWaypoint(p0, dir, halfW, y0, r2);
				// console.log(r2[0], r2[2]);

				if (pi > 1) {
					// previous path point, used for finding the 2nd segment
					var p_1 = [(path[pi-1][0] - o[0]) * geoScale,
							   y0 || 0,
							   // (o[1] - path[pi-1][1]) * geoScale];    // +z = south (3857 smaller y)
							   (path[pi-1][1] - o[1]) * geoScale];    // +z = south (3857 smaller y)
					pathDir(path, pi-1, dir1);
					if (geom.xzAngle( dir1, dir ) < epsilon) {
						// intersection will result in wrong position - precision isssue?
						// debugger
					}
					else {
						var l1_ = geom.xzExpandWaypoint([p_1[0], y0, p_1[2]], dir, halfW, y0, l1_, true);
						var r1_ = geom.xzExpandWaypoint([p_1[0], y0, p_1[2]], dir, halfW, y0, r1_);

						// plen = 12,
						// i = 0,         i = 1;          i = 2;        i = 3
						// r0: 0, l2: 21; r1: 3, l1: 18; r2: 6, l2: 15; r3: 9, l3: 12
						checkSide(l0, l1_, l1, l2, l1_);  // note index in reversed order
						// waypoints.set(l1_, l_i1 * 3);
						setWaypoints(l1_, l_i1);

						checkSide(r0, r1, r1_, r2, r1_);
						// waypoints.set(r1_, r_i1 * 3);
						setWaypoints(r1_, r_i1);
					}
				}

				setWaypoints(l0, l_i0);
				uvs.set([u, 0], l_i0 * 2);
				normals.set([0, 1, 0], l_i0 * 3);
				dirs.set(dir, l_i0 * 3);

				setWaypoints(r2, r_i2);
				uvs.set([u, 1], r_i2 * 2);
				normals.set([0, 1, 0], r_i2 * 3);
				dirs.set(dir, r_i2 * 3);

				if (pi > 0) {
				    // var a = l_i1, b = r_i1, c = r_i2, d = l_i0;
					// 3857 +y <==> three.js -z
				    var a = r_i1, b = l_i1, c = l_i0, d = r_i2;
				    index.push(a, b, d);
				    index.push(b, c, d);
				}
			}
			plen_done += pleni;
			// TODO add round cap?
		}

		var pathGeometry = new THREE.BufferGeometry();
		pathGeometry.setAttribute("position", new THREE.BufferAttribute(waypoints, 3));
		pathGeometry.setAttribute("a_pos", new THREE.Float32BufferAttribute(pos, 3));
		pathGeometry.setAttribute("a_tan", new THREE.BufferAttribute(dirs, 3));

		pathGeometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
		pathGeometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

		pathGeometry.setIndex(index);

		return {geom: pathGeometry, path: {points: waypoints}};

		function pathDir(geopath, ix, buff, y0) {
			return vec3.subArr(
				[geopath[ix][0], y0 || 0, geopath[ix][1]],
				[geopath[ix-1][0], y0 || 0, geopath[ix-1][1]], buff);
		}

		function checkSide(p0, p1, p2, p3, buf) {
			var reslt = geom.checkLineIntersection(
				p0[0], p0[2], p1[0], p1[2],
				p2[0], p2[2], p3[0], p3[2] );

			buf[0] = reslt.x;
			buf[2] = reslt.y;
			return buf;
		}

		function setWaypoints(p, ix) {
			// 3857 y = three.js -z, reverse p[2]
			waypoints.set([p[0], p[1], -p[2]], ix * 3);
		}
	}

	/** return |atan(vec0[2], vec0[0]) - atan(vec1[2], vec[0])|
	 * @param {array} vec0 [x, y, z]
	 * @param {array} vec1 [x, y, z]
	 * @member xgeom.xzAngle
	 */
	static xzAngle(vec0, vec1) {
		var a0 = Math.atan2(vec0[2], vec0[0]);
		return Math.abs(a0 - Math.atan2(vec1[2], vec1[0]));
	}

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
	   justin_c_rounds's Calculating the intersection of two lines</a> &amp;
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
	 * @member xgeom.checkLineIntersection
	 * @function
	 */
 	static checkLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
	    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
	    var denominator, a, b, numerator1, numerator2, result = {
			x: x2,
			y: y2,
			xy: [x2, y2],
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
		result.xy = [x1 + (a * (x2 - x1)), y1 + (a * (y2 - y1))];

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

	/**Get point alone path, where path is a Float32Array array.
	 * The method ignored different distance between way points
	 * @param {THREE.Vector3} pointBuffer
	 * @param {THREE.Vector3} [dirBuffer]
	 * @param {array<Float32Array>} points32 point array of path
	 * @param {number} t weight, range 0 - 1
	 * @return {object.<{point: THREE.Vector3, tan: THREE.Vecotor3}>} {point, tan}
	 * @member xgeom.getWayPointAt
	 * @function
	 */
	static getWayPointAt(pointBuffer, dirBuffer, points32, t) {
		var point = pointBuffer || new Vector3();

		var p = ( points32.length / 3 - 1 ) * t;

		var intPoint = Math.floor( p );
		if (intPoint < 0) {
			// console.warn('Point index out of range. P: ',
			// 	intPoint, 'buffer: ', pointBuffer, 't: ', t, 'path: ', path);
			intPoint = 0;
		}
		var weight = p - intPoint;

		var px0 = intPoint === 0 ? intPoint : (intPoint - 1) * 3;
		var p0 = [ points32[ px0 ], points32[ px0+1 ], points32[ px0+2 ] ];

		var px1 = intPoint * 3;
		var p1 = [ points32[ px1 ], points32[ px1+1 ], points32[ px1+2 ] ];

		var px2 = intPoint > points32.length / 3 - 2 ? points32.length - 3 : (intPoint + 1) * 3;
		var p2 = [ points32[ px2 ], points32[ px2+1 ], points32[ px2+2 ] ];

		var px3 = intPoint > points32.length / 3 - 3 ? points32.length - 3 : (intPoint + 2) * 3;
		var p3 = [ points32[ px3 ], points32[ px3+1 ], points32[ px3+2 ] ];

		point.set(
			geom.catmullRom( weight, p0[0], p1[0], p2[0], p3[0] ),
			geom.catmullRom( weight, p0[1], p1[1], p2[1], p3[1] ),
			geom.catmullRom( weight, p0[2], p1[2], p2[2], p3[2] )
		);

		if (dirBuffer) {
			if (weight > 0) {
				dirBuffer.set( p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2] );
			}
			else dirBuffer.set(0, 0, 0);
		}

		return {point, tan: dirBuffer};
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

	/**get prism paras from Visual.paras
	 * @param {Obj3} obj3
	 * @param {string} obj3.filter the feature area filter. If set, feature.properties
	 * must has an 'area' property equal to this. see {@link AssetKeepr.geoTexturePrism}
	 * @param {object} vparas Visual.paras
	 * @param {number} vparas.maxVerts, only works in synchrodous mode
	 * @param {number} [vparas.coutn=100] features
	 * @param {array} [vparas.tile=[1, 1]] tiles
	 * @param {number} [vparas.geoScale=1]
	 * @param {array} [vparas.origin=[0, 0]] geo-center
	 * @param {function} [vparas.onFeature] callback on each features
	 * @param {function} [vparas.geostyle.onGroup] callback on each group
	 * @return {object} potions form prism generating
	 * @member xgeom.formatPrismOption
	 * @function
	 * */
	static formatPrismOption(obj3, vparas) {
		var opts = {
			filter: obj3.filter,
			maxVerts: vparas.maxVerts, // only works in synchrodous mode
			count: vparas.count || 100,
			height: vparas.geostyle ? vparas.geostyle.height || 1 : 1,
			tiles: vparas.tile ? vparas.tile.tiles : [1, 1],
			geoScale: vparas.geostyle ? vparas.geostyle.scale || 1 : 1,
			geoCentre: vparas.origin || [0, 0, 0],
			onFeature: vparas.onFeature,
			onGroup: vparas.geostyle ? vparas.geostyle.onGroup : undefined
		};
		if (vparas.boxes)
			opts.boxes = vparas.boxes;
		return opts;
	}

	/**<p id='hexaprism3857'>Generate a tile of hexagon volume. All coordinates
	 * are in world. This method is usually been used via {@link AssetKeepr.geoHexaprism}
	 * in synchronous way or {@link AssetKeepr.geoHexaprismAsync} asynchronously</p>
	 * The hexagon center = (cell - geoCentre) * scale, with height ignoring scale,
	 * and world z is reversed, z = - (cell.y - geoCentre.y)
	 *
	 * This function is supposed to be called by a geojson stream handler, providing
	 * reversed +z direction.
	 *
	 * Reference:<br>
	 * <a href='https://www.mathworks.com/matlabcentral/answers/89665-generating-an-array-of-hexagonal-shape-pattern'>
	 * mathworks: Generating an Array of Hexagonal Shape Pattern</a><br>
	 * <a href='https://stackoverflow.com/questions/30492299/shared-vertex-indices-with-normals-in-opengl'>
	 * Best way of sharing vertices: flat</a><br>
	 * <a href='https://stackoverflow.com/questions/40101023/flat-shading-in-webgl'>
	 * walk around of sharing vertics in webgl 1.0: flat shading in webGL</a><br>
	 * <a href='https://stackoverflow.com/questions/47957676/webgl-flat-shading'>
	 * shareing vertices normals is hard in webgl 1.0: WebGL Flat Shading</a><br>
	 * <a href='https://github.com/mrdoob/three.js/blob/25d16a2c3c54befcb3916dbe756e051984c532a8/src/geometries/CylinderGeometry.js#L198'>
	 * Three.js cylinder way: CylinderGeometry#generateCap()</a><br>
	 * <a href='http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-9-vbo-indexing/'>
	 * reading: OpenGl Tutorial - VBO Indexing</a><br>
	 * <a href='https://threejsfundamentals.org/threejs/lessons/threejs-custom-buffergeometry.html'>
	 * Three.js Custom BufferGeometry, Three.js Fundamentals</a><br>
	 * @param {object} cell  information of cell geometry to be created
	 * cell.coord: [x, y] - 2d position, in epsg 3857 ( +y pointing -z in x world)
	 * cell.height: number - default 1
	 * cell.geoscale: number - default 1, y scale ignored (always 1).
	 * @param {array} geoCentre 2d position, in epsg 3857, for the scene center
	 * @param {array} tile0 2d array of model position of 6 hexagon vertices,
	 * in three.js world, typically got with {@link xgeom.hexatile}
	 * @param {object} ctx context of stream data processing<pre>
        pos: Float32Array(verts * 3);
        loc: Float32Array(verts * 3);
        uvs: Float32Array(verts * 2);
        normals: Float32Array(verts * 3);
        dirs: Float32Array(verts * 3); attribute a_tan,
            where a_tan[1] = onGroup(), (a_tan[0, 1] represent dir in xz plane),
            where onGroup function is provide by user, giving a chance to set a feature's flag.
        index: [];
        vx: number - the first vertex index of a feature, 0, 26, ...</pre>
	 * where verts is the total vertices number, verts = features * 26
	 * @return {object} part of vertices {pos, uvs, normals, dirs, index}, totally 28 vertices
	 * @member xgeom.hexaprism3857
	 * @function
	 */
	static hexaprism3857(cell, geoCentre, tile0, ctx) {
		const h = cell.height >= 0 ? cell.height : 1;
		const s = cell.geoScale || 1;

		// translate center and scale
		var c0 = [0, 0, 0];
		vec3.subArr([cell.coord[0], 0, cell.coord[1]],
					[ geoCentre[0], 0, geoCentre[1] ], c0);
		vec3.mulArr(c0, [s, 1, -s], c0); // -s: simply project 3857 to x world
		var vbuff = [0, 0, 0];

		var verts = 14;        // 6 edge with 7 vertices
		verts += 6 * 2;        // and up down sides verts
		const stride = 6 + 7;  // stride from lower vertex to the upper
		ctx.stride = stride;

		var {pos, loc, uvs, normals, dirs, index} = ctx;

		var ix = 0;
		// side face (7 column)
		for (; ix <= 6; ix++) {
			var v = tile0.vert[ix%6];
			// with a_tan.y (normals.y) as group index
			v[1] = cell.group || 0;
			var n = tile0.norm[ix%6];
			setLateralEdge(v, n, c0, h, ctx.vx + ix);
		}

		for (var i = 0; i < 6; i++) { // 6 side by 7 column
			// a    d  (upper = lower + stride)
			// |    |   ...
			// b    c  (lower first)
			// as lower first, verts arry is: [ b  c |-stride-| a  d ... ]
			//                                  ^i + feature-x
			var b = i + ctx.vx;
			var a = b + stride, c = b + 1;
			var d = a + 1;
			index.push(b, c, d);
			index.push(b, d, a);
		}

		// end caps
		var fx0 = ix + ctx.vx; // starting cap vertex' index
		// 6 verts down, 6 verts up
		for (v of tile0.vert) {
			setCapverts(v, c0, h, ctx.vx + ix);
			ix++ ;
		}

		// for face index, see docs/design-memo/imgs/006-hexatile.png
		capFace(0, 2, 4, fx0);   // 2 faces
		capFace(0, 1, 2, fx0);
		capFace(2, 3, 4, fx0);
		capFace(4, 5, 0, fx0);

		ctx.vx += verts;
		return ctx;

		// set a prism's up-down verts
		function setLateralEdge(v, n, c0, h, vx) {
			vec3.addArr(v, c0, vbuff);
			var u = (vx - ctx.vx)/6;
			// lower
			pos.set(vbuff, vx * 3);
			dirs.set(v, vx * 3);
			loc.set(c0, vx * 3);
			uvs.set([u, 0], vx * 2);   // +uv.v = +y ?
			normals.set([n[0], 0, n[2]], vx * 3);

			// upper
			const jx = vx + stride;
			pos.set([vbuff[0], vbuff[1] + h, vbuff[2]], jx * 3);
			dirs.set(v, jx * 3);
			loc.set([c0[0], c0[1] + h, c0[2]], jx * 3);
			uvs.set([u, 1], jx * 2);
			normals.set([n[0], 0, n[2]], jx * 3);
		}

		// generate all 12 vertices of cap faces
		function setCapverts(v, c0, h, vx) {
			vec3.addArr(v, c0, vbuff)
			var u = (v[0] / ctx.r + 1) * 0.5;
			var w = (-v[2] / ctx.r + 1) * 0.5;
			// lower
			pos.set(vbuff, vx * 3);
			dirs.set(v, vx * 3);
			loc.set(c0, vx * 3);
			uvs.set([u, 1-w], vx * 2);
			normals.set([0, -1, 0], vx * 3);

			// upper
			const jx = vx + stride;  // stride from lower vertex to the upper
			pos.set([vbuff[0], vbuff[1] + h, vbuff[2]], jx * 3);
			dirs.set(v, jx * 3);
			loc.set([c0[0], c0[1] + h, c0[2]], jx * 3);
			uvs.set([u, w], jx * 2);
			normals.set([0, 1, 0], jx * 3);
		}

		// create 2 faces of tile0[a, b, c], at c0
		function capFace(a, b, c, f0) {
			// down side
			index.push(a + f0, c + f0, b + f0); // downward
			// up
			index.push(a + f0 + stride, b + f0 + stride, c + f0 + stride);
		}
	}

	/**
	 * cell.radius: default 1
	 * @param {number} r circumcircle's radius
	 * @return {object} {vert, norm, r, r05, sqrt32}, where<br>
	 * .vert: an array of hexagon vertices<br>
	 * norm: 6 direction's normal<br>
	 * r: the radius<br>
	 * r05: half r<br>
	 * sqrt32:√3/2 * r
	 * @member xgeom.hexatile
	 * @function
	 */
	static hexatile(r) {
		// √3/2
		const u32 = Math.sqrt(3) * 0.5;
		// √3/2 r, 0.5 r
		r = r || 1;
		const r32 = r * u32;
		const r05 = r * 0.5;
		// return {vert: [[ 0, 0,  -r ], [r32, 0, -r05], [r32, 0, r05], [ 0,  0,  r ], [-r32, 0, r05], [-r32, 0, -r05]],
		// 		norm: [[.5, 0, -u32], [  1, 0,   0 ], [ .5, 0, u32], [-.5, 0, u32], [  -1, 0,  0 ], [ -.5, 0, -u32]]};
		return {r, sqrt32: r32, r05,
			vert: [[ 0, 0,  r ], [r32, 0, r05], [r32, 0, -r05], [ 0,  0,  -r ], [-r32, 0, -r05], [-r32, 0, r05]],
			norm: [[.5, 0, u32], [  1, 0,  0 ], [ .5, 0, -u32], [-.5, 0, -u32], [  -1, 0,   0 ], [ -.5, 0, u32]]};
	}

	/**<p id='texPrism3857'>Generate a prism by extruding polygon.</p>
	 * This method is also handling virtual boxes if the features is generated
	 * correctly before the polygon been handled.
	 * @param {object} cell array of geojson features.
	 * @param {array} geoCenter [x, y] in 3857
	 * @param {object} ctx context of stream data processing<pre>
        pos: Float32Array(verts * 3);
        loc: Float32Array(verts * 3);
        atiles: Float32Array(verts * 2), tiles attribute, number of x,z tiles
        uvs: Float32Array(verts * 2);
        normals: Float32Array(verts * 3);
        box: Float32Array(verts * 3); attribute a_box,
        index: [] js 1D array of face vertices index;
        vx: number - the first vertex index of a feature. The function update
                     ctx.vx = ctx.vx + verts before return</pre>
	 * @return {object} ctx, part of vertices {pos, uvs, normals, dirs, index}, saved in ctx
	 * @member xgeom.texPrism3857
	 * @function
	 */
	static texPrism3857(cell, geoCentre, ctx) {
		let vbuff0 = [0, 0, 0];
		let vbuff1 = [0, 0, 0];
		let vbuff2 = [0, 0, 0];
		let nbuff  = [0, 0, 0];

		const h = cell.height >= 0 ? cell.height : 1;
		const s = cell.geoScale || 1;

		// 3857 cell.prismCentre => xworld
		const prismCentre = [0, 0, 0];
		geom.xof3857(cell.prismCentre, s, geoCentre, prismCentre);

		const xzwh = cell.xzwh;                // bounding
		const boxSize = cell.boxSize
				? [cell.boxSize[0], cell.boxSize[2], cell.geoScale]
				: [cell.xzwh.w, cell.xzwh.h, cell.geoScale];
		const tiles = cell.tile;

		// translate center and scale
		let c0 = [ geoCentre[0], 0, geoCentre[1] ];
		vec3.mulArr(c0, [s, 1, -s], c0); // -s: 3857 -> x-world

		let poly = cell.points.length;   // e.g. 4 side of a rectangle
		let verts = poly * 2 * 2 + poly; // 4 lateral faces with 4 * 2 * 2 vertices, plus upward faces

		let {pos, loc, atiles, uvs, normals, box, index} = ctx;

		let xzPolygon = [];
		for (let ix = 1; ix <= poly; ix++) {
			let cellx = ix % poly;
			let cell0 = (ix - 1) % poly;

			// project 3857 & re-center
			let v1 = cell.points[cellx];
			vbuff1 = vec3.mulArr([v1[0], 0, v1[1]], [s, 1, -s], vbuff1);
			v1 = vec3.subArr(vbuff1, c0, vbuff1);

			let v0 = cell.points[cell0];
			vbuff0 = vec3.mulArr([v0[0], 0, v0[1]], [s, 1, -s], vbuff0);
			v0 = vec3.subArr(vbuff0, c0, vbuff0);

			// norm in x-world
			vec3.subArr(v1, v0, nbuff);
			let n = vec3.crossArr(nbuff, [0, 1, 0], nbuff);
			xzPolygon.push( {v: [...v1], n: [...n]} );
			setLateralFace(v0, v1, n, h, ctx.vx, ix - 1);
		}

		// end caps
		let earbuff = [];
		let fx0 = ctx.vx + poly * 4; // starting cap vertex' index
		for (let ix = 0; ix < poly; ix++) {
			let {v, n} = xzPolygon[ix];
			earbuff.push(v[0], -v[2]);
			setCapverts(v, h, xzwh, fx0 + ix);
		}

		// earcut
		let triangles = earcut(earbuff);
		for (let vx of triangles)
			index.push(vx + fx0);

		tex = TexFlag.BLANK;
		tileSize = [1, 1];
		if (poly > 12) // too complex, use tessellation
			tex = TexFlag.TESSELLATE;
		else
			var {tex, tileSize} = snapPloygonDir(cell.points);

		ctx.vx += verts;
		ctx.a_tex = tex;
		ctx.a_size = tileSize;
		return ctx;

		// set a prism's up-down verts
		function setLateralFace(v0, v1, n, h, vx0, side) {
			// a    d  (upper follows)
			// |    |   ...
			// b    c  (lower first)
			// as lower first, verts arry is: [ b  c  a  d ... ]
			//                                  ^i + feature-x + side * 4
			let u0 = side / poly;
			let u1 = (side + 1) / poly;

			let vx = vx0 + side * 4;
			// lower
			let b = vx;
			pos.set(v0, vx * 3);
			box.set(boxSize, vx * 3);
			atiles.set(tiles, vx * 3);
			loc.set(prismCentre, vx * 3);
			uvs.set([u0, 0], vx * 2);
			// normals.set([n[0], 0, n[2]], vx * 3);
			// normals.set([0, 0, 1], vx * 3);
			normals.set(vec3.unit([n[0], 0, n[2]], nbuff), vx * 3);

			vx++;
			let c = vx;
			pos.set(v1, vx * 3);
			box.set(boxSize, vx * 3);
			atiles.set(tiles, vx * 3);
			loc.set(prismCentre, vx * 3);
			uvs.set([u1, 0], vx * 2);
			// normals.set([n[0], 0, n[2]], vx * 3);
			// normals.set([1, 0, 0], vx * 3);
			normals.set(vec3.unit([n[0], 0, n[2]], nbuff), vx * 3);

			// upper
			vx++;
			let a = vx;
			pos.set([v0[0], v0[1] + h, v0[2]], vx * 3);
			box.set(boxSize, vx * 3);
			atiles.set(tiles, vx * 3);
			loc.set(prismCentre, vx * 3);
			uvs.set([u0, 1], vx * 2);
			// normals.set([n[0], 0, n[2]], vx * 3);
			// normals.set([0, 0, -1], vx * 3);
			normals.set(vec3.unit([n[0], 0, n[2]], nbuff), vx * 3);

			vx++;
			let d = vx;
			pos.set([v1[0], v1[1] + h, v1[2]], vx * 3);
			box.set(boxSize, vx * 3);
			atiles.set(tiles, vx * 3);
			loc.set(prismCentre, vx * 3);
			uvs.set([u1, 1], vx * 2);
			// normals.set([n[0], 0, n[2]], vx * 3);
			// normals.set([-1, 0, 0], vx * 3);
			normals.set(vec3.unit([n[0], 0, n[2]], nbuff), vx * 3);

			index.push(b, c, d);
			index.push(b, d, a);
		}

		function setCapverts(v0, h, geoxzwh, jx) {
			var u = (v0[0] - geoxzwh.x) / geoxzwh.w;
			var v = (v0[2] - geoxzwh.z) / geoxzwh.h;
			// roof face
			vec3.addArr(v0, [0, h, 0], v0);
			pos.set(v0, jx * 3);
			box.set(boxSize, jx * 3);
			atiles.set(tiles, jx * 3);
			loc.set(prismCentre, jx * 3);
			uvs.set([u, v], jx * 2);
			normals.set([0, 1, 0], jx * 3);
		}

		// find an acceptable texture by snap polygon direction
		function snapPloygonDir(geometry) {
			return {tex: TexFlag.BLANK, tileSize: [12, 12]};
		}
	}

	/**Get bounding box of a polygon
	 * @param {array} polygon, geojson feature's geometry.coordinates, in EPSG 3857
	 * @return {object} {xzwh, loc}, where x,z:lower left xy, w,h:width height, loc: center
	 * @member xgeom.xzBox
	 * @function
	 */
	static xzBox(polygon) {
		if (!polygon || !polygon.length || polygon.length <= 0)
			return {xzwh: {x: 0, z: 0, w: 10, h: 10}, c0: [0, 0]};
		var mxx = -Infinity, mnx = Infinity, mxz = -Infinity, mnz = Infinity;
		for (var p of polygon) {
			if (mxx < p[0]) mxx = p[0];
			if (mnx > p[0]) mnx = p[0];
			if (mxz < p[1]) mxz = p[1];
			if (mnz > p[1]) mnz = p[1];
		}

		return {xzwh: {x: mnx, z: mnz, w: mxx - mnx, h: mxz - mnz},
				loc: [(mxx + mnx) / 2, (mxz + mnz) / 2] };
	}

	/**Get xworld postion of 3857 position.
	 * @param {array} xy [x, y] in EPSG 3857
	 * @param {number} geoScale scale
	 * @param {array} geoC0 c0(x, y)
	 * @param {array} buf [x * geoScale, 0, -y * geoScale] x-world position
	 * @return {array} buf
	 * @member xgeom.xof3857
	 * @function
	 */
	static xof3857(xy, geoScale, geoC0, buf) {
		var x = xy[0], y = xy[1];
		buf[0] = (x - geoC0[0]) * geoScale;
		buf[1] = 0;
		buf[2] = (y - geoC0[1]) * -geoScale;
		return buf;
	}
}

// Reference
// https://discourse.threejs.org/t/simple-rectangular-geometry-extrusion-anyone/743/14
// function ProfiledContourGeometry(profileShape, contour, contourClosed) {
// Example code ignored
// }

import * as THREE from 'three';
import {XError} from '../xutils/xcommon';
import {Obj3Type} from '../component/obj3';

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
				var geomCurve;
				if (cmpObj3.geom === Obj3Type.RandomCurve) {
				 	var line = new THREE.CatmullRomCurve3( points );
					var samples = line.getPoints( points.length * 6 ) // subdivisions: 6;
					geomCurve = new THREE.BufferGeometry().setFromPoints( samples );
				}
				else {
					geomCurve = new THREE.BufferGeometry().setFromPoints( points );
					// line = new THREE.LineSegments(geomCurve);
				}
				return {geomCurve, points};
			case Obj3Type.PointSect:
				// TODO  test
				var points = [];
				for (var segx = 0; segx < paras.points.length / 2; segx += 2) {
					var xyz = paras.points[segx];
					points.push( new THREE.Vector3( xyz[0], xyz[1], xyz[2] ) );
				}

				var geomCurve = new THREE.BufferGeometry().setFromPoints( points );
				// var line = new THREE.LineSegments(geomCurve);
				return {geomCurve, points};
			case Obj3Type.PointGrid:
			case Obj3Type.PointCurve:
			default:
				throw new XError('Unsupported curve: ', cmpObj3.geom, cmpObj3);
		}
	}

	/**Generate curve
	 * @param {object} cmpObj3 Obj3
	 * @param {object} paras e.g. Visual.paras
	   paras.points: 2d array of points, segment = [[x, y, z], [x, y, z]]
	   paras.scale: scale of points, useful when mappig grid index to chart world</pre>
	 * @return {object} {curve, points}, where geomCurve is THREE.BufferGeometry,
	 * points is the THREE.Vector3 array
	 * @member xgeom.generateCurve
	 * @function
	 */
	static generateSegments(cmpObj3, paras) {
		switch (cmpObje3.geom) {
			case Obj3Type.RandomSect:
				throw new XError('geom.generateLines: TODO RandomSect');
				break;
			case Obj3Type.PointSect:
				var sects = [];
				var vec3Points = [];
				var s = paras.scale === undefined ? 1 : paras.scale;
				for (var segx = 0; segx < paras.points.length; segx += 2) {
					var xyz = paras.points[segx][0];
					var p1 = new THREE.Vector3( xyz[0] * s, xyz[1] * s, xyz[2] * s );
					xyz = paras.points[segx][1];
					var p2 = new THREE.Vector3( xyz[0] * s, xyz[1] * s, xyz[2] * s );
					var geom = new THREE.BufferGeometry().setFromPoints( [p1, p2] );
					points.push( [p1, p2] );
					sects.push( geom );
				}
				return {geoms: sects, points: vec3Points};
			default:
				throw new XError('geom.generateLines: Unsupported line geometry: ',
								cmpObj3.geom, cmpObj3);
		}
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

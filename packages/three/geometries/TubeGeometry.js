import { Geometry, BufferGeometry, Float32BufferAttribute, Vector2, Vector3 } from 'three';

/**@class ThreeExt */
class ThreeExt {
}

/**Tube geometry providing vertex attribute 'dir'.
 *
 * Modified from three.js source.
 * @author oosmoxiecode / https://github.com/oosmoxiecode
 * @author WestLangley / https://github.com/WestLangley
 * @author zz85 / https://github.com/zz85
 * @author miningold / https://github.com/miningold
 * @author jonobr1 / https://github.com/jonobr1
 * @author Mugen87 / https://github.com/Mugen87
 *
 * @constructor DirTubeGeometry
 * @param {THREE.Curve} path
 * @param {int} tubularSegments
 * @param {number} radius
 * @param {int} radialSegments
 * @param {bool} closed
 * @memberof ThreeExt
 */
function DirTubeGeometry( path, tubularSegments, radius, radialSegments, closed ) {

	Geometry.call( this );

	this.type = 'DirTubeGeometry';

	this.parameters = {
		path: path,
		tubularSegments: tubularSegments,
		radius: radius,
		radialSegments: radialSegments,
		closed: closed
	};

	// if ( taper !== undefined ) console.warn( 'THREE.TubeGeometry: taper has been removed.' );

	var bufferGeometry = new DirTubeBufferGeometry( path, tubularSegments, radius, radialSegments, closed );

	// expose internals

	this.tangents = bufferGeometry.tangents;
	this.normals = bufferGeometry.normals;
	this.binormals = bufferGeometry.binormals;

	// create geometry

	this.fromBufferGeometry( bufferGeometry );
	this.mergeVertices();

}

DirTubeGeometry.prototype = Object.create( Geometry.prototype );
DirTubeGeometry.prototype.constructor = DirTubeGeometry;

/**Tube geometry providing vertex attribute 'a_tan', the path direction.
 *
 * Modified from three.js source.
 * @author oosmoxiecode / https://github.com/oosmoxiecode
 * @author WestLangley / https://github.com/WestLangley
 * @author zz85 / https://github.com/zz85
 * @author miningold / https://github.com/miningold
 * @author jonobr1 / https://github.com/jonobr1
 * @author Mugen87 / https://github.com/Mugen87
 *
 * @class DirTubeBufferGeometry
 * @param {THREE.Curve} path
 * @param {int} tubularSegments
 * @param {number} radius
 * @param {int} radialSegments
 * @param {bool} closed
 * @memberof ThreeExt
 */
function DirTubeBufferGeometry( path, tubularSegments, radius, radialSegments, closed ) {

	BufferGeometry.call( this );

	this.type = 'DirTubeBufferGeometry';

	this.parameters = {
		path: path,
		tubularSegments: tubularSegments,
		radius: radius,
		radialSegments: radialSegments,
		closed: closed
	};

	tubularSegments = tubularSegments || 64;
	radius = radius || 1;
	radialSegments = radialSegments || 8;
	closed = closed || false;

	// {tangents: tangents,
	//	normals: normals,
	//	binormals: binormals}
	var frames = path.computeFrenetFrames( tubularSegments, closed );

	// expose internals

	this.tangents = frames.tangents;
	this.normals = frames.normals;
	this.binormals = frames.binormals;

	// helper variables

	var vertex = new Vector3();
	var normal = new Vector3();
	var uv = new Vector2();
	var P = new Vector3();

	var i, j;

	// buffer

	var vertices = [];
	var normals = [];
	var uvs = [];
	var indices = [];
	// odys: vertices' tangents
	var vertans = [];

	// ody
	var dirs = [];

	// create buffer data

	generateBufferData();

	// build geometry

	this.setIndex( indices );
	this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
	this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
	this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );
	// odys:
	this.setAttribute( 'a_tan', new Float32BufferAttribute( vertans, 3 ) );

	// functions

	function generateBufferData() {

		for ( i = 0; i < tubularSegments; i ++ ) {
			generateSegment( i );

			// ody
			var T = frames.tangents[i];
			dirs.push ( T.x, T.y, T.z );
		}

		// if the geometry is not closed, generate the last row of vertices and normals
		// at the regular position on the given path
		//
		// if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

		generateSegment( ( closed === false ) ? tubularSegments : 0 );

		// uvs are generated in a separate function.
		// this makes it easy compute correct values for closed geometries

		generateUVs();

		// finally create faces

		generateIndices();

	}

	function generateSegment( i ) {

		// we use getPointAt to sample evenly distributed points from the given path

		P = path.getPointAt( i / tubularSegments, P );

		// retrieve corresponding normal and binormal

		var N = frames.normals[ i ];
		var B = frames.binormals[ i ];
		// odys
		var T = frames.tangents[ i ];

		// generate normals and vertices for the current segment

		for ( j = 0; j <= radialSegments; j ++ ) {

			var v = j / radialSegments * Math.PI * 2;

			var sin = Math.sin( v );
			var cos = - Math.cos( v );

			// normal

			normal.x = ( cos * N.x + sin * B.x );
			normal.y = ( cos * N.y + sin * B.y );
			normal.z = ( cos * N.z + sin * B.z );
			normal.normalize();

			normals.push( normal.x, normal.y, normal.z );

			// vertex

			vertex.x = P.x + radius * normal.x;
			vertex.y = P.y + radius * normal.y;
			vertex.z = P.z + radius * normal.z;

			vertices.push( vertex.x, vertex.y, vertex.z );

			// odys: Why not do this in GPU?
			vertans.push( T.x, T.y, T.z );
		}
	}

	function generateIndices() {
		for ( j = 1; j <= tubularSegments; j ++ ) {
			for ( i = 1; i <= radialSegments; i ++ ) {
				var a = ( radialSegments + 1 ) * ( j - 1 ) + ( i - 1 );
				var b = ( radialSegments + 1 ) * j + ( i - 1 );
				var c = ( radialSegments + 1 ) * j + i;
				var d = ( radialSegments + 1 ) * ( j - 1 ) + i;

				// faces
				indices.push( a, b, d );
				indices.push( b, c, d );
			}
		}
	}

	function generateUVs() {
		for ( i = 0; i <= tubularSegments; i ++ ) {
			for ( j = 0; j <= radialSegments; j ++ ) {
				uv.x = i / tubularSegments;
				uv.y = j / radialSegments;

				uvs.push( uv.x, uv.y );
			}
		}
	}

}

DirTubeBufferGeometry.prototype = Object.create( BufferGeometry.prototype );
DirTubeBufferGeometry.prototype.constructor = DirTubeBufferGeometry;

DirTubeBufferGeometry.prototype.toJSON = function () {

	var data = BufferGeometry.prototype.toJSON.call( this );
	// odys: what about vertans?

	data.path = this.parameters.path.toJSON();

	return data;
};

export { DirTubeGeometry, DirTubeBufferGeometry };

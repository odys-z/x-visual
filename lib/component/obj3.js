/** @namespace xv.ecs.comp.obj
 */

import {LayerChannel} from '../xmath/layer'

/**Types of THREE.Geometry, in addition to some extensions like wireframe
 *
 * TODO rename as GeomType
 * @type Obj3Type
 * @memberof xv.ecs.comp.obj
 */
const Obj3Type = {
	// custom or undefined
	USER: 0,

	// geometry
	BOX: 1,
	PLANE: 2,
	SPHERE: 3,
	TORUS: 4,
	CONE: 5,
	Cylinder: 6,
	TETRAHEDRON: 0x10,	//https://threejs.org/docs/index.html#api/en/geometries/TetrahedronGeometry
	DODECAHEDRON: 0x11,	// https://threejs.org/docs/index.html#api/en/geometries/DodecahedronBufferGeometry
	OCTAHEDRON: 0x12,	// https://threejs.org/docs/index.html#api/en/geometries/OctahedronBufferGeometry
	ICOSAHEDRON: 0x13,	// https://threejs.org/docs/index.html#api/en/geometries/IcosahedronGeometry
	SHAPE: 0x20,		// https://threejs.org/docs/index.html#api/en/geometries/ShapeGeometry
	RING: 0X21,			// https://threejs.org/docs/index.html#api/en/geometries/RingGeometry
	POLYHEDRON: 0x22,	// THREE.PolyhedronBufferGeometry, not supported
	LATHE: 0x23,		// https://threejs.org/docs/index.html#api/en/geometries/LatheGeometry

	// morph FIXME wrong?
	MORPH: 0x40,		// https://threejs.org/examples/?q=Geometry#webgl_buffergeometry_morphtargets

	// line
	// For gl.LINE_STRip vs. gl.LINES, see https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
	Circle: 0x82,
	Hilbert: 0x83,
	RandomCurve: 0x84,
	RandomSects: 0x85,
    PointSect: 0x86,    // THREE.Curve, with section points provided by user
    PointGrid: 0x87,    // same as pointSect, but converted to THREE.CatmullRomCurve3
    PointCurve: 0x88,   // same as pointSect, but connected in 2D direction

    CatmullRom: 0x89,

    Spline: 0x91,
    XyHyperbola: 0x92,
    XyParabola: 0x93,
    XyEllipse: 0x94,
};


/** If Visual.vtype is mesh, sys.Thrender will create a THREE.Object3D according
 * to this component.
 *
 * See also xv.ecs.sys.Thrender.createObj3s().
 * @type Obj3
 * @memberof xv.ecs.comp.obj
 */
const Obj3 = {
  properties: {
    geom: Obj3Type.USER,
	layers: 1 << LayerChannel.ALL,
	occluding: 0,        // 0: 1 << LayerChannel.NONE,
	box: [20, 20, 20],   // always not null
	mesh: undefined,     // THREE.Mesh for BOX etc. or Array of vertices for POINTS
	transform: undefined,// {translate, scale, rotate, shear, reflect, mat4}, default unused
	affines: undefined,  // moved to CmpTween. Elements are same as 'transform', but used by xtweener, and mart4 is used for combined results; default must be undefined, created by XTweener
	combined: undefined, // affines combinatiion, {m4, m0}, m4 is used as tweeing buffer to combine all affine transformation in CmpTween.affines
	mi: undefined,       // mat4 of combined transformation
	invisible: false,
	uniforms: undefined
  }
};




export {Obj3, Obj3Type};

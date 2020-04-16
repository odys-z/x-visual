import {LayerChannel} from '../xmath/layer'

/**Types of THREE.Geometry, in addition to some extensions like wireframe.
 *
 * To be rename as GeomType
 * @class Obj3Type
 * @memberof XComponent
 */
const Obj3Type = {
	// custom or undefined
	USER: 0,

	/**THREE.Box:<br>
	 * Obj3.box paras:<br>
	 * [width, height, depth]
	 * @member Obj3Type#BOX
	 * @property {int} BOX - three.js box geometry
	 * @memberof XComponent
	 */
	BOX: 1,
	PLANE: 2,
	SPHERE: 3,
	TORUS: 4,
	CONE: 5,

	/** THREE.Cylinder<br>
	 * box paras:<br>
	 *       radiusTop — Radius of the cylinder at the top. Default is 1.<br>
	 *       radiusBottom — Radius of the cylinder at the bottom. Default is 1.<br>
	 *       height — Height of the cylinder. Default is 1.<br>
	 *       radialSegments — Number of segmented faces around the circumference of the cylinder. Default is 8<br>
	 *       heightSegments — Number of rows of faces along the height of the cylinder. Default is 1.<br>
	 *       openEnded — A Boolean indicating whether the ends of the cylinder are open or capped. Default is false, meaning capped.<br>
	 *       thetaStart — Start angle for first segment, default = 0 (three o'clock position).<br>
	 *       thetaLength — The central angle, often called theta, of the circular sector. The default is 2*Pi, which makes for a complete cylinder.<br>
	 * @const
	 * @member Obj3Type#Cylinder
	 * @property {int} BOX - three.js cylinder geometry
	 * @memberof XComponent
	 */
	Cylinder: 6,
	/** https://threejs.org/docs/index.html#api/en/geometries/TetrahedronGeometry
	 * @member Obj3Type#Tetrahedron
	 * @property {int} BOX - three.js tetrahedron geometry
	 * @memberof XComponent
	 */
	Tetrahedron: 0x10,	//
	/** https://threejs.org/docs/index.html#api/en/geometries/DodecahedronBufferGeometry
	 * @const
	 * @member Obj3Type#Dodecahedron
	 * @property {int} Dodecahedron - three.js dodecahedron geometry
	 */
	Dodecahedron: 0x11,
	/** https://threejs.org/docs/index.html#api/en/geometries/OctahedronBufferGeometry
	 * @const
	 * @member Obj3Type#Octahedron
	 * @property {int} Octahedron - three.js octahedron geometry
	 */
	Octahedron: 0x12,	//
	/** https://threejs.org/docs/index.html#api/en/geometries/IcosahedronGeometry
	 * @const
	 * @member Obj3Type#Icosahedron
	 * @property {int} Icosahedron - three.js Icosahedron geometry
	 */
	Icosahedron: 0x13,	//
	SHAPE: 0x20,		// https://threejs.org/docs/index.html#api/en/geometries/ShapeGeometry
	RING: 0X21,			// https://threejs.org/docs/index.html#api/en/geometries/RingGeometry
	Polyhedron: 0x22,	// THREE.PolyhedronBufferGeometry, not supported
	/** https://threejs.org/docs/index.html#api/en/geometries/LatheGeometry
	 * @const
	 * @member Obj3Type#Lathe
	 * @property {int} Lathe - three.js lathe geometry
	 */
	Lathe: 0x23,		//

	// morph FIXME wrong?
	MORPH: 0x40,		// https://threejs.org/examples/?q=Geometry#webgl_buffergeometry_morphtargets

	// line
	// For gl.LINE_STRip vs. gl.LINES, see https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm
	CIRCLE: 0x82,
	HILBERT: 0x83,
	RandomCurve: 0x84,
	RandomSects: 0x85,
    PointSect: 0x86,    // THREE.Curve, with section points provided by user
    PointGrid: 0x87,    // same as pointSect, but converted to THREE.CatmullRomCurve3
    PointCurve: 0x88,   // same as pointSect, but connected in 2D direction - helbert?

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
 *
 * @class Obj3
 * @memberof XComponent
 */
const Obj3 = {
  properties: {
	/**@member Obj3#geom
	 * @property {Obj3Type} geom - geometry type
	 * @memberof XComponent */
    geom: Obj3Type.USER,
	/**@member Obj3#layers
	 * @property {LayerChannel} layers - channel mask managed by x-visual.
	 * User shouldn't use it. Use *chennels* to set visible channels.
	 * @memberof XComponent */
	layers: 1 << LayerChannel.ALL,
	/**@member Obj3#channel
	 * @property {LayerChannel} channel - channel: [0 ~ 15].
	 * User shouldn't use it. Use *chennels* to set visible channels.
	 * @memberof XComponent */
	channels: undefined,
	/**@member Obj3#occluding
	 * @property {int} occluding - 0: 1 << LayerChannel.NONE,
	 * @memberof XComponent */
	occluding: 0,        // 0: 1 << LayerChannel.NONE,
	/**@member Obj3#box
	 * @property {array} box  - geometry constructor parameters, always not null
	 * @memberof XComponent */
	box: undefined,
	/**@member Obj3#mesh
	 * @property {array} mesh - THREE.Mesh for BOX etc. or Array of vertices for POINTS
	 * @memberof XComponent */
	mesh: undefined,
	/**@member Obj3#transform
	 * @property {array} transform - {translate, scale, rotate, shear, reflect, mat4}, default unused
	 * @memberof XComponent */
	transform: undefined,
	/**@deprecated moved to CmpTween?
	 * @member Obj3#affines
	 * @property {array} affines - Elements are same as 'transform',
	 * but used by xtweener, and mart4 is used for combined results;
	 * default must be undefined, created by XTweener
	 * @memberof XComponent */
	affines: undefined,
	/**@member Obj3#combined
	 * @property {array} combined - affines combinatiion, {m4, m0},
	 * m4 is used as tweeing buffer to combine all affine transformation in CmpTween.affines
	 * @memberof XComponent */
	combined: undefined,
	/**@member Obj3#m0
	 * @property {array} m0 - mesh's matrix snapshot at the biginning of all sequences actived.
	 * @memberof XComponent */
	m0: undefined,
	/**@member Obj3#mi
	 * @property {array} mi - mat4 of combined transformation
	 * @memberof XComponent */
	mi: undefined,
	/**@member Obj3#mi_z
	 * @property {array} mi_z - mi backup (later can be used for keeping results)
	 * @memberof XComponent */
	mi_z: undefined,
	/**@member Obj3#invisible
	 * @property {array} invisible - not visible, default false
	 * @memberof XComponent */
	invisible: false,
	/**@member Obj3#unforms
	 * @property {array} unforms - uniforms for shader
	 * @memberof XComponent */
	uniforms: undefined,
	/**@member Obj3#datum
	 * @property {array} datum  - used as user custom data
	 * @memberof XComponent */
	datum: undefined
  }
};

export {Obj3, Obj3Type};

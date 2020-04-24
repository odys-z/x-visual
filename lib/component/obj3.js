import {LayerChannel} from '../xmath/layer'

/**Why Obj3Type not documented without this section?
 * @memberof XComponent
 * @class Testclass
 */
const Testclass = {};

/**Types of THREE.Geometry, in addition to some extensions like shapes in 2d.
 *
 * TODO To be renamed as GeomType
 *
 * @enum {int} Obj3Type
 * @memberof XComponent
 */
const Obj3Type = {
	/** custom or undefined
	 */
	USER: 0,

	/**THREE.Box:<br>
	 * Obj3.box paras:<br>
	 * [width, height, depth]
	 */
	BOX: 1,
	PLANE: 2,
	SPHERE: 3,
	TORUS: 4,
	CONE: 5,

	/** THREE.Cylinder<br>
	 * box paras:<br>
	 * radiusTop — Radius of the cylinder at the top. Default is 1.<br>
	 * radiusBottom — Radius of the cylinder at the bottom. Default is 1.<br>
	 * height — Height of the cylinder. Default is 1.<br>
	 * radialSegments — Number of segmented faces around the circumference of the cylinder. Default is 8<br>
	 * heightSegments — Number of rows of faces along the height of the cylinder. Default is 1.<br>
	 * openEnded — A Boolean indicating whether the ends of the cylinder are open or capped. Default is false, meaning capped.<br>
	 * thetaStart — Start angle for first segment, default = 0 (three o'clock position).<br>
	 * thetaLength — The central angle, often called theta, of the circular sector. The default is 2*Pi, which makes for a complete cylinder.<br>
	 */
	Cylinder: 6,
	/** <a href='https://threejs.org/docs/index.html#api/en/geometries/TetrahedronGeometry'>Three.js Tetrahedron</a> */
	Tetrahedron: 0x10,	//
	/** <a href='https://threejs.org/docs/index.html#api/en/geometries/DodecahedronBufferGeometry'>Three.js Dodecahedron</a> */
	Dodecahedron: 0x11,
	/** <a href='https://threejs.org/docs/index.html#api/en/geometries/OctahedronBufferGeometry'>Three.js Octahedron</a> */
	Octahedron: 0x12,	//
	/** <a href='https://threejs.org/docs/index.html#api/en/geometries/IcosahedronGeometry'>Three.js Icosahedron</a> */
	Icosahedron: 0x13,	//
	/** <a href='https://threejs.org/docs/index.html#api/en/geometries/ShapeGeometry'>Three.js Icosahedron</a> */
	SHAPE: 0x20,
	/** <a href='https://threejs.org/docs/index.html#api/en/geometries/RingGeometry'>Three.js Icosahedron</a> */
	RING: 0X21,
	/** THREE.PolyhedronBufferGeometry, not supported */
	Polyhedron: 0x22,
	/** <a href='https://threejs.org/docs/index.html#api/en/geometries/LatheGeometry'>Three.js Icosahedron</a> */
	Lathe: 0x23,		//

	/** morph FIXME wrong?
	 *
	 * <a href='https://threejs.org/examples/?q=Geometry#webgl_buffergeometry_morphtargets'>Three.js Icosahedron</a>
	MORPH: 0x40,
	 */

	/** line<br>
	 * For gl.LINE_STRip vs. gl.LINES, see
	 * <a href='https://www.tutorialspoint.com/webgl/webgl_modes_of_drawing.htm'>Three.js Icosahedron</a>
	 */
	CIRCLE: 0x82,
	HILBERT: 0x83,
	RandomCurve: 0x84,
	RandomSects: 0x85,
	/** THREE.Curve, with section points provided by user */
    PointSect: 0x86,
	/** same as pointSect, but converted to THREE.CatmullRomCurve3 */
    PointGrid: 0x87,
	/** same as pointSect, but connected in 2D direction - helbert? */
    PointCurve: 0x88,

    CatmullRom: 0x89,

    Spline: 0x91,
    XyHyperbola: 0x92,
    XyParabola: 0x93,
    XyEllipse: 0x94,
};

/**Main scene Object, like THREE.Mesh, THREE.Points, etc.
 *
 * Typically, if Visual.vtype is mesh, sys.Thrender will create a THREE.Object3D according
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
		/**Parent group's engity id
		 * TODO in version 1.0, only works for HudGroup parent.
		 * @member Obj3#group
		 * @property {string} group - entity id of parent group
		 * @memberof XComponent */
		group: undefined,
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
		occluding: 0,
		/**@member Obj3#box
		 * @property {array} box  - geometry constructor parameters, always not null
		 * @memberof XComponent */
		box: [20, 20, 20],
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

/** HUD display group. All child in the group are always facing camera.
 *
 * @class HudGroup
 * @memberof XComponent
 */
const HudGroup = {
	properties: {
		/**@member HudGroup#background
		 * @property {Obj3Type} background - background color, do not set unless main scene shoudn't visible
		 * @memberof XComponent */
		background: undefined,
		/**@member HudGroup#scene
		 * @property {Obj3Type} scene - used by x-visual
		 * @memberof XComponent */
		scene: undefined,
		/**@member HudGroup#camera
		 * @property {Obj3Type} camera - used by x-visual
		 * @memberof XComponent */
		camera: undefined
	}
}

/** HUD child object.
 *
 * @class HudChild
 * @memberof XComponent
 */
const HudChild = {
	properties: {
		/**@member HudChild#hud
		 * @property {Obj3Type} hud - hud entity id for will this child been attached
		 * @memberof XComponent */
		hud: undefined,
	}
}

export {Obj3, Obj3Type, HudGroup, HudChild};

/** @module xv.ecs.comp.three */

const Obj3Type = {
	USER: 0,
	BOX: 1,
	PLANE: 2,
	SPHERE: 3,
	TORUS: 4,
	CONE: 5,
	CYLINDER: 6,
	TETRAHEDRON: 0x10,	//https://threejs.org/docs/index.html#api/en/geometries/TetrahedronGeometry
	DODECAHEDRON: 0x11,	// https://threejs.org/docs/index.html#api/en/geometries/DodecahedronBufferGeometry
	OCTAHEDRON: 0x12,	// https://threejs.org/docs/index.html#api/en/geometries/OctahedronBufferGeometry
	ICOSAHEDRON: 0x13,	// https://threejs.org/docs/index.html#api/en/geometries/IcosahedronGeometry
	SHAPE: 0x20,		// https://threejs.org/docs/index.html#api/en/geometries/ShapeGeometry
	RING: 0X21,			// https://threejs.org/docs/index.html#api/en/geometries/RingGeometry
	POLYHEDRON: 0x22,	// https://threejs.org/docs/index.html#api/en/geometries/PolyhedronBufferGeometry
	LATHE: 0x23,		// https://threejs.org/docs/index.html#api/en/geometries/LatheGeometry

	MORPH: 0x40,		// https://threejs.org/examples/?q=Geometry#webgl_buffergeometry_morphtargets

	WIREFRAME: 0x80,
	CIRCLE: 0x81,

	PATH: 0x100,
};

const Obj3 = {
  properties: {
    type: 0,
	box: [20, 20, 20],
	mesh: undefined
  }
};

export {Obj3, Obj3Type};

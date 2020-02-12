
/** @module xv.ecs.comp */

/* texture | basic material | custom shader ...
 */
const AssetType = {
	gltf: 0,	// gltf asset file
	materail: 1, mat: 1, // short for material
	shader: 2,
	cust: 3,	// customer
	mesh: 4,	// mesh created like THREE.Mesh(), usually loaded from gltf asset
	point: 5,	// THREE.Points. Note Obj3Type.POINTS is an array of vertices buffer.
	refPoint: 6,// THREE.Points created from referencing model, with asset = entity id.
	cubeVoxel: 7, // voxel generated for Obj3.box
	cubeVoxels: 7,// ShaderFlag has a similar name, makes this error proven
	canvas: 8,	// test: htmltex.html
	wireframe: 9, // opengl / webgl wireframe
	sprite: 10,
}

/** javascript operators uses 32 bits signed integers
 * see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
 */
const ShaderFlag = {
	mask: 0xffff,	// 16 bits for types
	defaultex: 1 << 16,	// use default texture
	testPoints: 1,		// default
	randomParticles: 2,
	cubeVoxels: 3,
}

const Visual = {
  properties: {
	vtype: 0,
	shader: ShaderFlag.testPoints,
	asset: '', // texture path, mesh, sprite, shader, materail, ...
	paras: {},
  }
};

/**This component can only work with Visaul and make sure
 * Visual.vtype = AssetType.canvas
 */
const Canvas = {
  properties: {
	domId: '',			// dom id
	tex: undefined,		// THREE.CanvasTexture
	canvas: undefined,	// html canvas
	ctx2d: undefined,	// html canvas 2d context
	dirty: false,
	stamp: -1,			// last tick when updating
	options: {},
  }
}

export {Visual, Canvas, AssetType, ShaderFlag};

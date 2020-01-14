
/** @module xv.ecs.comp */

/* texture | basic material | custom shader ...
 */
const AssetType = {
	tex: 0,		// no such case?
	materail: 1,
	mat: 1,		// short for material
	shader: 2,
	cust: 3,	// customer
	mesh: 4,	// mesh created like THREE.Mesh()
	gltf: 5,	// gltf asset, typically loaded by THREE.GLTFLoader
	canvas: 6,
	sprite: 7,
}

const Visual = {
  properties: {
	vtype: 0,
	// sprite: {}, // suposing
	// shader: {fx: 'id', vs: 'id'}, // suposing
	// matId: '',
	asset: '', // texture path, mesh, sprite, shader, materail, ...
	uniforms: {}
  }
};

const Canvas = {
  // Visual.vtype = AssetType.canvas,
  properties: {
	domId: '', // dom id
	tex: undefined,	// THREE.CanvasTexture
	canvas: undefined, // html canvas
	ctx2d: undefined, // html canvas 2d context
	dirty: false,
	uniforms: {}
  }
}

export {Visual, Canvas, AssetType};

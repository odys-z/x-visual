
/** @module xv.ecs.comp */

/* texture | basic material | custom shader ...
 */
const AssetType = {
	tex: 0,
	materail: 1,
	mat: 1,		// short for material
	shader: 2,
	cust: 3,	// customer
	mesh: 4,	// mesh created like THREE.Mesh()
	gltf: 5,	// gltf asset, typically loaded by THREE.GLTFLoader
	sprite: 6,
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

export {Visual, AssetType};


/** @module xv.ecs.comp */

/* texture | basic material | custom shader ...
 */
const AssetType = {
	tex: 0,
	materail: 1,
	mat: 1,
	shader: 2,
	cust: 2,
	mesh: 3,
	sprite: 4,
}

const Visual = {
  properties: {
	vtype: 0,
	// sprite: {}, // suposing
	// shader: {fx: 'id', vs: 'id'}, // suposing
	// matId: '',
	assetId: '', // texture, mesh, sprite, shader, materail, ...
	uniforms: {}
  }
};

export {Visual, AssetType};

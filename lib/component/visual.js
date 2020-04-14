
/** texture | basic material | custom shader ...
 * @type AssetType
 * @memberof XComponent */
const AssetType = {
    gltf: 0,	   // gltf asset file
    materail: 1,
    mat: 1,        // short for material
    shader: 2,     // shaders provide by xglsl
    cust: 3,       // customer
    mesh: 4,       // mesh created like THREE.Mesh(), usually loaded from gltf asset

    point: 5,      // THREE.Points. Note Obj3Type.POINTS is an array of vertices buffer.
    refPoint: 6,   // THREE.Points created from referencing model, with asset = entity id.
    cubeVoxel: 7,  // voxel generated for Obj3.box
    cubeVoxels: 7, // ShaderFlag has a similar name, makes this error proven

    canvas: 8,     // html DOM as texture, test/example: htmltex.html

    wireframe: 9,  // opengl / webgl wireframe

    geomCurve: 10, // THREE.Curve, rendered as opengl / webgl line, created form Obj3.geom
    // pointSect: 11, // THREE.Curve, with section points provided by user
    // pointGrid: 12,// same as pointSect, but converted to THREE.CatmullRomCurve3
    // pointCurve: 13,// same as pointSect, but converted to THREE.CatmullRomCurve3

    svg: 14,
    sprite: 15,
}

/** javascript operators uses 32 bits signed integers
 * see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
 * @type ShaderFlag
 * @memberof XComponent */
const ShaderFlag = {
    mask: 0xffff,       // 16 bits for types
    defaultex: 1 << 16, // use default texture
    testPoints: 1,      // default
    randomParticles: 2,
    cubeVoxels: 3,
    throbStar: 4,
    flameLight: 5,
}

/**Object visual parameters, like texture assets, object type of line, frame, etc.
 * @class Visual
 * @memberof XComponent */
const Visual = {
  properties: {
	/**@member Visual#vtype
	 * @property {AssetType} vtype - VisualType
	 * @memberof XComponent */
    vtype: 0,
	/**@member Visual#shader
	 * @property {string} shader - x-visual shader id
	 * @memberof XComponent */
    shader: ShaderFlag.testPoints,
	/**@member Visual#asset
	 * @property {string} asset - texture path, mesh, sprite, shader, materail, ...
	 * @memberof XComponent */
    asset: undefined,
	/**@member Visual#paras
	 * @property {object} paras - see docs for detials
	 * @memberof XComponent */
    paras: undefined,
	/**@member Visual#material
	 * @property {THREE.Material} material - customer material if default is not usable
	 * @memberof XComponent */
	material: undefined
  }
};

/**This component can only work with Visaul and make sure
 * Visual.vtype = AssetType.canvas
 * @class Canvas
 * @memberof XComponent */
const Canvas = {
  properties: {
	/**@member Canvas#domId
	 * @property {string} domId - dom id
	 * @memberof XComponent */
    domId: '',
	/**@member Canvas#tex
	 * @property {string} tex - THREE.CanvasTexture
	 * @memberof XComponent */
    tex: undefined,
	/**@member Canvas#canvas
	 * @property {string} canvas - html canvas
	 * @memberof XComponent */
    canvas: undefined,
	/**@member Canvas#ctx2d
	 * @property {string} ctx2d - html canvas 2d context
	 * @memberof XComponent */
    ctx2d: undefined,
    dirty: false,
	/**@member Canvas#stamp
	 * @property {string} stamp - last tick when updating
	 * @memberof XComponent */
    stamp: -1,
	/**@member Canvas#options
	 * @property {string} options - see docs
	 * @memberof XComponent */
    options: {},
  }
}

export {Visual, Canvas, AssetType, ShaderFlag};

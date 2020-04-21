
/** texture | basic material | custom shader ...<pre>
    gltf: 0,	   // gltf asset file<br>
    materail: 1,
    mat: 1,        // short for material<br>
    shader: 2,     // shaders provide by xglsl<br>
    cust: 3,       // customer<br>
    mesh: 4,       // mesh created like THREE.Mesh(), usually loaded from gltf asset<br>
    point: 5,      // THREE.Points. Note Obj3Type.POINTS is an array of vertices buffer.<br>
    refPoint: 6,   // THREE.Points created from referencing model, with asset = entity id.<br>
    cubeVoxel: 7,  // voxel generated for Obj3.box<br>
    cubeVoxels: 7, // ShaderFlag has a similar name, makes this error proven<br>
    DomCanvas: 8,  // html DOM as texture, test/example: htmltex.html<br>
    wireframe: 9,  // opengl / webgl wireframe<br>
    GeomCurve: 10, // THREE.Curve, rendered as opengl / webgl line, created form Obj3.geom<br>
	dynaPolygon:11,// TODO Daynamic polygon, extruded and the top vertices can be animated, with customer shader (not in v0.3)
    arrow: 12,     // used by axis
    SVG: 14,
    sprite: 15,
	UserMesh: 16,  // user provide mesh in Obj3.mesh</pre>
 * @type AssetType
 * @memberof XComponent */
const AssetType = {
    gltf: 0,	   // gltf asset file<br>
    materail: 1,
    mat: 1,        // short for material<br>
    shader: 2,     // shaders provide by xglsl<br>
    cust: 3,       // customer<br>
    mesh: 4,       // mesh created like THREE.Mesh(), usually loaded from gltf asset<br>
    point: 5,      // THREE.Points. Note Obj3Type.POINTS is an array of vertices buffer.<br>
    refPoint: 6,   // THREE.Points created from referencing model, with asset = entity id.<br>
    cubeVoxel: 7,  // voxel generated for Obj3.box<br>
    cubeVoxels: 7, // ShaderFlag has a similar name, makes this error proven<br>
    DomCanvas: 8,  // html DOM as texture, test/example: htmltex.html<br>
    wireframe: 9,  // opengl / webgl wireframe<br>
    GeomCurve: 10, // THREE.Curve, rendered as opengl / webgl line, created form Obj3.geom<br>
	DynaPolygon:11,// Daynamic polygon, extruded and the top vertices can be animated, with customer shader (not in v0.3)
    arrow: 12,     // used by axis
    SVG: 14,
    Sprite: 15,
	UserMesh: 16,  // User provide mesh in Obj3.mesh
}

/** javascript operators uses 32 bits signed integers
 *
 * <a href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators'>
 * reference: javascript bitwise operators</a>
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
    colorArray: 6,
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
	/**
     * Shader for x-visual implemented visual types.
     * vtype accepting shaders include:<br>
     * AssetType.point<br>
     * AssetType.refPoint<br>
     * AssetType.cubeVoxel<br>
     * AssetType.UserMesh<br>
     * @member Visual#shader
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

/**Specify a canvas entity.
 * This component can only work with Visaul and make sure
 * Visual.vtype = AssetType.DomCanvas
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

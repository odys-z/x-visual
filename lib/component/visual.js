
/** texture | basic material | custom shader ...
 * @enum {int}
 * @memberof XComponent */
const AssetType = {
    /** gltf asset file */
    gltf: 0,
    materail: 1,
    /** short for material */
    mat: 1,
    /** shaders provide by xglsl */
    shader: 2,
    /** customer */
    cust: 3,
    /** mesh created like THREE.Mesh(), usually loaded from gltf asset */
    mesh: 4,
    /** THREE.Points. Note Obj3Type.POINTS is an array of vertices buffer. */
    point: 5,
    /** THREE.Points created from referencing model, with asset = entity id. */
    refPoint: 6,
    /** voxel generated for Obj3.box */
    cubeVoxel: 7,
    /** ShaderFlag has a similar name, makes this error proven */
    cubeVoxels: 7,
    /** html DOM as texture, test/example: htmltex.html */
    DomCanvas: 8,
    /** opengl / webgl wireframe */
    wireframe: 9,
    /** THREE.Curve, rendered as opengl / webgl line, created form Obj3.geom */
    GeomCurve: 10,
    /** Daynamic polygon, extruded and the top vertices can be animated,
     * with customer shader (not in v0.3) */
	DynaPolygon:11,
    /** used by axis */
    arrow: 12,
    SVG: 14,
    Sprite: 15,
    /** User provide mesh in Obj3.mesh */
	UserMesh: 16,
}

/** javascript operators uses 32 bits signed integers
 *
 * <a href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators'>
 * reference: javascript bitwise operators</a>
 * @enum {int}
 * @memberof XComponent */
const ShaderFlag = {
    /**mask, 16 bits for types */
    mask: 0xffff,
    /** use default texture */
    defaultex: 1 << 16,
    /** default points shader */
    testPoints: 1,
    /** */
    randomParticles: 2,
    /** */
    cubeVoxels: 3,
    /** */
    throbStar: 4,
    /** */
    flameLight: 5,
    /** Color array defined by visual.color, can be morphed by ModelSeqs.script. */
    ColorArray: 6,
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
     * AssetType.mesh (only ShaderFlag.ColorArray tested)<br>
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

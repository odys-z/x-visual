
/**Visual effects supported by x-visual,
 * texture | basic material | custom shader ...
 * @enum {int}
 * @memberof XComponent */
const AssetType = {
    /** gltf asset file */
    gltf: 0,
	/** not used? */
    materail: 1,
    /** short for material */
    mat: 1,
    /** <b>deprecated</b><br>
     * shaders provide by xglsl */
    shader: 2,
    /** <b>deprecated</b><br>
     *  customer */
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
    /** lines group, with dynamic lines' segment,
     * with end points can be tweened and updated.
     */
    DynaSects: 9,
    /** opengl / webgl wireframe */
    wireframe: 10,
    /** THREE.Curve, rendered as opengl / webgl line.
     * Geometry is created with Obj3.geom.<br>
     * So there are lines, curves and shape can use this visual type. */
    GeomCurve: 11,
    /** Daynamic polygon, extruded and the top vertices can be animated,
     * with customer shader (not in v0.3) */
	DynaPolygon:12,
    /** used by axis */
    Arrow: 13,
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
     * vtype accepting a shader include:<br>
     * AssetType.point<br>
     * AssetType.refPoint<br>
     * AssetType.cubeVoxel<br>
     * AssetType.mesh (only ShaderFlag.ColorArray tested)<br>
     * AssetType.UserMesh<br>
     * @member Visual#shader
	 * @property {string} shader - x-visual shader id
	 * @memberof XComponent */
    shader: undefined,
	/**@member Visual#asset
	 * @property {string} asset - texture path, mesh, sprite, shader, materail, ...
	 * @memberof XComponent */
    asset: undefined,
	/**@member Visual#paras
	 * @property {object} paras - see docs for detials
	 * @memberof XComponent */
    paras: undefined,
	/**Customer material if supported by x-visual is not usable.<br>
	 * vtype: UserMesh
	 * @member Visual#material
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
    used: true,
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

/**Dynamic lightweigth texture with a canvas shared & managed by {@link CanvTex}.
 * @class Dynatex
 * @memberof XComponent */
const Dynatex = {
  properties: {
	/**@member Dynatex#text
	 * @property {string} text - text (shared resource key)
	 * @memberof XComponent */
	text: '',
	/**@member Dynatex#style
	 * @property {object} style - style only used at creating object
	 * @memberof XComponent */
	style: undefined,
	/**@member Dynatex#dirty
	 * @property {bool} dirty - canvas needing been updated (text changed)
	 * @memberof XComponent */
	dirty: false,
	/**@member Dynatex#xywh
	 * @property {Object} xywh - {x, y, w = 128, h = 128}, where wh are the canvas size.
	 * @memberof XComponent */
    xywh: undefined
  }
}

export {Visual, Canvas, Dynatex, AssetType, ShaderFlag};

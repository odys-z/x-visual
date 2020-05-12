
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
    /** mesh created as THREE.Mesh(), using THREE.MeshPhongMaterial as material,
	 * usually loaded asset from gltf asset */
    mesh: 4,
    /** mesh created as THREE.Mesh(), using THREE.MeshBasicMaterial as materail*/
    mesh_basic: 5,
    /** THREE.Points.<br>
     * If Visual.assets is a gltf, load the vertices;<br>
     * if Visual.assets is undefined, generate vertices from the geometry declared
     * in Obj3.
     *
     * Note<br>
     * 1. Obj3Type.POINTS is an array of vertices buffer.<br>
     * 2. Visual.asset is different from Obj3.asset, see {@link XComponent.Visual.asset}  */
    point: 6,
    /** THREE.Points created from referencing model, with asset = entity id. */
    refPoint: 7,
    /** voxel generated for Obj3.box */
    cubeVoxel: 8,
    /** ShaderFlag has a similar name, makes this error proven */
    cubeVoxels: 9,
    /** html DOM as texture, test/example: htmltex.html */
    DomCanvas: 10,
    /** lines group, with dynamic lines' segment,
     * with end points can be tweened and updated.
     */
    DynaSects: 11,
    /** opengl / webgl wireframe */
    wireframe: 12,
    /** THREE.Curve, rendered as opengl / webgl line.
     * Geometry is created with Obj3.geom.<br>
     * So there are lines, curves and shape can use this visual type. */
    GeomCurve: 12,
    /** Daynamic polygon, extruded and the top vertices can be animated,
     * with customer shader (not in v0.3) */
	DynaPolygon:13,
    /** used by axis */
    Arrow: 14,
    /** Svg format asset */
    SVG: 15,
    /** not used */
    Sprite: 17,
    /** User provide mesh in Obj3.mesh */
	UserMesh: 18,
}

/** javascript operators uses 32 bits signed integers <pre>
    mask: 0xffff,       // 16 bits for types
    defaultex: 1 << 16, // use default texture
    testPoints: 1,      // default
    randomParticles: 2,
    cubeVoxels: 3,
    throbStar: 4,
    flameLight: 5,</pre>
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
	/**Visuals's assets, e.g gltf for generating points, or image for material
     * texture (vtype = AssetType.mesh)
	 * @member Visual#asset
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
	/**User shouldn't set this at all updatinng loops as it triggering texture
	 * reloading.
	 * @member Dynatex#dirty
	 * @property {bool} dirty - canvas needing been updated (text changed)
	 * @memberof XComponent */
	dirty: false,
	/**@member Dynatex#xywh
	 * @property {Object} xywh - {x, y, w = 128, h = 128}, where wh are the canvas size.
	 * @memberof XComponent */
    xywh: undefined,
	/**@member Dynatex#lookScreen
	 * @property {Object} lookScreen - always look at screen
	 * @memberof XComponent */
    lookScreen: true,
	/**For reference, see <a href='https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle'>
	 * MDN Canvas.style</a>
	 * @member Dynatex#style
	 * @property {object} style - style only used at creating object
	 * @memberof XComponent */
	style: undefined,
	/**For reference, see <a href='https://developer.mozilla.org/en-US/docs/Web/CSS/font'>
	 * MDN CSS Font</a>
	 * @member Dynatex#xywh
	 * @property {Object} xywh - {x, y, w = 128, h = 128}, where wh are the canvas size.
	 * @memberof XComponent */
	font: undefined
  }
}

export {Visual, Canvas, Dynatex, AssetType, ShaderFlag};

import {MixMode} from '../xutils/shaders/glx.glsl'

/**Visual effects supported by x-visual,
 * texture | basic material | custom shader ...
 * @enum {int}
 * @memberof XComponent */
const AssetType = {
	/** not used? */
    material: 1,
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
    /** mesh created as THREE.Mesh(), using THREE.MeshBasicMaterial as material*/
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
     * of which end points can be tweened and updated.
     */
    DynaSects: 11,
    /** tube generated according curve geometry.
     * Visual.paras: tubularSegments = 20, radius = 2, radialSegments = 6, closed = false,<br>
	 * the same as <a href='https://threejs.org/docs/#api/en/geometries/TubeBufferGeometry'>
	 * Three.js TubeBufferGeometry constructor</a>
     */
    PathTube: 12,
    /** opengl / webgl wireframe */
    wireframe: 13,
    /**THREE.Curve, rendered as opengl / webgl line.
     * Geometry is created with Obj3.geom.<br>
     * So there are lines, curves and shape using this visual type. */
    GeomCurve: 14,
    /** Daynamic polygon, extruded and the top vertices can be animated,
     * with customer shader (not in v0.3) */
	DynaPolygon:15,
    /** used by axis */
    Arrow: 16,
    /** gltf asset file */
    gltf: 17,
    /** Svg format asset */
    SvgPath: 18,
    /** Svg format asset */
    SvgExtrude: 19,
    /** not used */
    Sprite: 20,
    /** User provide mesh in Obj3.mesh */
	UserMesh: 21,
    /** Handled by as an extesion like {@link XComponent.Dynatex} by {@link CanvTex} */
   	vertParticle:22,

	/**A reference implementation of reflection, ported from Three.js mirror example */
	reflector3js: 23,
	/**Shader receiving light, shadow, reflection &amp; textures */
	reflectex: 24,

	/**<p>Hdr(exr) texture sky box. texture can be 6 pic array for cube texture or
	 * a 360 camera pic for Equirectangular map.</p>
	 * See <a href='https://threejsfundamentals.org/threejs/lessons/threejs-backgrounds.html'>
	 * Three.js Tutorial on this</a>.
	 * <p>paras:<br>
	 * u_tex: {array}, 6 path for cube texture, or 1 path string for Equirectangular
	 * texture. Otherwise will throw exception.
	 * */
	skyBox: 25,

    /**With component {@link XComponent.Dynatex} handled by {@link CanvTex} */
    Dynatex: 255,
    /** Handled by as a user extesion.<br>
     * Thrender will create only an empty group.<br>
     * Dynatex is a good example for use to implement / extend a component that
     * only need an empty group. */
    Extension: 255

}

const f_DEFAULTEX = 1 << 16;
const f_LIGHTENED = 1 << 17;
const f_DepthBokeh = 1 << 18;

/**<p id='shaderflag'>Shater Types.</p>
 * javascript operators uses 32 bits signed integers <pre>
 * <a href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators'>
 * reference: javascript bitwise operators</a>
 * @enum {int}
 * @memberof XComponent */
const ShaderFlag = {
    /**mask, 16 bits for types */
    mask: 0xffff,

    /**Materials of this kind of shader can accepting xlight. */
	lightened: f_LIGHTENED,

	depthBokeh: f_DepthBokeh,

    /** */
    randomParticles: 2 | f_DEFAULTEX,
    /** Shadding a cube into evenly distributed points, with texture */
    cubeVoxels: 3,
    /** */
    blinkStar: 4,
    /** */
    flameLight: 5,
    /** Color array defined by visual.color, can be morphed by ModelSeqs.script. */
    colorArray: 6 | f_LIGHTENED | f_DepthBokeh,
	/** A scaled volumetric orb, with each vertices has an "a_tan" vec3 attribute
     * representing path point's direction */
	scaleOrb: 7,

    /**A scaled volumetric orb moving alone a_pos, a vec3 array, and tweened by
     * a_t float */
    worldOrbs: 8,
    /**Groups of moving orbs */
    orbGroups: 9,
	/**Orbs centered at eacth uniform 'geoLoc' */
	tiledOrbs: 10,
    /** color line */
    colorLine: 11,
    /** polygon layers */
    texPrism: 12 | f_LIGHTENED | f_DepthBokeh,
    /** polygon layers (tiled floor) */
    boxLayers: 15 | f_LIGHTENED | f_DepthBokeh,
	/** volumetric boxes texture */
	cubeTex: 16 | f_LIGHTENED | f_DepthBokeh,
	/**Only used for AssetType.reflectex */
	reflectex: 17 | f_LIGHTENED | f_DepthBokeh,
	/**Texture &amp; environment, works for GeoPrism */
	texEnv: 18 | f_LIGHTENED | f_DepthBokeh,

	/** cube envMap, for testing */
	envCubeMap: 43 | f_LIGHTENED | f_DepthBokeh,
	/** for testing, ported from Three.js shader */
	envMap: 44 | f_LIGHTENED | f_DepthBokeh,

    // /** for testing SSAO */
	// ssao: 45,

	_finalQuad: 80,
	_filters: 81,	// TODO rename as _filterQuad

	// -------------------------------------------------------------------------
    /** default points shader */
    testPoints: 91,
	/** equirectex sampling test */
	equirectex: 92,
	/** */
	finalOutline: 93,
	/** final quad showing xEnvSpecular's LOD, only for debug */
	testXSpec: 94,
	/** final quad showing xFragColor's LOD, only for debug */
	testXFrag: 95,
	/** final quad showing xBokehDepth's LOD, only for debug */
	testXDepth: 96,

    /** for testing receiving directional shadow,
	 * see <a href='https://odys-z.github.io/x-visual/reference/shadow/survey.html#the-three-js-way'>
	 * receiving Three.js directional shadow handling</a>. */
    receiveShadow: 97,
    /**Fragment shape */
    fragShape: 98,
	/** Igonre the face, e.g. a plane for picking Dynatex area. */
	discard: 99
}

/**Shader alpha handling mode.
 * @enum {int}
 * @memberof XComponent */
const ShaderAlpha = MixMode;

/**Shader texture handling flag.
 * @enum {int}
 * @memberof XComponent */
const TexFlag = {
    BLANK: 0,
    TESSELLATE: 1,
    DEFAULT_TEX: 2,
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
     * vtype accepting a shader flag, see {@link XComponent.ShaderFlag}.
     * @member Visual#shader
	 * @property {string} shader - x-visual shader id
	 * @memberof XComponent */
    shader: undefined,
	/**
	 * @deprecated Texture path is moved to paras.u_tex.
	 *
	 * Visuals's assets, e.g gltf for generating points, or image for material
     * texture (vtype = AssetType.mesh)
	 * @member Visual#asset
	 * @property {string} asset - texture path, mesh, sprite, shader, material, ...
	 * @memberof XComponent */
    asset: undefined,
    /**@member Visual#paras
	 * @property {object} paras - see <a href='https://odys-z.github.io/x-visual/design-memo/vparas.html'>
	   docs/v-paras</a> for detials
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

// testing: pre rendered multiple target rendering
const Mrt = {
  properties: {
  }
}

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
	/**@member Canvas#dirty
	 * @property {string} dirty - must refresh / update content
	 * @memberof XComponent */
    dirty: false,
	/**@member Canvas#used
	 * @property {string} used - used / rendered as a texture (updated by system)
	 * @memberof XComponent */
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
	 * @property {bool} [dirty=true] - canvas needing been updated (text changed)
	 * @memberof XComponent */
	dirty: true,
	/**See <a href='https://odys-z.github.io/x-visual/design-memo/renderer.html#dynamic-text'>
	 * docs/Dynatex</a> for details.
	 * @member Dynatex#xywh
	 * @property {Object} xywh - {x:number, y:number, w:number, h:number, size:number}<br>
	 * where<br>
	 * x, y: text offsets.<br>
	 * w, h: canvas (also child plane mesh) width, height.<br>
	 * margin: text marging in canvase<br>
	 * size: font size.
	 * @memberof XComponent */
    xywh: undefined,
	/**@member Dynatex#lookScreen
	 * @property {Object} [lookScreen=true] - always look at screen
	 * @memberof XComponent */
    lookScreen: true,
	/**For reference, see <a href='https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle'>
	 * MDN Canvas.style</a>
	 * @member Dynatex#style
	 * @property {object} style - style only used at creating object
	 * @memberof XComponent */
	style: undefined,
	/**For reference, see <a href='https://developer.mozilla.org/en-US/docs/Web/CSS/font'>
	 * MDN CSS Font</a>.<br>
	 * defualt: 'Arial'
	 * @member Dynatex#font
	 * @property {Object} font - {x, y, w = 128, h = 128}, where wh are the canvas size.
	 * @memberof XComponent */
	font: undefined,

	/**@member Dynatex#bg-color
	 * @property {string} [bg-color='blue'] - text back ground color, defualt 'blue'
	 * @memberof XComponent */
    'bg-color': undefined,

    /**@member Dynatex#v-align
	 * @property {string} [v-align='top'] - vertical align, only top||middle|bottom|number(parent y)
     */
    'v-align': undefined,

	/**@member Dynatex#hue
	 * @property {array} [hue=[0, 0, 0]] - default difuse color, 0 ~ 1
	 * @memberof XComponent */
    hue: [0, 0, 0],

	/**@member Dynatex#texWeight
	 * @property {number} [texWeight=1] - default text color weigth, 0 ~ 1
	 * @memberof XComponent */
    texWeight: 1,

	/**
	 * @member Dynatex#u_tex
	 * @property {array} u_tex - for text background, etc. Same as {@link XComponent.Visual}.paras.u_tex
	 * @memberof XComponent */
	u_tex: undefined,

	/**Child transform. Typical use of this is to rotate the child text vertical to horizon.<br>
	 * This transform will only affect the text plane.
	 * @member Dynatex#transform
	 * @property {array} transform - child transform.
	 * @memberof XComponent */
	transform: undefined,

    /**Don't touch this, it's managed by system.
	 * @member Dynatex#textplane
	 * @property {THREE.Mesh} textplane - plane mesh of text canvas
	 * @memberof XComponent */
    textplane: undefined
  }
}

export {Visual, Mrt, Canvas, Dynatex, AssetType, ShaderFlag, ShaderAlpha, TexFlag};

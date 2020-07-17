
import * as THREE from 'three'
import {x} from '../xapp/xworld'
import {ShaderFlag, ShaderAlpha} from '../component/visual'
import * as xutils from './xcommon'
import AssetKeepr from './assetkeepr'

import {randomParticl} from './shaders/random-particl.glsl'
import {cubeVoxels, cubeVoxelGeom} from './shaders/cube-voxels.glsl'
import {colorLine} from './shaders/color-line.glsl'
import {phongMorph2} from './shaders/color-array.glsl'
import {scaleOrb} from './shaders/orb-scale.glsl'
import {orbGroups} from './shaders/orb-groups.glsl'
import {worldOrbs} from './shaders/orb-world.glsl'
import {thermalTile} from './shaders/tile-thermal.glsl'
import {shapeLayers} from './shaders/shape-layers.glsl'

import {blinkStar, pointGeom} from './shaders/blink-star.glsl'
import {fragShape} from './shaders/frag-shape.glsl'

/**
 * Stub for jsdoc, a collection of common methods
 * <br>This class name is all in lower case. X-visual use this convention for a
 * collection of common global methods when using jsdoc generating API doc.
 * @class
 */
function xglsl() { }

const shaderPool = {}

/**
 * @param {int} flag @see ShaderFlag
 * @param {Visual.paras} vparas @see Visual
 * @return {object} {vertexShader, fragmentShader}<br>
 * The shaders for THREE.ShaderMaterial (using variables supported by Three.js)<br>
 * where<br>
 * return.vertextShader {string}<br>
 * return.vertextShader {string}
 * @member xglsl.randomRarticl
 * @function */
export function xvShader(flag, vparas = {}) {
    // TODO share shader progam
    var s;
    switch (flag & ShaderFlag.mask) {
        case ShaderFlag.randomParticles:
            s = randomParticl(vparas);
            break;
        case ShaderFlag.cubeVoxels:
            s = cubeVoxels(vparas);
            break;
        case ShaderFlag.flameLight:
            s = flameLight(vparas);
            break;
        case ShaderFlag.blinkStar:
            s = blinkStar(vparas);
            break;
        case ShaderFlag.colorArray:
            s = phongMorph2(vparas);
            break;
        case ShaderFlag.scaleOrb:
            // this shader needs vertex has a dir attribute
            s = scaleOrb(vparas);
            break;
        case ShaderFlag.worldOrbs:
            s = worldOrbs(vparas);
            break;
        case ShaderFlag.orbGroups:
            s = orbGroups(vparas);
            break;
        case ShaderFlag.tiledOrbs:
            // s = tileOrbs(vparas);
            s = thermalTile(vparas);
            break;
        case ShaderFlag.colorLine:
            s = colorLine(vparas);
            break;
        case ShaderFlag.shapeLayers:
            s = shapeLayers(vparas);
            break;
        case ShaderFlag.fragShape:
            throw new XError('todo');
            break;
        case ShaderFlag.discard:
            s = discardShader(vparas);
            break;
        case ShaderFlag.testPoints:
        default:
            // console.warn('xvShader(): unrecognized shader flag: ', flag);
            s = testPnt( vparas || new Object() );// as enum doesn't exists, paras also likely undefined
    }
    if (x.log >= 5)
        console.debug(`[5] flag: ${flag.toString(16)}, paras: `,
            vparas, '\nshaders: ', s);
    return s;
}

/**Is the shader support u_alpha?
 * Shaders include AssetType.point, refPoint, GeomCurve, colorArray
 * @param {ShaderFlag} shader
 * @return {bool}
 * @member xglsl.hasUAlpha
 * @function
 */
export function hasUAlpha(shader) {
	return  shader === ShaderFlag.randomParticles ||
			shader === ShaderFlag.cubeVoxels ||
			shader === ShaderFlag.colorArray ||
			shader === ShaderFlag.colorLine;
}

/**
 * Merge Visual.paras.uniforms, load texture according to Visual.paras.u_tex.
 * @param {Visual} visual Entities Visual component
 * @param {Obj3} obj3 not used?
 * @return {object} uniforms for THREE.Mesh - properties are in format of name: {value}
 * @member xglsl.formatUniforms
 * @function
 */
export function formatUniforms(visual, obj3) {
    var uniforms = new Object();// make sure uniforms are not shared between materials
    // common section
    if (visual.paras && visual.paras.u_tex) {
        if (visual.paras.uniforms && typeof visual.paras.uniforms.u_tex === 'string') {
            console.warn ( "formatUniforms(): ignoring wrong paras: Visual.paras.uniforms.u_tex = ",
                            visual.paras.uniforms.u_tex );
            delete visual.paras.uniforms.u_tex;
        }
        // uniforms.u_tex = { value: new THREE.TextureLoader().load(`assets/${visual.paras.u_tex}`) };
        uniforms.u_tex = { value: AssetKeepr.loadTexure(visual.paras.u_tex) };
    }
    else if (visual.paras && visual.paras.uniforms
        && typeof visual.paras.uniforms.u_tex === 'string') {
        uniforms.u_tex = { value: AssetKeepr.loadTexure(visual.paras.uniforms.u_tex) };
        delete visual.paras.uniforms.u_tex;
    }
    else if ((visual.shader & ShaderFlag.defaultex) === ShaderFlag.defaultex) {
        uniforms.u_tex = { value: AssetKeepr.cheapixelTex() };
    }

    uniforms.side = {value: !visual.paras || visual.paras.side === undefined
                            ? THREE.FrontSide : visual.paras.side};
    uniforms.u_alpha = {value: visual.paras !== undefined && visual.paras.tex_alpha !== undefined
                            ? visual.paras.tex_alpha : 1};

    // setup a default texture, a grey pixel to avoid this error:
    // ERROR :GL_INVALID_OPERATION : glDrawElements: Source and destination textures of the draw are the same.
    // Cause: It is not sufficient to bind the texture to a texture unit,
    // the index of the texture unit has to be set to the texture sampler uniform, too.
    // comments on https://stackoverflow.com/questions/50777793/gldrawelements-source-and-destination-textures-of-the-draw-are-the-same
    if (!uniforms.u_tex &&
        (  visual.shader === ShaderFlag.worldOrbs
        || visual.shader === ShaderFlag.scaleOrb
        || visual.shader === ShaderFlag.orbGroups
        || visual.shader === ShaderFlag.tiledOrbs) ) {
        if (visual.asset)
            uniforms.u_tex = { value: AssetKeepr.loadTexure(visual.asset) };
        else
            uniforms.u_tex = { value: AssetKeepr.cheapixelTex() };
    }

    // switch of shader types
    if (visual.paras && visual.paras.uniforms)
        Object.assign(uniforms, obj2uniforms(visual.paras.uniforms));

    if (visual.shader === ShaderFlag.colorArray && visual.paras.colors) {
        // TODO should we use uniform array ?
        for (var i = 0; i < visual.paras.colors.length; i++)
            uniforms[`u_color${i}`] = {value: new THREE.Vector3(...visual.paras.colors[i])};
    }
    else if (visual.shader === ShaderFlag.scaleOrb) {
        uniforms.wpos = {value: visual.paras.wpos ?
                        new THREE.Vector3(...p) : new THREE.Vector3(0, 0, 0)};
        uniforms.r = {value: visual.paras.orbR === undefined
                             ? 20 : visual.paras.orbR};
        uniforms.whiteAlpha = {value: visual.paras.whiteAlpha === undefined
                    ? 0 : visual.paras.whiteAlpha};
        var os = visual.paras.orbScale;
        uniforms.orbScale = {value: os === undefined
                    ? new THREE.Vector3(1, 0.2, 0.2)
                    : new THREE.Vector3(os[0], os[1], os[2])};
    }
    else if (visual.shader === ShaderFlag.orbGroups) {
        // orbs in a group (always have 1 orb)
        var offsets = visual.paras.offsets || [0];
        var orbs = visual.paras.offsets ? visual.paras.offsets.length : 1;
        var rs = [];
        for (var r of visual.paras.orbR || [10]) {
            rs.push(r);
        }
        var orbColors = [];
        for (var c of visual.paras.colors) {
            orbColors.push(new THREE.Vector3(...c));
        }
        uniforms.orbs = { value: orbs };
        uniforms.offsets = { value: offsets };
        uniforms.orbColors = { value: orbColors };
        uniforms.r = { value: rs };

        // groups
        if ( ! Array.isArray(visual.paras.follows)
            || visual.paras.follows.length <= 0) {
            console.error(visual);
            throw new XError('Paras.follows for orbGroups\'s groups are not correct!');
        }

        uniforms.u_t = { value: 0 };
        uniforms.tmin = { value: visual.paras.t_range ? visual.paras.t_range[0] : 0 };
        uniforms.tmax = { value: visual.paras.t_range ? visual.paras.t_range[1] : 1 };

        var wpos = [];
        var wtan = [];
        var flws = [];
        for (var follow of visual.paras.follows) {
            wpos.push(new THREE.Vector3(0));
            wtan.push(new THREE.Vector3(1, 0, 0));
            flws.push(follow);
        }
        uniforms.wpos = { value: wpos };
        uniforms.wtan = { value: wtan };
        uniforms.follows = { value: flws };

        uniforms.whiteAlpha = { value: visual.paras.whiteAlpha === undefined
                    ? 0 : visual.paras.whiteAlpha };
        var os = visual.paras.orbScale;
        uniforms.orbScale = { value: os === undefined
                    ? new THREE.Vector3(1, 0.2, 0.2)
                    : new THREE.Vector3(os[0], os[1], os[2]) };
    }
    else if (visual.shader === ShaderFlag.worldOrbs
            || visual.shader === ShaderFlag.tiledOrbs) {
        var poses = [];
        var orbs = 0;
        if (visual.paras.offsets === undefined)
            visual.paras.offsets = [[0, 0, 0]];
        for (var p of visual.paras.offsets) {
            poses.push(new THREE.Vector3(...p));
            orbs++;
        }
        var rs = [];
        var orbRs = typeof visual.paras.orbR === 'number'
                    ? [visual.paras.orbR] : visual.paras.orbR || [10];
        for (var r of orbRs) {
            rs.push(r);
        }
        var orbColors = [];
        for (var c of visual.paras.colors) {
            orbColors.push(new THREE.Vector3(...c));
        }
        var wpos = visual.paras.wpos
            ? new THREE.Vector3(...visual.paras.wpos) : new THREE.Vector3(0, 0, 0);

        uniforms.orbs = { value: orbs };
        uniforms.wpos = { value: wpos };
        uniforms.offsets = { value: poses };
        uniforms.orbColors = { value: orbColors };
        uniforms.r = { value: rs };
        uniforms.whiteAlpha = { value: visual.paras.whiteAlpha === undefined
                    ? 0 : visual.paras.whiteAlpha };
        var os = visual.paras.orbScale;
        uniforms.orbScale = { value: os === undefined
                    ? new THREE.Vector3(1, 0.2, 0.2)
                    : new THREE.Vector3(os[0], os[1], os[2]) };
        if (visual.shader === ShaderFlag.tiledOrbs) {
            uniforms.now = { value: 0 };
            var groups = visual.paras.geostyle.groups || 1;
            uniforms.speedVert = { value: new Array(groups).fill(0.01) };
            uniforms.speedFrag = { value: new Array(groups).fill(0.01) };

			var colrs = new Array();
			var pcolrs = visual.paras.thermalColors || [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
			for (var c of pcolrs)
				colrs.push(new THREE.Vector3(...c));
			uniforms.thermalColors = { value: colrs };
			uniforms.maxHeight = { value: visual.paras.geostyle.maxHeight
						|| visual.paras.geostyle.height || 1 };
        }
    }
    // TODO and more... see Thrender case PathTube

    return uniforms;
}

/**
 * Convert object into THREE.Mesh.uniforms format (properties are {value} object).<br>
 * x-visual v.s. Three.js material variable name mapping:<pre>
    three.js -&gt; x-visual shader
    opacity - u_alpha
 </pre>
 * @param {object} properties
 * @param {THREE.Uniforms} uniforms
 * @return {object} uniforms for THREE.Mesh - properties are in format of name: {value}
 * @member xglsl.obj2uniforms
 * @function
 */
export function obj2uniforms(properties, uniforms) {
    var u = new Object();
    for (var p in properties) {
        if (p === 'opacity')
            u.u_alpha = {value: properties[p]};
        else
            u[p] = {value: properties[p]};
    }
    return Object.assign(uniforms || new Object(), u);
}

/**
 * Convert script value to THREE.Uniforms format (properties are {value} object).
 * <br>If properties of svals is an array, only it's first value are used as the
 * uniforms value - required by Tween.
 * @param {object} svals script values
 * @param {Obj3} uniforms buffer
 * @return {object} {start: svals_i[0], to: value: svals_i[1]}<br>
 * uniforms for THREE.Mesh - properties are in format of name: {value}
 * @member xglsl.script2uniforms
 * @function
 */
export function script2uniforms(svals, uniforms) {
    var u = new Object();
    var v = new Object();
    for (var p in svals) {
        if (Array.isArray(svals[p])) {
            u[p] = {value: svals[p][0]};
            v[p] = {value: svals[p][1]};
        }
        else if (typeof svals[p] === 'number') {
            u[p] = {value: svals[p]};
            v[p] = {value: svals[p]};
        }
        else throw XError(`xglsl.script2uniforms(): can't convert vals to uniforms: svals[${p}]: ${svlas[p]}`);
    }
    uniforms = Object.assign(uniforms || new Object(), u);
    return {start: uniforms, to: v};
}

/**@deprecated this function can be completely covered by cubeVoxelGeom().
 * Create geometry buffer from target mesh.
 * If shader type is randomParticles, the buffer also has attributes color and size.
 * @param {Visual.paras} vparas
 * @param {TREE.Mesh} meshSrc
 * @param {TREE.Mesh} meshTarget
 * @return {THREE.BufferGeometry}
 * @member xglsl.particlesGeom
 * @function
 */
export function particlesGeom (vparas, meshSrc, meshTarget) {
    var sizes = [];
    var colors = [];
    var noise = [];
    // var count = meshSrc.count / meshSrc.itemSize;    // count = length / 3
    var count = meshSrc.count;
    for (var c = 0; c < count; c++) {
        var color = xutils.randomRGB();
        colors.push( color.r, color.g, color.b );
        sizes.push( (Math.random() * 2 - 1 ) );

        if (vparas && vparas.a_noise)
            noise.push( (Math.random() * vparas.noise - vparas.noise / 2 ) );
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', meshSrc.clone(), 3 );

    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 )
            .setUsage( THREE.DynamicDrawUsage ) );
    geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 )
            .setUsage( THREE.DynamicDrawUsage ) );

    if (vparas && vparas.a_noise)
        geometry.setAttribute( 'a_noise', new THREE.Float32BufferAttribute( noise, 1 )
            .setUsage( THREE.DynamicDrawUsage ) );

    // TODO case: meshsrc.count != meshTarget.count
    if (vparas && (vparas.dest || vparas.a_dest)) {
        geometry.setAttribute( 'a_dest', meshTarget.clone(), 3 );
    }
    return geometry;
}

function discardShader(paras = {}) {
  return {
    vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); } `,
    fragmentShader: `void main() { discard; }`
  };
}

/** get shader of gl_point for debugging
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testPnt
 * @function
 */
function testPnt(paras = {}) {
 return { vertexShader: `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = 3.0 * ${paras.vert_scale || '1.0'}; }`,
 fragmentShader: `
  void main() {
    gl_FragColor = vec4( 1., 1., 0., 1. ); }`
 };
}

/**Example:
 * See docs/design memoe/shader samples
 *
 * @param {object} vparas visual paras, same as Visual.paras
 * @member xglsl.flameLight
 * @function
 */
function flameLight(vparas) {
    throw XError("TODO");
}

export {cubeVoxelGeom, pointGeom}

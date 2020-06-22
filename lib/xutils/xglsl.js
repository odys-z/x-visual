
import * as THREE from 'three'
import {x} from '../xapp/xworld'
import {ShaderFlag, ShaderAlpha} from '../component/visual'
import * as xutils from './xcommon'
import AssetKeepr from './assetkeepr'

/**
 * Stub for jsdoc, a collection of common methods
 * <b>NOTE: no 'xglsl.' prefix when calling functions.</b>
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
        case ShaderFlag.throbStar:
            s = throbStar(vparas);
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
        case ShaderFlag.frageShape:
            throw new XError('todo');
            break;
        case ShaderFlag.discard:
            s = discardShader(vparas);
            break;
        case ShaderFlag.testPoints:
        default:
            // console.warn('xvShader(): unrecognized shader flag: ', flag);
            s = testPnt(vparas || {});// as enum doesn't exists, paras also likely undefined
    }
    if (x.log >= 5)
        console.debug(`[5] flag: ${flag.toString(16)}, paras: `,
            vparas, '\nshaders: ', s);
    return s;
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
        // console.warn ( "formatUniforms(): takeing Visual.paras.uniforms.u_tex as uniform for shader.",
        //                "The correct paras for u_tex is Visual.paras.u_tex.",
        //                 visual.paras.uniforms.u_tex );

        // uniforms.u_tex = { value: new THREE.TextureLoader().load(`assets/${visual.paras.uniforms.u_tex}`) };
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
        || visual.shader === ShaderFlag.worldOrbs
        || visual.shader === ShaderFlag.orbGroups) ) {
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
        var flws = [];
        for (var follow of visual.paras.follows) {
            wpos.push(new THREE.Vector3(0));
            flws.push(follow);
        }
        uniforms.wpos = { value: wpos };
        uniforms.follows = { value: flws };

        uniforms.whiteAlpha = { value: visual.paras.whiteAlpha === undefined
                    ? 0 : visual.paras.whiteAlpha };
        var os = visual.paras.orbScale;
        uniforms.orbScale = { value: os === undefined
                    ? new THREE.Vector3(1, 0.2, 0.2)
                    : new THREE.Vector3(os[0], os[1], os[2]) };
    }
    else if (visual.shader === ShaderFlag.worldOrbs) {
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
    var u = {};
    for (var p in properties) {
        if (p === 'opacity')
            u.u_alpha = {value: properties[p]};
        else
            u[p] = {value: properties[p]};
    }
    return Object.assign(uniforms || {}, u);
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
    var u = {};
    var v = {};
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
    uniforms = Object.assign(uniforms || {}, u);
    return {start: uniforms, to: v};
}

/**Get shader for ShaderFlag.randomParticles.
 * If u_morph is animated, must providing uniform vec3 &amp a_target.
 * Used variables: position, color, size.
 * gl_position = mix(pos, taget, morph) + noise * dist;
 * @param {object} paras
 * paras.u_dist {float} in world
 * paras.u_morph {float}
 * paras.a_dest {vec3} in world
 * paras.a_noise {float}
 * paras.size_scale {float}
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.randomRarticl
 * @function */
function randomParticl(paras) {
 return { vertexShader: `
  uniform float u_alpha;
  uniform float u_dist;
  uniform float u_morph;

  attribute vec3 color;
  attribute float size;
  ${paras.a_dest ? 'attribute vec3 a_dest;' : ''}
  ${paras.a_noise ? 'attribute float a_noise;' : ''}

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vAlpha = u_alpha;
    ${!paras.a_dest && !paras.a_noise ? 'vec3 pos = position * (1.0 + u_morph);' : ''}
    ${ paras.a_dest && !paras.a_noise ? 'vec3 pos = mix(position, a_dest, u_morph) + u_dist * 5.0;' : ''}
    ${!paras.a_dest && paras.a_noise ? 'vec3 pos = position + u_dist * 100 * a_noise;' : ''}
    ${ paras.a_dest && paras.a_noise ? 'vec3 pos = mix(position, a_dest, u_morph) + u_dist * 5.0 * a_noise;' : ''}
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

    // gl_PointSize = u_morph * ( 300.0 / -mvPosition.z );
    gl_PointSize = size * ${paras.vert_scale || '10.0'};
    gl_Position = projectionMatrix * mvPosition;
  } `,
 fragmentShader: `
  uniform sampler2D u_tex;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4( vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( u_tex, gl_PointCoord );
    gl_FragColor.a *= vAlpha;
  } `
 };
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

/**Create vertex & fragment shaders that can morphing between multiple positions.
 * @deprecated
 * @param {object} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.cubeVoxels9
 * @function
 */
function cubeVoxels9(paras) {
 return { vertexShader: `
  uniform float u_alpha;
  uniform vec3 u_sects;
  uniform vec3 u_box0;
  uniform vec3 u_box1; uniform float u_morph1; uniform mat4 u_trans1;
  ${paras.a_dest2 ? 'uniform vec3 u_box2; uniform float u_morph2; uniform mat4 u_trans2' : ''}

  attribute vec3 color;
  attribute float size;
  ${paras.a_noise ? 'attribute float a_noise;' : ''}
  // attribute vec3 ix;    // use position as index

  varying vec3 vColor;
  varying float vAlpha;

  vec4 ix2world(vec3 sects, vec3 box) {
    return modelViewMatrix * vec4(box * sects / u_sects, 1.0);
  }

  void main() {
    vColor = color;
    vAlpha = u_alpha;
    vec4 pos0 = ix2world(position, u_box0);
    vec4 pos1 = ix2world(position, u_box1);
    pos0 = mix(modelViewMatrix * pos0, u_trans1 * pos1, u_morph1);
    // ${paras.a_noise && !paras.vert_scale ? 'pos0.xyz += a_noise * color' : ''}
    // ${paras.a_noise &&  paras.vert_scale ? 'pos0.xyz += a_noise * color * ' + paras.vert_scale : ''}

    ${paras.a_dest2 ? 'pos1 = ix2world(position, a_box2);' : ''}
    ${paras.a_dest2 ? 'pos0 = mix(pos0, u_trans2 * pos1, u_morph2);' : ''}

    ${paras.a_noise && !paras.vert_scale ? 'pos0.xyz += a_noise * color' : ''}
    ${paras.a_noise &&  paras.vert_scale ? 'pos0.xyz += a_noise * color * ' + paras.vert_scale : ''}

    //vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_PointSize = size * ${paras.vert_scale || '10.0'};
    gl_Position = projectionMatrix * pos0; //mvPosition;
    // gl_Position = projectionMatrix * vec4(0., 0., 0., 1.);

    gl_PointSize = 100000.0;
  }
  `,

 fragmentShader: `
  uniform sampler2D u_tex;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4( vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( u_tex, gl_PointCoord );
    gl_FragColor.a *= vAlpha;
  } `
 };
}

/**Create vertex &amp; fragment shaders that can morphing between multiple box positions.
 * @param {object} paras
 * paras.uniforms.u_cubes array of boxes
 * param.uniforms.u_box1, 2, ... vec3 for position index (voxel index, not position)
 * param.uniforms.u_morph, morph animation, 0 - 1
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.cubeVoxels
 * @function
 */
function cubeVoxels(paras) {
    var boxi = ''; // 'uniform vec3 u_box0; uniform float u_morph0;';
    var pos = '';
    for (var i = 0; i < paras.uniforms.u_cubes.length; i++) {
        boxi += `\nuniform vec3 u_box${i}; uniform float u_morph${i};`;
        if (i > 0)
        pos += `pos = mix(pos, ix2model(u_sects, u_box${i}), u_morph${i-1});\n    `
             + `p_ = mix(p_, next2model(u_sects, u_box${i}), u_morph${i-1});\n    `;
    }
    pos += `pos = mix(pos, ix2model(u_sects, u_box0), u_morph${i-1});\n    `;
         + `p_ = mix(p_, next2model(u_sects, u_box0), u_morph${i-1});\n    `;

 return { vertexShader: `
  uniform float u_alpha;
  uniform vec3 u_sects;
  //uniform vec3 u_box0; uniform float u_morph0;
  ${boxi}

  attribute vec3 color;

  varying vec3 vColor;
  varying float vAlpha;

  vec4 ix2model(vec3 sects, vec3 box) {
    return vec4((position - sects / 2.) * box / sects, 1.);
  }

  vec3 next2model(vec3 sects, vec3 box) {
    return (position + 1. - sects/ 2.) * box / sects;
  }

  void main() {
    vColor = color;
    vAlpha = u_alpha;

    vec4 pos = ix2model(u_sects, u_box0);
    vec3 p_ = next2model(u_sects, u_box0);    // also morph next grid
    vec3 d0 = p_ - pos.xyz;                    // model 0 section length
    // pos = mix(pos, ix2model(u_sects, u_box1), u_morph1);
    ${pos}

    gl_Position = projectionMatrix * modelViewMatrix * pos;
    vec4 p1 = projectionMatrix * modelViewMatrix * vec4(p_, 1.);

    gl_PointSize = 3.0 * ${paras.vert_scale !== undefined ? paras.vert_scale : '10.0'};
    // scale point size as the same to section scale
    vec3 d1 = p1.xyz - pos.xyz;
    gl_PointSize *= length(d0) / length(d1);
  }
  `,

 fragmentShader:
 // `void main() { gl_FragColor = vec4(1.0); } `
 `uniform sampler2D u_tex;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4( vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( u_tex, gl_PointCoord );
    gl_FragColor.a *= vAlpha;
  } `
 }
};

/**Get geometry buffer for cube voxels, with attributes that the shader can work,
 * each vertex has a random color, noise and size.<br>
 * The uniform names are color, size (default by Three.js) and a_noise.
 * @param {object} vparas
 * u_sects: [w, h, d] segements in 3D
 * @return {THREE.BufferGeometry} the geometry buffer.
 * @member xglsl.cubeVoxels
 * @function
 */
export function cubeVoxelGeom(vparas) {
    var whd = vparas.u_sects;
    var ixyz = []; // position, a.k.a vertex index
    var colors = [];
    var sizes = [];
    var noise = [];
    var count = (whd[0] + 1) * (whd[1] + 1) * (whd[2] + 1);
    for (var iw = 0; iw <= whd[0]; iw++)
        for (var ih = 0; ih <= whd[1]; ih++)
            for (var id = 0; id <= whd[2]; id++) {
                ixyz.push(iw, ih, id);
                var color = xutils.randomRGB();
                colors.push( color.r, color.g, color.b );
                sizes.push( (Math.random() * 2 - 1 ) );

                if (vparas.a_noise)
                    noise.push( (Math.random() * vparas.noise - vparas.noise / 2 ) );
            }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(ixyz, 3) );

    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 )
            .setUsage( THREE.DynamicDrawUsage ) );
    geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 )
            .setUsage( THREE.DynamicDrawUsage ) );

    if (vparas.a_noise)
        geometry.setAttribute( 'a_noise', new THREE.Float32BufferAttribute( noise, 1 )
                .setUsage( THREE.DynamicDrawUsage ) );

    return geometry;
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

/**Example:
 * See docs/design memoe/shader samples
 *
 * @param {object} paras
 * paras.vert_scale: point scale
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.flameLight
 * @function
 */
function throbStar(paras = {}) {
 return { vertexShader: `
  uniform vec2 fragSize;
  varying vec2 size;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = 3.0 * ${paras.vert_scale || '10.'};

    if (fragSize.x == 0. && fragSize.y == 0.)
      size = vec2(gl_PointSize);
 }`,
 fragmentShader: `
  uniform float iTime;

  varying vec2 size;

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
    vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
    a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
    a.xy = mix(a.xz, a.yw, f.y);
    return mix(a.x, a.y, f.z);
  }

  float sphere(vec3 p, vec4 spr) {
    return length(spr.xyz-p) - spr.w;
  }

  float flame(vec3 p) {
    float d = sphere(p, vec4(-0.460, -1.0, 0.0, 1.));
    return d + (noise(p + vec3(.0, 0. * 2., .0)) + noise(p * 3.) * .5) * .25 * (p.y);
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord, in vec2 size ) {
    // can we use z for p?
    vec4 p = 1.5 - vec4(flame(vec3(abs(fragCoord - vec2(0.5)), 0.)));
    // vec4 p = 1.5 - vec4(flame(vec3(abs(fragCoord - size * 0.5), 0.) / 500.0));

    float glow = p.w;
    vec4 col = mix(vec4(1., .5, .1, 1.), vec4(0.1, .5, 1., 1.), p.y * .02 + .4);
    fragColor = mix(vec4(0.), col, pow(glow * 0.75, 10.));
  }

  void main() {
    // mainImage(gl_FragColor, gl_FragCoord.xy, size);
    mainImage(gl_FragColor, gl_PointCoord, size);

    // gl_FragColor.r = 0.5;
    // gl_FragColor.a = max(gl_FragColor.a, 0.5);
    // gl_FragColor = vec4(1.0);
  }` };
}

/**
 * Get points geometry buffer for simulating flowing path.
 * @param {THREE.Vector3} point
 * @return {THREE.Geometry} point geometry
 * @member xglsl.pointGeom
 * @function
 */
export function pointGeom(point) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        point
        // new THREE.Vector3( -10,  10, 0 )
        // new THREE.Vector3( -10, -10, 0 ),
        // new THREE.Vector3(  10, -10, 0 )
    );
    // geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
    geometry.computeBoundingSphere();
    return geometry;
}

/**
 * Get shaders for creating color-morphable materail (THREE.Material).
 *
 * <b>Note:</b><br>
 * As this shader doesn't provide face color difference, it is replaced by
 * {@link phongColorMorph}.
 * @param {object} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.meshColors
 * @function
 */
function meshColors(vparas) {
    var colori = ''; // 'uniform vec4 u_color0; uniform float u_morph0;';
    var morph = 'vec3 morph = u_color0;';
    for (var i = 0; i < vparas.colors.length; i++) {
        colori += `\nuniform vec3 u_color${i}; uniform float u_morph${i};`;
        if (i > 0)
            morph += `\nmorph = mix(morph, u_color${i}, u_morph${i - 1});`;
    }
    if (i > 0)
        morph += `\nmorph = mix(morph, u_color0, u_morph${i - 1});`;

    // debug notes - mixColor()
    //
    // working: return vec4(0.4, 0.5, 0.0, 0.7);
    // working: return vec4(mix(u_color0, u_color1, 0.1), 1);
    // working: return vec4(mix(u_color0, u_color1, u_morph0), 1);
    /* working:
    morph = mix(u_color0, u_color1, u_morph0);
    morph = mix(morph, u_color2, u_morph1);
    return vec4(morph, 1.0);
    */
    return { vertexShader:
 `uniform float u_alpha;
  //uniform vec3 u_color0; uniform float u_morph0;
  ${colori}

  varying vec4 vColor;
  varying float vAlpha;

  vec4 mixColor() {
    ${morph}
    return vec4(morph, u_alpha);
  }

  void main() {
    vColor = mixColor();
    vAlpha = u_alpha;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
  }
 `,

        fragmentShader:
 // `void main() { gl_FragColor = vec4(1.0); } `
 `uniform sampler2D u_tex;
  varying vec4 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vColor;
    // gl_FragColor = gl_FragColor * texture2D( u_tex, gl_FragCoord );
    // gl_FragColor.a *= vAlpha;
  } `
 }
}

/**
 * Get shaders for creating color-morphable materail (THREE.Material).
 *
 * @param {object} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.phongColorMorph
 * @function
 */
function phongColorMorph(vparas) {
    var colori = ''; // 'uniform vec4 u_color0; uniform float u_morph0;';
    var morph = 'vec3 morph = u_color0;';
    for (var i = 0; i < vparas.colors.length; i++) {
        colori += `\nuniform vec3 u_color${i}; uniform float u_morph${i};`;
        if (i > 0)
            morph += `\nmorph = mix(morph, u_color${i}, u_morph${i - 1});`;
    }
    if (i > 0)
        morph += `\nmorph = mix(morph, u_color0, u_morph${i - 1});`;

    // attribute vec3 position;
    // attribute vec3 normal;
    // uniform mat4 projection, modelview, normalMat;
    // uniform int mode;   // Rendering mode
    // uniform float Ka;   // Ambient reflection coefficient, e.g. 1.0,
    // uniform float Kd;   // Diffuse reflection coefficient, e.g. 0.4,
    // uniform float Ks;   // Specular reflection coefficient, e.g. 1.0,
    // Material color
    // uniform vec3 diffuseColor;
    var ka = '1.0';
    var kd = '1.0';
    var ks = '1.0';

    return { vertexShader:
  `    uniform float shininessVal; // Shininess, e.g. 80
    uniform vec3 ambientColor;
    uniform vec3 specularColor;
    uniform vec3 u_lightPos; // Light position
    uniform float u_alpha;

    ${colori}

    varying vec3 normalInterp;
    varying vec3 vertPos;
    varying vec4 vColor; //color
    varying float vAlpha;

    vec3 morphColors() {
        ${morph}
        return morph;
    }

    void main(){
        vAlpha = u_alpha;
        float Ka = ${ka};
        float Kd = ${kd};
        float Ks = ${ks};

        vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
        vertPos = vec3(vertPos4) / vertPos4.w;
        // normalInterp = vec3(modelMatrix  * vec4(normal, 0.0));
        // normalInterp = vec3(normalMatrix * vec4(normal, 0.0)); // original
           normalInterp = normalMatrix * normal; // three.js normalMatrix is 3 x 3
        gl_Position = projectionMatrix * vertPos4;

        vec3 N = normalize(normalInterp);
        vec3 L = normalize(u_lightPos - vertPos);

        // Lambert's cosine law
        float lambertian = max(dot(N, L), 0.0);
        float specular = 0.0;
        if(lambertian > 0.0) {
            vec3 R = reflect(-L, N);      // Reflected light vector
            vec3 V = normalize(-vertPos); // Vector to viewer
            // Compute the specular term
            float specAngle = max(dot(R, V), 0.0);
            specular = pow(specAngle, shininessVal);

            // debug
            // L = V;
            specular = pow(specAngle, 1.0);
        }

        vec3 diffuseColor = morphColors();

        vColor = vec4(Ka * ambientColor +
                    Kd * lambertian * diffuseColor +
                    Ks * specular * specularColor, u_alpha); // u_alpha = vparas.uniforms.u_alpha
        // working: vColor = vec4(L * Ka, 1.0);
        // working with normalMatrix: vColor = vec4(Kd * lambertian);
        // working with normalMatrix: vColor = vec4(Ks * specular, 0.1, 0.2, 1.0);
    }
  `,
    fragmentShader:
  `
    uniform sampler2D u_tex;
    varying vec4 vColor;
    varying float vAlpha;

    void main() {
        gl_FragColor = vColor;
        // gl_FragColor = gl_FragColor * texture2D( u_tex, gl_FragCoord );
        // gl_FragColor.a *= vAlpha;
    }
  `};
}

/**Get a shader that can be morphed with colors and textures.<br>
 * Test page: test/html/morph-color.html<br>
 * ShaderFlag: colorArray<br>
 * See test page for different mixing mode results.
 * @param {object} vparas <pre>{
   texMix: vparas.texMix - ShaderAlpha, multiply | additive | mix, see {@link XComponent.ShaderAlpha}
   uniforms: {
     ambientColor: vec3
     specularColor: vec3
     u_lightPos: vec3 - light direction
     u_alpha: float - object color alpha
   } }</pre>
*/
function phongMorph2(vparas) {
    // array uniform example:
    // https://stackoverflow.com/questions/60154858/rotate-a-texture-map-on-only-one-face-of-a-cube/60158820#60158820
    var tex = vparas.u_tex;
    var colr = vparas.colors;

    if (!colr || tex && !Array.isArray(tex)
        || !Array.isArray(colr)
        || tex && colr.length != tex.length
        || colr.length <= 0) {
        console.error('paras: ', vparas);
        throw new xutils.XError(`paras.u_tex and paras.colors not matching (required at least one color or texture): ${vparas}`);
    }

    var len = colr.length;
    // u_tex can be eighter empty or same length with colors
    var fragUnis = tex ? `uniform sampler2D u_tex[${len}];` : '';
    var vertUnis = `uniform vec3 u_color[${len}];`;
    var bothUnis = '';
    var morphvert = '';

    for (var i = 0; i < len; i++) {
        bothUnis += `\nuniform float u_morph${i};`;
        if (i > 0)
            // vec3 colori = u_color[0];
            morphvert += `\ncolori = blend(colori, u_color[${i}], u_morph${i - 1});`;
    }
    if (i > 0)
        morphvert += `\ncolori = blend(colori, u_color[0], u_morph${len - 1});`;

    var morphfrag = '';
    if ( tex ) {
        // len > 0
        morphfrag = `
            tex0 = texture2D( u_tex[0], vUv );`;
        for (var i = 1; i < len; i++) {
            morphfrag += `
            texi = texture2D( u_tex[${i}], vUv );
            if (texi.a > 0.01)
                tex0 = blend( tex0, texi, u_morph${i-1} );` ;
        }
        if (len > 1)
            morphfrag += `
            texi = texture2D( u_tex[0], vUv );
            tex0 = blend(tex0, texi, u_morph${len - 1});` ;
    }
    else morphfrag = `        tex0 = vColor;`;

    // vec4 blend(txa, txb, t);
    var statements = '';
    if (vparas.texMix & ShaderAlpha.product) {
        statements = `clr = txa * txb;`;
    }
    if (vparas.texMix & ShaderAlpha.multiply) {
        statements = `clr = txa * txb * t;`;
    }
    if (vparas.texMix & ShaderAlpha.differential) {
        statements = `clr = txa * abs(0.5 - t) + txb * abs(t - 0.5);`;
    }
    else if (vparas.texMix & ShaderAlpha.additive) {
        // default ShaderAlpha.mix
        statements = `clr = clamp(txa * (1.0 - t) + txb * t, 0.0, 1.0);`;
    }
    else {
        statements = `clr = mix(txa, txb, t);`;
    }

    var vertBlender = `vec3 blend(vec3 txa, vec3 txb, float t) {
        vec3 clr = vec3(0.4);
        ${statements}
        return clr;
    } `;

    var fragBlender = `vec4 blend(vec4 txa, vec4 txb, float t) {
        vec4 clr = vec4(0.4);
        ${statements}
        return clr;
    } `;

    // uniform int mode;   // Rendering mode
    // Material color
    // uniform vec3 diffuseColor;
    var ka = '1.0';   // Ambient reflection coefficient, e.g. 1.0,
    var kd = '1.0';   // Diffuse reflection coefficient, e.g. 0.4,
    var ks = '1.0';   // Specular reflection coefficient, e.g. 1.0,

    return {
  vertexShader: `
    uniform float n;
    uniform float shininessVal; // Shininess, e.g. 80
    uniform vec3 ambientColor;
    uniform vec3 specularColor;
    uniform vec3 u_lightPos; // Light position
    uniform float u_alpha;

    ${vertUnis}
    ${bothUnis}

    varying vec3 normalInterp;
    varying vec3 vertPos;
    varying vec4 vColor;
    varying float vAlpha;
    varying vec2 vUv;

    ${vertBlender}
    vec3 morphColors() {
        vec3 colori = u_color[0];
        ${morphvert}
        return colori;
    }

    void main(){
        vUv = uv;
        vAlpha = u_alpha;
        float Ka = ${ka};
        float Kd = ${kd};
        float Ks = ${ks};

        vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
        vertPos = vec3(vertPos4) / vertPos4.w;
        // normalInterp = vec3(modelMatrix  * vec4(normal, 0.0));
        // normalInterp = vec3(normalMatrix * vec4(normal, 0.0)); // original
        normalInterp = normalMatrix * normal; // three.js normalMatrix is 3 x 3
        gl_Position = projectionMatrix * vertPos4;

        vec3 N = normalize(normalInterp);
        vec3 L = normalize(u_lightPos - vertPos);

        // Lambert's cosine law
        float lambertian = max(dot(N, L), 0.0);
        float specular = 0.0;
        if(lambertian > 0.0) {
            vec3 R = reflect(-L, N);      // Reflected light vector
            vec3 V = normalize(-vertPos); // Vector to viewer
            // Compute the specular term
            float specAngle = max(dot(R, V), 0.0);
            specular = pow(specAngle, shininessVal);

            // debug
            // L = V;
            specular = pow(specAngle, 1.0);
        }

        vec3 diffuseColor = morphColors();

        vColor = vec4(Ka * ambientColor +
                    Kd * lambertian * diffuseColor +
                    Ks * specular * specularColor, u_alpha); // u_alpha = vparas.uniforms.u_alpha
    }
  `,
        // useful debug lines:
        // working vColor = vec4(L * Ka, u_morph0);
        // working with normalMatrix: vColor = vec4(Kd * lambertian);
        // working with normalMatrix: vColor = vec4(Ks * specular, 0.1, 0.2, 1.0);

  fragmentShader: `
    ${fragUnis}
    ${bothUnis}

    uniform float u_texWeight;

    varying vec4 vColor;
    varying float vAlpha;
    varying vec2 vUv;

    ${fragBlender}
    vec4 mixTexi() {
        vec4 tex0 = vec4(0.0);
        vec4 texi = vec4(0.0);
        ${morphfrag}
        if (tex0.a < 0.01)
            discard;
        return tex0;
    }

    void main() {
        // gl_FragColor = vColor;
        // gl_FragColor = mix(gl_FragColor, mixTexi(), u_texWeight);
        gl_FragColor = mix( vColor, mixTexi(), u_texWeight );
    }
  `};
}

/**Get shader of scaled orb, with respect to vertex dir & cent attribute
 * @deprecated replaced by scaleOrb?
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.dirOrb2
 * @function
 */
function dirOrb2() {
 return {
 vertexShader: `
  uniform vec3 wpos;
  uniform vec3 orbScale;

  attribute vec3 a_tan;

  varying vec2 vUv;
  varying vec3 I;
  varying vec3 P;
  varying vec3 vtan;
  varying vec4 cent;
  // varying mat3 R3;
  varying vec3 vabc;

  mat3 calcLookAtMatrix(vec3 target, float roll) {
    vec3 rr = vec3(sin(roll), cos(roll), 0.0);
    vec3 ww = normalize(target);
    vec3 uu = normalize(cross(ww, rr));
    vec3 vv = normalize(cross(uu, ww));
    // return mat3(uu, vv, -ww);
    return mat3(uu, vv, ww);
  }

  void main() {
    vUv = uv;
    vtan = a_tan;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    I = normalize(cameraPosition - P);

    mat3 R3 = calcLookAtMatrix(a_tan, 0.);
    // vec4 v = modelMatrix * vec4(R3 * orbScale, 1.);
    vabc = R3 * orbScale;
    cent = modelMatrix * vec4(wpos, 1.);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `,

 fragmentShader: `
  // uniform float modelAlpha;
  uniform float r;
  uniform vec3 orbScale;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vtan;
  varying vec4 cent;
  varying vec3 vabc;

  /**Vector distance  to orignal point.
   * https://math.stackexchange.com/questions/778171/intersection-of-ellipsoid-with-ray
   */
  vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 cent, vec3 abc ) {
      // e = o - c, where o = eye, c = cent
      vec3 e = eye - cent;
      e = e / vabc;

      // delta = (u . e)^2 + r^2 - |e|^2
      u = normalize(u / vabc);

      float delta = pow( dot( u, e ), 2. ) + pow( r, 2. ) - dot(e, e);
      if (delta < 0.) return vec2(delta);
      // d = - u.e +/- delta^0.5
      delta = pow( delta, 0.5 );
      return vec2( -dot( u, e ) + delta, -dot( u, e ) - delta );
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    // float r = 30.;
    vec3 e = cameraPosition;
    vec3 i = normalize( P - cameraPosition );
    // vec2 dists = sdEllipsoid( e, i, r, cent.xyz, vec3(1.2, .25, .5) );
    // vec2 dists = sdEllipsoid( e, i, r, cent.xyz, orbScale );
    vec2 dists = sdEllipsoid( e, i, r, cent.xyz, vabc );

    if (dists.x < 0.0) {
      // Didn't hit anything
      // fragColor = mix(vec4( abs(modelAlpha) ), texture2D(iChannel0, vUv), .3);
      fragColor = vec4(vtan, 0.4);
      fragColor.g += 0.2;
      return;
    }

    vec3 p = e + dists.x * i;
    vec3 n = normalize(p - cent.xyz);
    float ratio = abs(length(dists.x - dists.y)) / (2. * r);
    fragColor = vec4 ( pow( clamp(ratio, 0.001, 1.), 4. ) );
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }`
 }
}

/**Get shader of scaled orb, with respect to vertex dir & cent attribute
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.scaleOrb
 * @function
 */
function scaleOrb(vparas) {
 return { fragmentShader: `
  uniform float r;
  uniform float whiteAlpha;
  uniform vec3 orbScale;
  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vtan;
  varying vec3 vscale;
  varying vec4 cent;
  varying mat3 R3;

  /**Vector distance  to orignal point.
   * https://math.stackexchange.com/questions/778171/intersection-of-ellipsoid-with-ray
   */
  vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 cent, vec3 abc ) {
      // abc = normalize(normalize(vtan) * normalize(abc));

      // e = o - c, where o = eye, c = cent
      vec3 e = eye - cent;
      e = e / abc;

      // delta = (u . e)^2 + r^2 - |e|^2
      u = normalize(u / abc);

      float delta = pow( dot( u, e ), 2. ) + pow( r, 2. ) - dot(e, e);
      if (delta < 0.) return vec2(delta);
      // d = - u.e +/- delta^0.5
      delta = pow( delta, 0.5 );
      return vec2( -dot( u, e ) + delta, -dot( u, e ) - delta );
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec3 e = cameraPosition;
    vec3 i = normalize( P - cameraPosition );
    vec2 dists = sdEllipsoid( e, i, r, cent.xyz, vscale );

    fragColor = texture2D(u_tex, vUv);
    fragColor.a = clamp(whiteAlpha, 0.0, 1.);
    if (dists.x < 0.0) {
      ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
      return;
    }

    vec3 p = e + dists.x * i;
    vec3 n = normalize(p - cent.xyz);
    float ratio = abs(length(dists.x - dists.y)) / (2. * r);
    fragColor += vec4 ( pow( clamp(ratio, 0.0, 1.), 4. ) );
    fragColor = clamp(fragColor, 0., 1.);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }`,

  vertexShader: `
  uniform vec3 wpos;
  uniform vec3 orbScale;

  attribute vec3 a_tan;

  varying vec2 vUv;
  varying vec3 I;
  varying vec3 P;
  varying vec3 vtan;
  varying vec3 vscale;
  varying vec4 cent;
  varying mat3 R3;

  void main() {
    vUv = uv;
    vec4 v = projectionMatrix * modelViewMatrix * vec4( a_tan, 1.0 );
    vtan = v.xyz;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    I = normalize(cameraPosition - P);
    vscale = orbScale;
    cent = modelMatrix * vec4(wpos, 1.);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

/**Get shader of a sequnce of orbs, with respect to vertex dir & cent attribute
 * Test page: test/html/map3d/geopath-road.html<br>
 * ShaderFlag: worldOrbs
  <pre>uniform float r;
  uniform float whiteAlpha;
  uniform sampler2D u_tex;
  uniform vec3 wpos;
  uniform vec3 offsets[${orbs}];
  uniform vec3 orbScale;
  uniform float r[${orbs}];
  uniform vec4 orbColors[${orbs}];

  attribute vec3 a_tan;
  attribute vec3 a_pos;</pre>
 *
 * sub function:<br>
 * vec2 sdEllipsoid(): Vector distance  to orignal point.
 * param vec3 eye - raycast origin
 * param vec3 u - ray direction
 * param float r - orb radius
 * param vec3 cnetr - orb center
 * param vec3 abc - orb x y z scale
 * return vec2 distances where ray intercecting ellipsoid; less than zero if not.
 * see https://math.stackexchange.com/questions/778171/intersection-of-ellipsoid-with-ray
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.worldOrbs
 * @function
 */
function worldOrbs(vparas) {
 var orbs = vparas.offsets.length || 1;
 return { fragmentShader: `
  uniform float r[${orbs}];
  uniform vec4 orbColors[${orbs}];

  uniform float whiteAlpha;
  uniform vec3 orbScale;
  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vscale;
  varying vec4 cent[${orbs}];

  vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 centr, vec3 abc ) {
      // e = o - c, where o = eye, c = center
      vec3 e = eye - centr;
      e = e / abc;

      // delta = (u . e)^2 + r^2 - |e|^2
      u = normalize(u / abc);

      float delta = pow( dot( u, e ), 2. ) + pow( r, 2. ) - dot(e, e);
      if (delta < 0.) return vec2(delta);
      // d = - u.e +/- delta^0.5
      delta = pow( delta, 0.5 );
      return vec2( -dot( u, e ) + delta, -dot( u, e ) - delta );
  }

  // void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec4 mainImage( in vec2 fragCoord ) {
    vec4 fragColor = vec4(0.);
    vec3 e = cameraPosition;
    vec3 u = normalize( P - cameraPosition );

    for (int i = 0; i < ${orbs}; i++) {
        vec3 ci = cent[i].xyz;
        vec2 dists = sdEllipsoid( e, u, r[i], ci, vscale );

        if (dists.x <= 0.00001) {
          ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
          continue;
        }

        vec3 p = e + dists.x * u;
        vec3 n = normalize(p - ci);
        float ratio = abs(length(dists.x - dists.y)) / (2. * r[i]);
        // fragColor += vec4 ( pow( clamp(ratio, 0.0, 1.), 4. ) );
        fragColor += pow( clamp(ratio, 0.0, 1.), 4. ) * orbColors[i];
    }
    fragColor = clamp(fragColor, 0., 1.);
    float txAlpha = clamp(whiteAlpha, 0., 1.);
    fragColor.a = 1. - txAlpha;

    vec4 texcolor = texture2D(u_tex, vUv);
    fragColor = mix(fragColor, texcolor, txAlpha);
	return fragColor;
  }

  void main() {
    // mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor += mainImage(gl_FragCoord.xy);
  }`,

 vertexShader: `
  uniform vec3 wpos;
  uniform vec3 offsets[${orbs}];
  uniform vec3 orbScale;

  attribute vec3 a_tan;
  attribute vec3 a_pos;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vscale;
  varying vec4 cent[${orbs}];

  void main() {
    vUv = uv;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    vscale = orbScale;
    for (int i = 0; i < ${orbs}; i++){
      cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.); // offsets alon a_tan ...
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

/**Get shader of a sequnce of orb groups, each for a wpos - an vec3 array, with
 * respect to vertex dir & cent attribute
 * Test page: test/html/map3d/geopaths.html<br>
 * ShaderFlag: worldOrbs
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.worldOrbs
 * @function
 */
function orbGroups(vparas) {
 var grps = vparas.follows.length;
 var orbs = vparas.offsets.length;
 return { fragmentShader: `
  uniform float r[${orbs}];
  uniform vec4 orbColors[${orbs}];

  uniform float u_t;
  uniform float tmin;
  uniform float tmax;
  uniform float follows[${grps}];

  uniform float whiteAlpha;
  uniform vec3 orbScale;
  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vtan; // ignored in v0.3
  varying vec3 vscale;
  varying vec3 vcent[${grps * orbs}];

  vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 centr, vec3 abc ) {
      // e = o - c, where o = eye, c = center
      vec3 e = eye - centr;
      e = e / abc;

      // delta = (u . e)^2 + r^2 - |e|^2
      u = normalize(u / abc);

      float delta = pow( dot( u, e ), 2. ) + pow( r, 2. ) - dot(e, e);
      if (delta < 0.) return vec2(delta);
      // d = - u.e +/- delta^0.5
      delta = pow( delta, 0.5 );
      return vec2( -dot( u, e ) + delta, -dot( u, e ) - delta );
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec3 e = cameraPosition;
    vec3 u = normalize( P - cameraPosition );

    fragColor = vec4(0.);
    for (int j = 0; j < ${grps}; j++) {
      float flwj = follows[j] / 100.;
      if (tmin <= u_t - flwj && u_t - flwj <= tmax ) {
        for (int i = 0; i < ${orbs}; i++) {
            vec3 ci = vcent[j*${grps} + i];
            vec2 dists = sdEllipsoid( e, u, r[i], ci, vscale );

            if (dists.x <= 0.00001) {
              ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
              continue;
            }

            vec3 p = e + dists.x * u;
            vec3 n = normalize(p - ci);
            float ratio = abs(length(dists.x - dists.y)) / (2. * r[i]);
            fragColor += pow( clamp(ratio, 0.0, 1.), 4. ) * orbColors[i];
        }
      }
    }
    fragColor = clamp(fragColor, 0., 1.);

    float txAlpha = clamp(whiteAlpha, 0., 1.);
    fragColor.a = 1. - txAlpha;

    vec4 texcolor = texture2D(u_tex, vUv);
    fragColor = mix(fragColor, texcolor, txAlpha);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }`,

 /* wpos[] group cent ( alone path )
    vec3 tan = normalize(a_tan);
    for (int i = 0; i < ${grps}; i++) {
      vfollows[i] = modelMatrix * (tan * follows[i] + cent[0]);
    }
 */
 vertexShader: `
  uniform vec3 wpos[${grps}];
  uniform float follows[${grps}];
  uniform vec3 orbScale;

  uniform float offsets[${orbs}];

  attribute vec3 a_tan;
  attribute vec3 a_pos;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vtan; // ignored in v0.3
  varying vec3 vscale;
  varying vec3 vcent[${grps * orbs}];

  void main() {
    vUv = uv;
    vec4 v = projectionMatrix * modelViewMatrix * vec4( a_tan, 1.0 );
    vtan = v.xyz;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    vscale = orbScale;

    for (int j = 0; j < ${grps}; j++) {
      for (int i = 0; i < ${orbs}; i++) {
        if (length(a_tan) > 0.) {
          vec4 vc = modelMatrix * vec4(wpos[j] + normalize(a_tan) * offsets[i], 1.);
          vcent[j*${grps} + i] = vc.xyz;
        }
        else {
          vec4 vc = modelMatrix * vec4(wpos[j] + offsets[i], 1.);
          vcent[j*${grps} + i] = vc.xyz;
        }
      }
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

/**
 * https://thebookofshaders.com/05/
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.fragShape
 * @function
 */
function fragShape(vparas) {
  return {
    fragmentShader: `
    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;

    // Plot a line on Y using a value between 0.0-1.0
    float plot(vec2 st, float pct){
      return  smoothstep( pct-0.02, pct, st.y) -
              smoothstep( pct, pct+0.02, st.y);
    }

    void main() {
        vec2 st = gl_FragCoord.xy/u_resolution;

        float y = st.x;

        vec3 color = vec3(y);

        // Plot a line
        float pct = plot(st,y);
        color = (1.0-pct)*color+pct*vec3(0.0,1.0,0.0);

        gl_FragColor = vec4(color,1.0);
    } `,
    vertexShader: `
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    `
    }
}

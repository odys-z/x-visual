/**
 * @namespace xv.xutils
 */

import * as THREE from 'three'
import {x} from '../xapp/xworld'
import {ShaderFlag} from '../component/visual'
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

/**
 * Merge Visual.paras.uniforms, load texture according to Visual.paras.u_tex.
 * @param {Visual} cmpVisual
 * @param {Obj3} cmpObj3 not used?
 * @return {object} uniforms for THREE.Mesh - properties are in format of name: {value}
 * @member xglsl.formatUniforms
 */
export function formatUniforms(cmpVisual, cmpObj3) {
	var uniforms = {};
	if (cmpVisual.paras && cmpVisual.paras.u_tex) {
		if (cmpVisual.paras.uniforms && typeof cmpVisual.paras.uniforms.u_tex === 'string') {
			console.warn ( "formatUniforms(): ignoring wrong paras: Visual.paras.uniforms.u_tex = ",
							cmpVisual.paras.uniforms.u_tex );
			delete cmpVisual.paras.uniforms.u_tex;
		}
		uniforms = {
			u_tex: { value: new THREE.TextureLoader().load(`assets/${cmpVisual.paras.u_tex}`) }
		};
	}
	else if (cmpVisual.paras.uniforms && typeof cmpVisual.paras.uniforms.u_tex === 'string') {
		console.warn ( "formatUniforms(): takeing Visual.paras.uniforms.u_tex as uniform for shader.",
					   "The correct paras for u_tex is Visual.paras.u_tex.",
						cmpVisual.paras.uniforms.u_tex );
		uniforms = {
			u_tex: { value: new THREE.TextureLoader().load(`assets/${cmpVisual.paras.uniforms.u_tex}`) }
		};
		delete cmpVisual.paras.uniforms.u_tex;
	}
	else if ((cmpVisual.shader & ShaderFlag.defaultex) === ShaderFlag.defaultex) {
		uniforms = {
			u_tex: { value: AssetKeepr.defaultex() }
		};
	}

	if (cmpVisual.paras.uniforms)
		Object.assign(uniforms, obj2uniforms(cmpVisual.paras.uniforms));

	return uniforms;
}

/**
 * Convert object into THREE.Mesh.uniforms format (properties are {value} object).
 * @param {object} properties
 * @param {THREE.Uniforms} uniforms
 * @return {object} uniforms for THREE.Mesh - properties are in format of name: {value}
 * @member xglsl.obj2uniforms
 */
export function obj2uniforms(properties, uniforms) {
	var u = {};
	for (var p in properties) {
		u[p] = {value: properties[p]};
	}
	return Object.assign(uniforms || {}, u);
}

/**
 * Convert script value to THREE.Uniforms format (properties are {value} object).
 * <br>If properties of sval is an array, only it's first value are used as the
 * uniforms value - required by Tween.
 * @param {object} sval
 * @param {Obj3} uniforms not used?
 * @return {object} uniforms for THREE.Mesh - properties are in format of name: {value}
 * @member xglsl.script2uniforms
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

/**
 * @param {int} flag @see ShaderFlag
 * @param {Visual.paras} vparas @see Visual
 * @return {object} {vertexShader, fragmentShader}
 * The shaders for THREE.ShaderMaterial (using variables supported by Three.js)
 * vertextShader {string}
 * vertextShader {string}
 * @member xglsl.randomRarticl */
export function xvShader(flag, vparas) {
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
        case ShaderFlag.testPoints:
        default:
			s = testPnt(vparas);
    }
	if (x.log >= 5)
		console.debug(`[5] flag: ${flag.toString(16)}, paras: `,
			vparas, '\nshaders: ', s);
	return s;
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
 * @member xglsl.randomRarticl */
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
 */
export function particlesGeom (vparas, meshSrc, meshTarget) {
	var sizes = [];
	var colors = [];
	var noise = [];
	// var count = meshSrc.count / meshSrc.itemSize;	// count = length / 3
	var count = meshSrc.count;
	for (var c = 0; c < count; c++) {
		var color = xutils.randomRGB();
		colors.push( color.r, color.g, color.b );
		sizes.push( (Math.random() * 2 - 1 ) );

		if (vparas.a_noise)
			noise.push( (Math.random() * vparas.noise - vparas.noise / 2 ) );
	}

	var geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', meshSrc.clone(), 3 );

	geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 )
			.setUsage( THREE.DynamicDrawUsage ) );
	geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 )
			.setUsage( THREE.DynamicDrawUsage ) );

	if (vparas.a_noise)
		geometry.setAttribute( 'a_noise', new THREE.Float32BufferAttribute( noise, 1 )
			.setUsage( THREE.DynamicDrawUsage ) );

	// TODO case: meshsrc.count != meshTarget.count
	if (vparas.dest || vparas.a_dest) {
		geometry.setAttribute( 'a_dest', meshTarget.clone(), 3 );
	}
	return geometry;
}

/** get shader of gl_point for debugging
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testPnt */
function testPnt(paras) {
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
 * @param {object} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.cubeVoxels9
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
  // attribute vec3 ix;	// use position as index

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
	vec3 p_ = next2model(u_sects, u_box0);	// also morph next grid
	vec3 d0 = p_ - pos.xyz;					// model 0 section length
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
    // gl_FragColor.a *= vAlpha;
  } `
 }
};

/** get geometry buffer for cube voxels, with attributes that the shader can work.
 * @param {object} vparas
 * @return {THREE.BufferGeometry} the geometry buffer.
 * @member xglsl.cubeVoxels
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
 * https://www.shadertoy.com/view/MdX3zr
 * Raymarch is not neccessary:<pre>
 * 
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
	float d = sphere(p, vec4(-0., -1.250, 0.0, 1.));
    return d + noise(p + vec3(.0, iTime*2., .0) * p.yxz) *.25;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    // vec4 p = 1.5 - vec4(flame(vec3(abs(fragCoord - vec2(200., 300)), 0.) / 500.0));
    vec2 off = abs(fragCoord - vec2(160., 180.))/ fragCoord;
    vec3 p0 = vec3(off, 0.);
    float glow = 1.3 - flame(p0);
	vec4 col = mix(vec4(0., .0, .0, 1.), vec4(0.1, .5, .0, 1.), glow);

	fragColor = mix(vec4(0.), col, pow(glow, 4.));
}
</pre>
 */
function flameLight(vparas) {
}

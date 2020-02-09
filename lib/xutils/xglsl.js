/**
 * @module xv.xutils
 */

import * as THREE from 'three'
import {x} from '../xapp/xworld'
import {ShaderFlag} from '../component/visual'
import * as xutils from './xcommon'

/**
 * example: await sleep(1000);
 * @param {int} flag see xv.ecs.comp.ShaderFlag
 * @param {Visual.paras} vparas see xv.ecs.comp.Visual
 * @return {object} {vertexShader, fragmentShader}
 * The shaders for THREE.ShaderMaterial (using variables supported by Three.js)
 * vertextShader {string}
 * vertextShader {string}
 */
export function xvShader(flag, vparas) {
	var s;
    switch (flag & ShaderFlag.mask) {
        case ShaderFlag.randomParticles:
            s = randomParticl(vparas);
        case ShaderFlag.testPoints:
        default:
			s = testPnt(vparas);
    }
	if (x.log >= 5)
		console.debug(`[log 5] flag: ${flag.toString(16)}, paras: `,
			vparas, '\nshaders: ', s);
	return s;
}

/**Get shader for both ShaderFlag.randomParticles and ShaderFlag.uniformParticles.
 * If u_morph is animated, must providen a uniform vec3, a_target.
 * Used variables: position, color, size.
 * gl_position = mix(pos, taget, morph) + noise * dist;
 * @paras {object} paras
 * paras.u_dist {float} in world
 * paras.u_morph {float}
 * paras.a_target {vec3} in world
 * paras.a_noise {float}
 * paras.size_scale {float}
 */
function randomParticl (paras) {
 return { vertexShader: `
  uniform float u_dist;
  uniform float u_morph;

  attribute vec3 a_target;
  attribute float a_noise;

  varying vec3 vColor;

  void main() {
    vColor = color;
	vec3 pos = mix(position, a_target, u_morph) + a_noise * u_dist;
    // vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    // gl_PointSize = u_morph * ( 300.0 / -mvPosition.z );
	gl_PointSize = size * ${paras.vert_scale || '10.0'};
    gl_Position = projectionMatrix * mvPosition;
  } `,
 fragmentShader: `
  uniform sampler2D u_tex;
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4( vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( u_tex, gl_PointCoord );
  } `
 };
}

/**Create geometry buffer from target mesh.
 * If shader type is randomParticles, the buffer also has attributes color and size.
 * @return {THREE.BufferGeometry}
 */
export function particlesGeom (shadetype, vparas, meshSrc, meshTarget) {
	var sizes = [];
	var colors = [];
	var noise = [];
	var count = meshSrc.count / 3 / meshSrc.itemSize;
	for (var c = 0; c < count; c++) {
		var color = xutils.randomRGB();
		colors.push( color.r, color.g, color.b );
		sizes.push( (Math.random() * 2 - 1 ) );
		if (vparas.noise > 0)
			noise.push( (Math.random() * vparas.noise - vparas.noise / 2 ) );
	}

	var geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', meshSrc.clone(), 3 );

	if (shadetype === ShaderFlag.randomParticles) {
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
		geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 )
				.setUsage( THREE.DynamicDrawUsage ) );
	}
	if (vparas.noise > 0)
		geometry.setAttribute( 'a_noise', new THREE.Float32BufferAttribute( noise, 1 )
				.setUsage( THREE.DynamicDrawUsage ) );

	// TODO case: meshsrc.count != meshTarget.count
	if (meshTarget)
		geometry.setAttribute( 'a_target', meshTarget.clone(), 3 );
	return geometry;
}

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

export function obj2uniforms (properties, uniforms) {
	var u = {};
	for (var p in properties) {
		u[p] = {value: properties[p]};
	}
	return Object.assign(uniforms || {}, u);
}

export function script2uniforms (svals, uniforms) {
	var u = {};
	for (var p in svals) {
		if (Array.isArray(svals[p]))
			u[p] = {value: svals[p][0]};
		else if (typeof svals[p] === 'number')
			u[p] = {value: svals[p]};
		else throw XError(`xglsl.script2uniforms(): can't convert vals to uniforms: svals[${p}]: ${svlas[p]}`);
	}
	return Object.assign(uniforms || {}, u);
}

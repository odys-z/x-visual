/**
 * @module xv.xutils
 */

import * as THREE from 'three'
import {x} from '../xapp/xworld'
import {ShaderFlag} from '../component/visual'

/**
 * example: await sleep(1000);
 * @param {int} flag see xv.ecs.comp.ShaderFlag
 * @param {Visual.paras} vparas see xv.ecs.comp.Visual
 * @return {object} {vertexShader, fragmentShader} for THREE.ShaderMaterial (using
 * variables supported by Three.js)
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
function randomParticl(paras) {
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

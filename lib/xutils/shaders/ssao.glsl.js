
import {SSAOShader} from '../../../packages/three/shaders/SSAOShader'

/** SSAO Shader
 * @param {object=} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.ssao
 * @function
 */
export function ssao(paras = {}) {
	return {
		vertexShader: SSAOShader.vertexShader,
		fragmentShader: SSAOShader.fragmentShader
		// `void main() { gl_FragColor = vec4( 1., 1., 0., 1. ); }`
	};
}

export function u_ssao(uniforms, vparas, obj3) {

}

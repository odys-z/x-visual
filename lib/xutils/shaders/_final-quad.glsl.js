
import {glx, glConfig, initPhongUni, updatePhongUni} from './glx.glsl';

/**Final quad collector.
 * @param {object=} vparas Visual.paras
 * @param {bool=} debug show quad mesh area?
 * @member xglsl._finalQuad
 * @function
 *  */
export function _finalQuad(vparas = {}, debug) {

	return {
		vertexShader: `#version 300 es
			in vec3 position;
			in vec2 uv;
			out vec2 vUv;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `#version 300 es
			precision highp float;
			precision highp int;
			layout(location = 0) out vec4 pc_FragColor;

			in vec2 vUv;

			uniform sampler2D tDiffuse;
			uniform sampler2D tNormal;

			void main() {
				vec3 diffuse = texture( tDiffuse, vUv ).rgb;
				vec3 normal = texture( tNormal, vUv ).rgb;

				pc_FragColor.rgb = diffuse; // mix( diffuse, diffuse * normal, step( 0.5, vUv.x ) );
				pc_FragColor.a = 1.0;
				${debug? 'pc_FragColor.r += abs(vUv.x/(1. - vUv.y)) * 0.05;' : ''}
			}
			`.replaceAll(/\n\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

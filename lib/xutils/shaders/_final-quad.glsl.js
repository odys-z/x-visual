
import {glx, glConfig} from './glx.glsl';

/**Final quad collector.
 * @param {object=} vparas Visual.paras
 * @param {bool=} debug show quad mesh area?
 * @member xglsl._finalQuad
 * @function
 *  */
export function _finalQuad(vparas = {}, debug) {
	//  reduce main scene color for filter debugging
	let debugFilter = !debug ? 0 : glConfig.xbuffer.yeildColor

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

		fragmentShader: (`#version 300 es
			precision highp float;
			precision highp int;
			layout(location = 0) out vec4 pc_FragColor;

			uniform sampler2D xFragColor;
			uniform sampler2D xColor;
			uniform sampler2D xEnvSpecular;
			uniform sampler2D xBlurH;
			uniform vec2 u_texsize;
			in vec2 vUv;

			void main() {
				// vec3 diffuse = texture( xFragColor, vUv ).rgb;
				// vec3 xcol = texture( xColor, vUv ).rgb;
				// pc_FragColor.rgb = diffuse;
				
				${debugFilter > 0 ? `pc_FragColor *= float(${debugFilter});` : ''}
				pc_FragColor.rgb = texture( xBlurH, vUv ).rgb;
				pc_FragColor.a = 1.0;`
				// TODO tonemap should be actually here
				+ `
				${debug ? 'pc_FragColor.r += abs(vUv.x/(1. - vUv.y)) * 0.01;' : ''}
			}`)
			.replaceAll(/\n\t\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

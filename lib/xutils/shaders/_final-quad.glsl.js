
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

			uniform sampler2D xFragColor;
			uniform sampler2D xColor;
			uniform sampler2D xEnvSpecular;
			uniform sampler2D xBlurH;
			uniform vec2 u_texsize;
			in vec2 vUv;`

			// https://www.shadertoy.com/view/lt3fzN
			+ `
			vec4 blur(in sampler2D tex, in highp vec2 uv, in highp vec2 resolution) {
				highp vec2 r = 4.0 / resolution;

				const lowp float off = 8.0;
				const lowp float v = off * 2.0 + 1.0;
				const lowp float d = 1.0 / (v * v);

				lowp vec4 color = vec4(0.0);
				for (float x = -off; x <= off; x++) {
					for (float y = -off; y <= off; y++) {
						highp vec2 coord = vec2(uv.x + x * r.x, uv.y + y * r.y);
						color += texture(tex, coord) * d;
					}
				}
				return color;
			}

			void main() {
				vec3 diffuse = texture( xFragColor, vUv ).rgb;
				vec3 xcol = texture( xColor, vUv ).rgb;
				vec3 xenv = texture( xEnvSpecular, vUv ).rgb;
				vec3 hblur = texture( xBlurH, vUv ).rgb;

				pc_FragColor.rgb = diffuse;
				// pc_FragColor.rgb = mix( diffuse, diffuse * xcol, step( 0.5, vUv.x ) );
				// pc_FragColor += blur( xEnvSpecular, vUv, u_texsize );

				pc_FragColor *= 0.1;
				pc_FragColor.xyz += hblur;

				pc_FragColor.a = 1.0;
				${debug? 'pc_FragColor.r += abs(vUv.x/(1. - vUv.y)) * 0.05;' : ''}
			}
			`.replaceAll(/\n\t\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

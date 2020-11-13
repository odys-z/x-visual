
import {glx, glConfig} from './glx.glsl';

/**Filter: horizontal blur.
 * @param {object=} vparas Visual.paras
 * @param {bool=} debug show quad color
 * @member xglsl._hBlur
 * @function
 *  */
export function _hBlur(vparas = {}, debug) {

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
		`.replaceAll(/\n\t\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `#version 300 es
			precision highp float;
			precision highp int;
			layout(location = 0) out vec4 xOutline;
			layout(location = 1) out vec4 xBlurColor;

			uniform sampler2D xFragColor;
			uniform sampler2D xColor;
			uniform sampler2D xEnvSpecular;
			uniform vec2 u_texsize;
			in vec2 vUv;

			${glx.xenv.threshold}
			${glx.mrt.f_blurH}

			void main() {
				// vec3 xenv = texture( xEnvSpecular, vUv ).rgb;
				xBlurColor = blurH( xEnvSpecular, vUv, u_texsize );

				xOutline += vec4(0.);
				${debug? 'xBlurColor.r += smoothstep(0.45, 0.55, vUv.x) * 0.2;' : ''}
			}
			`.replaceAll(/\n\t\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

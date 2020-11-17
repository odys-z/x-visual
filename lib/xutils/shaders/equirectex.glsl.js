
import {glConfig, glx, initPhongUni, updatePhongUni} from './glx.glsl';

/** testing equirectangle texture sampling
 * @param {object=} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.equirectex
 * @function
 */
export function equirectex( paras = {} ) {
	// set z to camera.far
	let isInfiniteFar = true;
	return {
		vertexShader: `#version 300 es
			precision highp float;
			uniform mat4 modelMatrix;
			uniform mat4 projectionMatrix;
			uniform mat4 modelViewMatrix;

			in vec3 normal;
			in vec3 position;
			out vec3 vNormal;
			out vec3 vwDir;

			${glx.transformDirection}

			void main() {
				vNormal = normal;
				vwDir = transformDirection( position, modelMatrix );

				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;
				${isInfiniteFar ? 'gl_Position.z = gl_Position.w;' : ''}
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `${glx.mrt.f_layout}
			#define RECIPROCAL_PI 0.3183098861837907
			#define RECIPROCAL_PI2 0.15915494309189535

			uniform sampler2D u_tex0;
			uniform float u_bloomThresh;
			in vec3 vwDir;
			in vec3 vNormal;

			${glx.equirectUv}
			${glx.xenv.threshold}

			void main() {
				vec2 sampleUV = equirectUv( vwDir, RECIPROCAL_PI, RECIPROCAL_PI2 );
				pc_FragColor = texture( u_tex0, sampleUV );

				pc_FragColor.xyz = mix(pc_FragColor.xyz, vNormal, 0.4);
				xColor = pc_FragColor;
				xEnvSpecular += threshold(pc_FragColor, u_bloomThresh + ${glConfig.thresh0});
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),
	};
}

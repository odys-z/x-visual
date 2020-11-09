
import {glx, initPhongUni, updatePhongUni} from './glx.glsl';

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

			vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
				return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
			}

			void main() {
				vNormal = normal;
				vwDir = transformDirection( position, modelMatrix );

				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;
				${isInfiniteFar ? 'gl_Position.z = gl_Position.w;' : ''}
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `#version 300 es
			#define RECIPROCAL_PI 0.3183098861837907
			#define RECIPROCAL_PI2 0.15915494309189535

			precision highp float;
			layout(location = 0) out vec4 pc_FragColor;
			layout(location = 1) out vec4 xColor;

			uniform sampler2D u_tex0;
			in vec3 vwDir;
			in vec3 vNormal;

			vec2 equirectUv( in vec3 dir ) {
				float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
				float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
				return vec2( u, v );
			}

			void main() {
				vec3 wdir = normalize( vwDir );
				vec2 sampleUV = equirectUv( wdir );
				// pc_FragColor = mapTexelToLinear( texColor );
				pc_FragColor = texture( u_tex0, sampleUV );

				pc_FragColor.xyz = mix(pc_FragColor.xyz, vNormal, 0.4);
				xColor = pc_FragColor;
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),
	};
}

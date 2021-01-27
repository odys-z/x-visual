
import {glConfig, glx, initPhongUni, updatePhongUni} from './glx.glsl';

/** get shader of reflector for unit testing of reflection.
 * @param {object=} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.reflectex
 * @function
 */
export function reflectex(paras = {}) {
	var n_light = '1';
	var ldr = glConfig.shadow.LDR('s');
	return {
		vertexShader: `#version 300 es
			uniform vec3 cameraPosition;
			uniform mat4 modelMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat4 modelViewMatrix;
			uniform mat3 normalMatrix;

			uniform mat4 directionalShadowMatrix[ ${n_light} ];
			uniform mat4 textureMatrix;
			uniform float u_lightIntensity;

			in vec3 position;
			in vec3 normal;
			in vec2 uv;

			out vec2 vUv;
			out vec3 vnormal;
			out vec3 vertPos;
			out vec4 vUv4;
			${glx.shadow.setShadowCoords(n_light)}

			void main() {
				vUv = uv;
				vUv4 = textureMatrix * vec4( position, 1.0 );

				vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
				vertPos = worldPosition.xyz;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				setShadowCoords(directionalShadowMatrix, worldPosition);

				vnormal = normalMatrix * normal;
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `${glx.mrt.f_layout}
			${glx.u_alpha}
			uniform sampler2D u_tex[1];
			uniform sampler2D tDiffuse;

			uniform float u_texWeight;
			uniform vec4  u_color; // diffuse
			uniform float u_shininess;
			uniform vec3  u_ambientColor;
			uniform vec3  u_specularColor;
			uniform vec3  u_lightPos;

			in vec3  vertPos;
			in vec4 vUv4;
			in vec2 vUv;
			in vec3  vnormal;

			${glx.threshold}
			${glx.shadow.frag}

			float blendOverlay( float base, float blend ) {
				return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
			}

			vec3 blendOverlay( vec3 base, vec3 blend ) {
				return vec3(blendOverlay( base.r, blend.r ),
							blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
			}

			void main() {
				float s = shadow();

				vec4 refl = textureProj( tDiffuse, vUv4 );

				pc_FragColor = vec4( blendOverlay( refl.rgb, u_color.xyz * ${glConfig.shadow.LDR('s')} ), 1.0 );

				pc_FragColor.rgb = mix(pc_FragColor.rgb, u_color.rgb * s, 0.5);
				xColor = pc_FragColor;
				xEnvSpecular = threshold(pc_FragColor);
			}
		`.replaceAll(/\n\t\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),
	}
}

reflectex.initUniform = initPhongUni;

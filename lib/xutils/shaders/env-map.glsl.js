
import {glx, glConfig, initPhongUni, updatePhongUni} from './glx.glsl';

/**Sampling equirectangle envMap for test or try.
 * @param {object=} vparas Visual.paras
 * @member xglsl.envMap
 * @function
 *  */
export function envMap(vparas = {}) {

	return {
		// about inverseTransformDirection:
		// Guess: must used to revert normal bending.
		// see https://stackoverflow.com/a/13654662
		// question: but invers is not transpose
		// An affine transform matrix can be inverted as:
		// https://math.stackexchange.com/a/152479
		//
		// Three.js/src/renderers/shaders/ShaderChunk/envmap_vertex.glsl.js:
		// vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		//
		// Three.js/src/renderers/shaders/ShaderChunk/common.glsl.js
		// vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
		// 	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
		// }

		vertexShader: `#version 300 es
			uniform vec3 cameraPosition;
			uniform mat4 modelMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;

			in vec3 position;
			in vec3 normal;

			out vec3 vReflect;
			out vec3 vRefract;

			${glx.revertNormal()}

			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);

				gl_Position = projectionMatrix * viewMatrix * worldPosition;

				vec3 worldNormal = revertNormal(normal);
				vec3 I = normalize( worldPosition.xyz - cameraPosition );
				vReflect = reflect( I, worldNormal );
				vRefract = refract( I, worldNormal, ${glConfig.refractionRatio} );
			}
		`.replaceAll(/\n\t\t\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `#version 300 es
				#define RECIPROCAL_PI 0.3183098861837907
				#define RECIPROCAL_PI2 0.15915494309189535

				precision highp float;
				layout(location = 0) out vec4 pc_FragColor;
				layout(location = 1) out vec4 xColor;

				uniform sampler2D envMap;

				uniform float flipEnvMap;
				uniform float whiteAlpha;
				uniform vec2 lod;

				in vec3 vReflect; // vwDir;
				in vec3 vRefract;

				vec2 equirectUv( in vec3 dir ) {
					float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
					float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
					return vec2( u, v );
				}

				void main() {
					// vec3 wdir = normalize( vec3( flipEnvMap * vReflect.x, vReflect.yz ) );
					vec3 wdir = normalize( vReflect );
					vec2 sampleUV = equirectUv( wdir );
					vec4 envReflect = texture( envMap, sampleUV, lod.y );

					wdir = normalize( vec3( flipEnvMap * vRefract.x, vRefract.yz ) );
					sampleUV = equirectUv( wdir );
					vec4 envRefrect = texture( envMap, sampleUV, lod.x );

					pc_FragColor.xyz = mix(envReflect.xyz, envRefrect.xyz, whiteAlpha);
					pc_FragColor.a = 1.;
					xColor = pc_FragColor;
				}
			`.replaceAll(/\n\t\t\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}
export function envCubeMap(vparas = {}) {

	return {
		// about inverseTransformDirection:
		// Guess: must used to revert normal bending.
		// see https://stackoverflow.com/a/13654662
		// question: but invers is not transpose
		// An affine transform matrix can be inverted as:
		// https://math.stackexchange.com/a/152479
		//
		// Three.js/src/renderers/shaders/ShaderChunk/envmap_vertex.glsl.js:
		// vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		//
		// Three.js/src/renderers/shaders/ShaderChunk/common.glsl.js
		// vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
		// 	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
		// }

		vertexShader: `#version 300 es
			uniform vec3 cameraPosition;
			uniform mat4 modelMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;

			in vec3 position;
			in vec3 normal;
			in vec2 uv;

			out vec3 vReflect;
			out vec3 vRefract;

			${glx.revertNormal()}

			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);

				gl_Position = projectionMatrix * viewMatrix * worldPosition;

				vec3 worldNormal = revertNormal(normal);
				vec3 I = normalize( worldPosition.xyz - cameraPosition );
				vReflect = reflect( I, worldNormal );
				vRefract = refract( I, worldNormal, ${glConfig.refractionRatio} );
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `#version 300 es
			precision highp float;
			precision highp int;

			layout(location = 0) out vec4 pc_FragColor;
			layout(location = 1) out vec4 xColor;

			uniform samplerCube envMap;
			uniform float flipEnvMap;
			uniform float whiteAlpha;
			uniform vec2 lod;

			in vec3 vReflect;
			in vec3 vRefract;`

			// ${glx.mixColorT(vparas.shaderAlpha)}
			+ `
			void main () {
				vec4 envColor = texture( envMap, vec3( flipEnvMap * vReflect.x, vReflect.yz ), lod.y );
				vec4 envColorRefract = texture( envMap, vec3( flipEnvMap * vRefract.x, vRefract.yz ), lod.x );
				pc_FragColor = vec4( mix(envColor.xyz, envColorRefract.xyz, whiteAlpha), 1. );
				xColor = pc_FragColor;
			}
			`.replaceAll(/\n\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

export function envMapMrt() {
	return {
		vertexShader: `#version 300 es

			uniform mat4 modelViewMatrix;
			uniform mat4 modelMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;
			uniform vec3 cameraPosition;

			in vec3 position;
			in vec3 normal;
			in vec2 uv;

			out vec3 vReflect;
			out vec3 vRefract;

			${glx.revertNormal()}

			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);

				gl_Position = projectionMatrix * viewMatrix * worldPosition;

				vec3 worldNormal = revertNormal(normal);
				vec3 I = normalize( worldPosition.xyz - cameraPosition );
				vReflect = reflect( I, worldNormal );
				vRefract = refract( I, worldNormal, ${glConfig.refractionRatio} );
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `#version 300 es
			precision highp float;
			precision highp int;

			layout(location = 0) out vec4 gColor;
			layout(location = 1) out vec4 gNormal;

			uniform samplerCube envMap;
			uniform float flipEnvMap;
			uniform float whiteAlpha;
			uniform vec2 lod;

			in vec3 vReflect;
			in vec3 vRefract;

			void main () {
				vec4 envColor = texture( envMap, vec3( flipEnvMap * vReflect.x, vReflect.yz ), lod.y );
				vec4 envColorRefract = texture( envMap, vec3( flipEnvMap * vRefract.x, vRefract.yz ), lod.x );
				gColor = vec4( mix(envColor.xyz, envColorRefract.xyz, whiteAlpha), 1. );
				gNormal.rgb = gColor.gbr;
			}
			`.replaceAll(/\n\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	}
}

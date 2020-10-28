
import {glx, glConfig, initPhongUni, updatePhongUni} from './glx.glsl';

/**Sampling envMap for test, try.
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

		vertexShader: `
			varying vec3 vReflect;
			varying vec3 vRefract;

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

		fragmentShader: `
			uniform samplerCube envMap;
			uniform float flipEnvMap;
			uniform float whiteAlpha;
			uniform vec2 lod;

			varying vec3 vReflect;
			varying vec3 vRefract;`

			// ${glx.mixColorT(vparas.shaderAlpha)}
			+ `
			void main () {
				vec4 envColor = textureCube( envMap, vec3( flipEnvMap * vReflect.x, vReflect.yz ), lod.y );
				vec4 envColorRefract = textureCube( envMap, vec3( flipEnvMap * vRefract.x, vRefract.yz ), lod.x );
				gl_FragColor = vec4( mix(envColor.xyz, envColorRefract.xyz, whiteAlpha), 1. );
			}
			`.replaceAll(/\n\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

export function envMapMrt() {
	return {
		vertexShader: `#version 300 es

			in vec3 position;
			in vec3 normal;
			in vec2 uv;
			uniform mat4 modelViewMatrix;
			uniform mat4 modelMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;
			uniform vec3 cameraPosition;

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
				// vec4 envColor = texture( envMap, vec3( flipEnvMap * vReflect.x, vReflect.yz ), lod.y );
				vec4 envColor = vec4(vReflect.x, 2., 0.5, 1.);
				vec4 envColorRefract = texture( envMap, vec3( flipEnvMap * vRefract.x, vRefract.yz ), lod.x );
				gColor = vec4( mix(envColor.xyz, envColorRefract.xyz, whiteAlpha), 1. );
				gNormal.rgb = gColor.gbr;
			}
			`.replaceAll(/\n\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	}
}


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

		vertexShader: (`#version 300 es
			uniform vec3 cameraPosition;
			uniform mat4 modelMatrix;
			uniform mat4 modelViewMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;

			in vec3 position;
			in vec3 normal;

			out vec4 vP;
			out vec3 vNormal;
			out vec3 vRefract;

			${glx.revertNormal()}
			${glx.bokehDepth.v}

			void main() {
				vP = modelMatrix * vec4(position, 1.0);

				gl_Position = projectionMatrix * viewMatrix * vP;

				vNormal = revertNormal(normal);
				vec3 I = normalize( vP.xyz - cameraPosition );
				vRefract = refract( I, vNormal, ${glConfig.refractionRatio} );
				bokehDepth();
			}`)
		.replaceAll(/\n\t\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `${glx.mrt.f_layout}
			#define RECIPROCAL_PI 0.3183098861837907
			#define RECIPROCAL_PI2 0.15915494309189535

			uniform vec3 cameraPosition;
			uniform float u_exposure;
			uniform sampler2D envMap;
			uniform float flipEnvMap;
			uniform float whiteAlpha;
			uniform vec2 lod;

			in vec4 vP;
			in vec3 vNormal;
			in vec3 vRefract;

			${glx.bokehDepth.f}
			${glx.equirectUv}
			${glx.threshold}

			void main() {
				vec3 i = normalize( vP.xyz - cameraPosition );
				vec3 reflct = reflect( i, normalize(vNormal) );
				vec3 wdir = normalize ( vec3 ( flipEnvMap * reflct.x, reflct.yz ) );
				vec2 sampleUV = equirectUv( wdir, RECIPROCAL_PI, RECIPROCAL_PI2 );
				vec4 envReflect = texture( envMap, sampleUV, lod.y );

				wdir = normalize( vec3( flipEnvMap * vRefract.x, vRefract.yz ) );
				sampleUV = equirectUv( wdir, RECIPROCAL_PI, RECIPROCAL_PI2 );
				vec4 envRefrect = texture( envMap, sampleUV, lod.x );

				pc_FragColor.xyz = mix( envReflect.xyz, envRefrect.xyz, whiteAlpha )
									* u_exposure;
				pc_FragColor.a = 1.;
				xColor = pc_FragColor;
				xEnvSpecular += threshold( pc_FragColor );
				xBokehDepth = bokehDepth();
			}
		`.replaceAll(/\n\t\t\t/g, '\n')
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
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;

			in vec3 position;
			in vec3 normal;
			in vec2 uv;

			out vec3 vReflect;
			out vec3 vRefract;

			${glx.revertNormal()}
			${glx.bokehDepth.v}

			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);

				gl_Position = projectionMatrix * viewMatrix * worldPosition;

				vec3 worldNormal = revertNormal(normal);
				vec3 I = normalize( worldPosition.xyz - cameraPosition );
				vReflect = reflect( I, worldNormal );
				vRefract = refract( I, worldNormal, ${glConfig.refractionRatio} );
				bokehDepth();
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `${glx.mrt.f_layout}
			uniform samplerCube envMap;
			uniform float flipEnvMap;
			uniform float whiteAlpha;
			uniform vec2 lod;

			in vec3 vReflect;
			in vec3 vRefract;

			${glx.threshold}
			${glx.bokehDepth.f}

			void main () {
				vec4 envColor = texture( envMap, vec3( flipEnvMap * vReflect.x, vReflect.yz ), lod.y );
				vec4 envColorRefract = texture( envMap, vec3( flipEnvMap * vRefract.x, vRefract.yz ), lod.x );
				pc_FragColor = vec4( mix(envColor.xyz, envColorRefract.xyz, whiteAlpha), 1. );
				xColor = pc_FragColor;
				xEnvSpecular = threshold(pc_FragColor);
				xBokehDepth = bokehDepth();
			}
			`.replaceAll(/\n\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

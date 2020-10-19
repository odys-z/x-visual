
import {glx, glConfig, initPhongUni, updatePhongUni} from './glx.glsl';

/**Render prism extruded from xz polygon, with texture on roof and leteral faces.
 * @see glx.boxLayers for a try to shade building floor without the floor texture.
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

			varying vec3 vReflect;
			varying vec3 vRefract;`

			// ${glx.mixColorT(vparas.shaderAlpha)}
			+ `
			void main () {
				vec4 envColor = textureCube( envMap, vec3( flipEnvMap * vReflect.x, vReflect.yz ), 1. );
				vec4 envColorRefract = textureCube( envMap, vec3( flipEnvMap * vRefract.x, vRefract.yz ) );
				gl_FragColor = vec4( mix(envColor.xyz, envColorRefract.xyz, whiteAlpha), 1. );
			}
			`.replaceAll(/\n\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

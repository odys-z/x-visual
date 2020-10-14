
import {glx, initPhongUni, updatePhongUni} from './glx.glsl';

/**Render prism extruded from xz polygon, with texture on roof and leteral faces.
 * @see glx.boxLayers for a try to shade building floor without the floor texture.
 * @param {object=} vparas Visual.paras
 * @param {opbject=} vparas.tile tile texture parameters, see test for examples
 * @member xglsl.texPrism
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
		vertexShader: `
			uniform float refractionRatio;

			varying vec3 vReflect;
			varying vec3 vRefract;

			${glx.revertNormal()}

			void main() {
				vec4 worldPosition = modelMatrix * vec4(position, 1.0);

				gl_Position = projectionMatrix * viewMatrix * worldPosition;

				// vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
				vec3 worldNormal = revertNormal(normal);
				vec3 I = normalize( worldPosition.xyz - cameraPosition );
				vReflect = reflect( I, worldNormal );
				vRefract = refract( I, worldNormal, refractionRatio );
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `
			uniform samplerCube envMap;

			varying vec3 vReflect;
			varying vec3 vRefract;

			${glx.mixColorT(vparas.shaderAlpha)}

			void main () {
				// vec3 reflectVec = vReflect;
				// vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );

				vec4 envColor = textureCube( envMap, vReflect );
				gl_FragColor = vec4( envColor.xyz, 0.8 );
				gl_FragColor.g = vReflect.g;
			}
			`.replaceAll(/\n\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

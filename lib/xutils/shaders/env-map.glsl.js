
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
		vertexShader: `
			uniform float refractionRatio;

			varying vec3 vReflect;
			varying vec3 vRefract;

			main() {
    			vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    			gl_Position = projectionMatrix * viewMatrix * worldPosition;

				vec3 I = normalize( worldPosition.xyz - cameraPosition );
				vReflect = reflect( I, worldNormal );
				vRefract = refract( I, worldNormal, refractionRatio );
			}
		`.replaceAll(/^\t\t/, '').replaceAll(/\t/g, '  '),

		fragmentShader: `
			uniform samplerCube envMap;
			
			varying vec3 vReflect;
			varying vec3 vRefract;

			${glx.mixColorT(vparas.shaderAlpha)}

			main () {
				// vec3 reflectVec = vReflect;
				// vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
				vec4 envColor = textureCube( envMap, vReflect ) );
				gl_FragColor = vec4( envColor, 0.5 );
			}`
			.replaceAll(/^\t\t/, '').replaceAll(/\t/g, '  '),
	}

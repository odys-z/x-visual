
import {glx, initPhongUni, updatePhongUni} from './glx.glsl';

/**Render prism extruded from xz polygon, with texture on roof and leteral faces,
 * accepting shadow and envMap.
 * @param {object=} vparas Visual.paras
 * @member xglsl.texEnv
 * @function
 *  */
export function texEnv(vparas = {}) {
	// Design Note: This is a good example of packing geometry information into shader
 	var uv_vert = vparas.uvScale ? `(uv * vec2(float(${vparas.uvScale[0]}), float(${vparas.uvScale[1]})))` : '(uv)';

	// shadow
	var receiveShadow = vparas.dirShadow;

	const roofAlpha = `(float(${vparas.whiteAlphas ? vparas.whiteAlphas[0] : 0.7}))`;
	const sideAlpha = `(float(${vparas.whiteAlphas ? vparas.whiteAlphas[1] : 0.9}))`;

	const n_dirLight = '1';

	return { fragmentShader: `
		uniform sampler2D u_tex0, u_tex1;

		uniform samplerCube envMap;
		uniform float flipEnvMap;
		uniform float u_exposure;

		uniform float u_texWeight;
		uniform vec4  u_color; // diffuse
		uniform float u_shininess;
		uniform vec3  u_ambientColor;
		uniform vec3  u_specularColor;
		uniform vec3  u_lightPos;

		varying vec3 vReflect;
		varying vec3 vRefract;

		varying vec4 vP;
		varying vec3 vNormal;
		varying vec3 vIntense;

		varying vec2 vUv;

		${glx.mixColorT(vparas.shaderAlpha)}
		${glx.fractuv}

		${glx.phongLight}

		${!receiveShadow ? '' : glx.shadow.frag}
		${glx.envMap}

		void main() {
			float alp = roofAlpha;
			// roof
			if (vxzWeight > 0.9) {
				gl_FragColor = texture2D( u_tex0, vUv );
			}
			// wall - TODO fractuvw(vUvw)
			else {
				gl_FragColor = texture2D( u_tex1, fractuv(vUv) );
				alp = sideAlpha;
			}

			gl_FragColor = phongLight(vNormal, u_lightPos, cameraPosition, vP,
					u_ambientColor.xyz, diffuseColor, u_specularColor.xyz, u_shininess);

			vec4 envColor = textureCube( envMap, vec3( flipEnvMap * vReflect.x, vReflect.yz ) );
			vec3 toneColr = mixColorT(gl_FragColor.xyz, envColor, alp) * vIntense;

			${!receiveShadow ? '' : 'toneColr *= shadow();'}

			gl_FragColor.xyz = reinhardTone(toneColr, u_exposure);
		}`,

	// a_box - xz: floor size, y: floor height ( layer's offset )
	// a_loc - prism center in model, y: height
	vertexShader: `
		uniform float u_shininess;
		uniform vec4 u_color; // diffuse color
		uniform vec3 u_ambientColor;
		uniform vec3 u_specularColor;
		uniform vec3 u_lightColor;
		uniform vec3 u_lightPos;
		uniform float u_lightIntensity;
		${glx.u_alpha}
		uniform mat4 directionalShadowMatrix[ ${n_dirLight} ];

		attribute vec3 a_box;
		attribute vec2 a_tiles; // x-div, z-div
		attribute vec3 a_loc;

		varying vec2 vUv;

		varying vec3 vReflect;
		varying vec3 vRefract;

		varying vec4 vP;
		varying vec3 vNormal;
		varying vec3 vIntense;

		${glx.revertNormal()}

		${glx.phongLight}
		${!receiveShadow ? '' : glx.shadow.setShadowCoords(1)}

		void main() {
			vUv = ${uv_vert};
			vec4 vP = modelMatrix * vec4(position, 1.0);

			vec3 vNormal = revertNormal(normal);
			vec3 I = normalize( vP.xyz - cameraPosition );
			vReflect = reflect( I, vNormal );
			vRefract = refract( I, vNormal, ${glConfig.refractionRatio} );
			vIntense = intenseAlpha(u_lightIntensity);

			gl_Position = projectionMatrix * viewMatrix * vP;

			${!receiveShadow ? '' : 'setShadowCoords(directionalShadowMatrix, vP)'};
		} `
		.replaceAll(/\n\t/g, '\n').replace(/\t/g, '  ');
	}
}

texEnv.initUniform = initPhongUni;
texEnv.updateUniform = updatePhongUni;

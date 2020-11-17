
import {glx, glConfig, initPhongUni, updatePhongUni} from './glx.glsl';

/**Render prism extruded from xz polygon, with texture on roof and leteral faces,
 * accepting shadow and envMap.
 * @param {object=} vparas Visual.paras
 * @member xglsl.texEnv
 * @function
 *  */
export function texEnv(vparas = {}) {
	// Design Note: This is a good example of packing geometry information into shader
 	var vuv_vert = vparas.uvScale ? `(vUv * vec2(float(${vparas.uvScale[0]}), float(${vparas.uvScale[1]})))` : '(vUv)';

	// shadow
	var receiveShadow = vparas.dirShadow;

	const roofAlpha = `float(${vparas.whiteAlphas ? vparas.whiteAlphas[0] : 0.5})`;
	const sideAlpha = `float(${vparas.whiteAlphas ? vparas.whiteAlphas[1] : 0.5})`;

	const n_dirLight = '1';

	return { fragmentShader: `
		${glx.u_alpha}
		uniform sampler2D u_tex0, u_tex1, u_tex3;
		uniform sampler2D u_texNoise;

		uniform samplerCube envMap;
		uniform float flipEnvMap;
        uniform vec2 lod;
		uniform float u_exposure;

		uniform float u_texWeight;
		uniform vec2  u_texbump;
		uniform vec4  u_color; // diffuse
		uniform float u_shininess;
		uniform vec3  u_ambientColor;
		uniform vec3  u_specularColor;
		uniform vec3  u_lightPos;

		varying vec3 vRefract;

		varying vec4 vP;
		varying vec3 vNormal;
		varying float vIntense;
		varying float vxzWeight;

		varying vec2 vUv;

		${glx.mixColorT(vparas.shaderAlpha)}
		${glx.fractuv}
        ${glx.fresnel}

		${glx.bsdfGGX}

		${glx.phongLight}
		${glx.reinhardTone}

		${!receiveShadow ? '' : glx.shadow.frag}

		${glx.tex.bump}

		void main() {

			float bmp;
			float lodxy;
			float white; `
			// roof
			+ `
			if (vxzWeight > 0.9) {
				gl_FragColor = texture2D( u_tex0, fractuv(vUv) );
				white = ${roofAlpha};
				lodxy = lod.x;
				bmp = bump(u_tex0, fractuv(vUv), vec4(-0.7, 0.2, 0.7, u_texbump.x)) / vP.w;
			}`
			// wall - TODO fractuvw(vUvw), side tex pre face
			+ `
			else {
				gl_FragColor = texture2D( u_tex1, fractuv(${vuv_vert}) );
				white = ${sideAlpha};
				lodxy = lod.y;
				bmp = bump(u_tex1, fractuv(vUv), vec4(-0.7, 0.2, 0.7, u_texbump.y)) / vP.w;
			}
			`// shall we use both phong & BSDF?
			+ `
			gl_FragColor = phongLight(vNormal, u_lightPos, cameraPosition, vP.xyz,
					u_ambientColor.xyz, gl_FragColor.xyz, u_specularColor.xyz, u_shininess);

			gl_FragColor.xyz *= bmp;

			vec3 i = cameraPosition - vP.xyz;
			vec3 v = reflect( -i , vNormal ) + bmp * 4.5;
			vec4 envColor = textureCube( envMap, vec3( flipEnvMap * v.x, v.yz ),
							fresnel( v, i, lodxy ) + bmp * 4.5);

			envColor.xyz = bsdfGGX(v, i, vNormal, envColor.xyz, lodxy/(1. + lodxy));

			vec3 toneColr = mixColorT ( gl_FragColor.xyz * vIntense,
										reinhardTone(envColor.xyz, u_exposure), white);
			`// FIXME but directional shadow is different from env shadow.
			+ `
			${receiveShadow ? 'gl_FragColor.xyz = toneColr * shadow();' : 'gl_FragColor.xyz = toneColr;'}
		}
		`.replaceAll(/\n\t/g, '\n').replaceAll(/\t/g, '  '),

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
		uniform mat4 directionalShadowMatrix[ ${n_dirLight} ];

		attribute vec3 a_box;
		attribute vec2 a_tiles; // x-div, z-div
		attribute vec3 a_loc;

		varying vec2 vUv;

		varying vec3 vRefract;

		varying vec4 vP;
		varying vec3 vNormal;
		varying float vIntense;
		varying float vxzWeight;

		${glx.revertNormal()}

		${glx.intenseAlpha}
		${!receiveShadow ? '' : glx.shadow.setShadowCoords(1)}
		void main() {
			vUv = uv;
			vxzWeight = dot(vec3(0., 1., 0.), normal);
			vP = modelMatrix * vec4(position, 1.0);
			vNormal = revertNormal(normal);

			vec3 I = normalize( vP.xyz - cameraPosition );
			vRefract = refract( I, vNormal, ${glConfig.refractionRatio} );
			vIntense = intenseAlpha(u_lightIntensity);

			gl_Position = projectionMatrix * viewMatrix * vP;

			${!receiveShadow ? '' : 'setShadowCoords(directionalShadowMatrix, vP)'};
		} `
		.replaceAll(/\n\t/g, '\n').replace(/\t/g, '  ')
	}
}

texEnv.initUniform = initPhongUni;
texEnv.updateUniform = updatePhongUni;

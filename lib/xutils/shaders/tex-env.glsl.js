
import {glx, glConfig, initPhongUni, updatePhongUni} from './glx.glsl';

/**Render prism extruded from xz polygon, with texture on roof and leteral faces,
 * accepting shadow and envMap.
 * @param {object=} vparas Visual.paras
 * @member xglsl.texEnv
 * @function
 *  */
//////////////////////               try
export function texEnv(vparas = {}) {
	// Design Note: This is a good example of packing geometry information into shader
 	let vuv_vert = vparas.uvScale ? `(vUv * vec2(float(${vparas.uvScale[0]}), float(${vparas.uvScale[1]})))` : '(vUv)';

	// shadow
	let receiveShadow = vparas.dirShadow;

	const roofAlpha = `float(${vparas.whiteAlphas ? vparas.whiteAlphas[0] : 0.5})`;
	const sideAlpha = `float(${vparas.whiteAlphas ? vparas.whiteAlphas[1] : 0.5})`;

	const n_dirLight = '1';

	const texscl = vparas.texScale || 1;

	return {
		fragmentShader: (`${glx.mrt.f_layout}
			#define RECIPROCAL_PI 0.3183098861837907
			#define RECIPROCAL_PI2 0.15915494309189535

			uniform vec3 cameraPosition;
			uniform sampler2D envMap;
			${glx.u_alpha}
			uniform sampler2D u_tex0, u_tex1, u_tex3;
			uniform sampler2D u_texNoise;

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


			in vec4 vP;
			in vec2 vUv;
			in vec3 vwDir;
			in vec3 vNormal;
			in float vIntense;
			in float vxzWeight;
			in vec3 vRefract;

			${glx.mixColorT(vparas.shaderAlpha)}
			${glx.fractuv}
			${glx.equirectUv}
			${glx.fSchlick}
			${glx.phongLight}
			${glx.reinhardTone}
			${glx.threshold}
			${glx.bokehDepth.f}

			${!receiveShadow ? '' : glx.shadow.frag}

			float bump(sampler2D texBump, vec2 uv, vec4 scale) {
				vec4 col = texture(texBump, uv);
				float lum = dot(col.xyz, vNormal);
				vec3  nor = normalize( vec3( dFdx(lum), 0.1, dFdy(lum) ) );
				// return clamp( 0.5 + 1.5 * dot(nor.xyz, scale.xyz * -scale.w), 0.0, 1.0 );
				return clamp( 1.5 * dot(nor.xyz, scale.xyz * -scale.w), -0.5, 0.5 );
			}

			float bumpSmooth(sampler2D texBump, vec2 uv, vec4 scale) {
				vec4 col = texture(texBump, uv);
				float lum = dot(col.xyz, vec3(0.333));
				vec3  nor = normalize( vec3( dFdx(lum), scale.y, dFdy(lum) ) );
				// return clamp( 0.5 + 1.5 * dot(nor.xyz, scale.xyz * -scale.w), 0.0, 1.0 );
				return clamp( 1.5 * dot(nor.xyz, scale.xyz * -scale.w), -0.5, 0.5 );
			}

			void main() {

				float bmp;
				float lodxy;
				float white; `
				+ // roof
				`if (vxzWeight > 0.9) {
					pc_FragColor = texture( u_tex0, fractuv(vUv) );
					white = ${roofAlpha};
					lodxy = lod.x; `
					// bmp = bump(u_tex0, fractuv(vUv), vec4(-0.7, 0.2, 0.7, u_texbump.x)) * vP.w;
					// p.w: http://glprogramming.com/red/appendixf.html
					+ `
					bmp = bumpSmooth(u_tex0, fractuv(vUv), vec4(-0.7, 0.2 / (1. + u_texbump.x), 0.7, u_texbump.x)) * vP.w;
				}`
				+ // wall
				`else {
					pc_FragColor = texture( u_tex1, fractuv(${vuv_vert}) );
					white = ${sideAlpha};
					lodxy = lod.y;
					bmp = bump(u_tex1, fractuv(vUv), vec4(-0.7, 0.2, 0.7, u_texbump.y)) * vP.w;
					// bmp = bumpSmooth(u_tex1, fractuv(vUv), vec4(-0.7, 0.2 / (1. + u_texbump.y), 0.7, u_texbump.y)) * vP.w;
				}

				vec3 i = cameraPosition - vP.xyz;
				vec3 rit = cross(normalize(i), vNormal);
				vec3 v = normalize( reflect( -i , vNormal ) - rit * bmp * vP.w );` // needing vp.w again for rit is normalized
				+ `
				float rough = lodxy / (1. + lodxy);

				pc_FragColor = phongLight(vNormal, u_lightPos, cameraPosition, vP.xyz,
						u_ambientColor.rgb * pc_FragColor.rgb, pc_FragColor.rgb * u_color.rgb,
						u_specularColor.rgb, u_shininess, rough);

				vec2 equv = equirectUv( vec3( flipEnvMap * v.x, v.yz ), RECIPROCAL_PI, RECIPROCAL_PI2 );
				vec4 envColor = textureLod( envMap, equv, lodxy);
				envColor.xyz = fSchlick(envColor.xyz, v, i, rough);

				vec3 toneColr = mixColorT ( pc_FragColor.xyz * vIntense,
											reinhardTone(envColor.xyz, u_exposure),
											white );
				`// FIXME but directional shadow is different from env shadow.
				+ `
				${receiveShadow ? 'pc_FragColor.xyz = toneColr * shadow();' : 'pc_FragColor.xyz = toneColr;'}
				xColor.rgb = mixColorT( pc_FragColor.xyz * vIntense,
									envColor.xyz * u_exposure,
									white );
				xColor.a = pc_FragColor.a;
				xEnvSpecular = threshold(pc_FragColor);

				xBokehDepth = bokehDepth();
			}`)
			.replaceAll(/\n\t\t\t/g, '\n').replaceAll(/\t/g, '  '),

		// a_box - w, h, scale
		// a_loc - prism center in model, y: height
		vertexShader: (`#version 300 es
			precision highp float;
			uniform mat4 modelMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;

			uniform vec3 cameraPosition;
			uniform float u_shininess;
			uniform vec4 u_color; // diffuse color
			uniform vec3 u_ambientColor;
			uniform vec3 u_specularColor;
			uniform vec3 u_lightColor;
			uniform vec3 u_lightPos;
			uniform float u_lightIntensity;
			uniform mat4 directionalShadowMatrix[ ${n_dirLight} ];

			in vec2 uv;
			in vec3 normal;
			in vec3 position;
			in vec3 a_box;

			out vec2 vUv;
			out vec3 vRefract;
			out vec4 vP;
			out vec3 vNormal;
			out vec3 vwDir;
			out float vIntense;
			out float vxzWeight;

			${glx.revertNormal()}
			${glx.transformDirection}
			${!receiveShadow ? '' : glx.shadow.setShadowCoords(1)}
			${glx.bokehDepth.v}

			void main() {
				vUv = ${texscl > 0 ? `uv * a_box.xy / (a_box.z == 0. ? 1. : a_box.z * float(${texscl}))` : 'uv'};
				vxzWeight = dot(vec3(0., 1., 0.), normal);
				vP = modelMatrix * vec4(position, 1.0);
				// vNormal = revertNormal(normalize(normal));
				vNormal = normalize(normal);
				vwDir = transformDirection( position, modelMatrix );

				vec3 I = normalize( vP.xyz - cameraPosition );
				vRefract = refract( I, vNormal, ${glConfig.refractionRatio} );
				vIntense = u_lightIntensity;

				gl_Position = projectionMatrix * viewMatrix * vP;

				${!receiveShadow ? '' : 'setShadowCoords(directionalShadowMatrix, vP)'};
				bokehDepth();
			}`)
			.replaceAll(/\n\t\t\t/g, '\n').replace(/\t/g, '  ')
	}
}

export function texEnv_back(vparas = {}) {
	// Design Note: This is a good example of packing geometry information into shader
 	let vuv_vert = vparas.uvScale ? `(vUv * vec2(float(${vparas.uvScale[0]}), float(${vparas.uvScale[1]})))` : '(vUv)';

	// shadow
	let receiveShadow = vparas.dirShadow;

	const roofAlpha = `float(${vparas.whiteAlphas ? vparas.whiteAlphas[0] : 0.5})`;
	const sideAlpha = `float(${vparas.whiteAlphas ? vparas.whiteAlphas[1] : 0.5})`;

	const n_dirLight = '1';

	const texscl = vparas.texScale || 1;

	return {
		fragmentShader: (`${glx.mrt.f_layout}
			#define RECIPROCAL_PI 0.3183098861837907
			#define RECIPROCAL_PI2 0.15915494309189535

			uniform vec3 cameraPosition;
			uniform sampler2D envMap;
			${glx.u_alpha}
			uniform sampler2D u_tex0, u_tex1, u_tex3;
			uniform sampler2D u_texNoise;

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


			in vec4 vP;
			in vec2 vUv;
			in vec3 vwDir;
			in vec3 vNormal;
			in float vIntense;
			in float vxzWeight;
			in vec3 vRefract;

			${glx.mixColorT(vparas.shaderAlpha)}
			${glx.fractuv}
			${glx.equirectUv}
			${glx.fSchlick}
			${glx.phongLight}
			${glx.reinhardTone}
			${glx.threshold}
			${glx.bokehDepth.f}

			${!receiveShadow ? '' : glx.shadow.frag}

			float bump(sampler2D texBump, vec2 uv, vec4 scale) {
				vec4 col = texture(texBump, uv);
				float lum = dot(col.xyz, vNormal);
				vec3  nor = normalize( vec3( dFdx(lum), 0.1, dFdy(lum) ) );
				return clamp( 0.5 + 1.5 * dot(nor.xyz, scale.xyz * -scale.w), 0.0, 1.0 );
			}

			float bumpSmooth(sampler2D texBump, vec2 uv, vec4 scale) {
				vec4 col = texture(texBump, uv);
				float lum = dot(col.xyz, vec3(0.333));
				vec3  nor = normalize( vec3( dFdx(lum), scale.y, dFdy(lum) ) );
				return clamp( 0.5 + 1.5 * dot(nor.xyz, scale.xyz * -scale.w), 0.0, 1.0 );
			}

			void main() {

				float bmp;
				float lodxy;
				float white; `
				+ // roof
				`if (vxzWeight > 0.9) {
					pc_FragColor = texture( u_tex0, fractuv(vUv) );
					white = ${roofAlpha};
					lodxy = lod.x; `
					// bmp = bump(u_tex0, fractuv(vUv), vec4(-0.7, 0.2, 0.7, u_texbump.x)) * vP.w;
					// p.w: http://glprogramming.com/red/appendixf.html
					+ `
					bmp = bumpSmooth(u_tex0, fractuv(vUv), vec4(-0.7, 0.2 / (1. + u_texbump.x), 0.7, u_texbump.x)) * vP.w;
				}`
				+ // wall
				`else {
					pc_FragColor = texture( u_tex1, fractuv(${vuv_vert}) );
					white = ${sideAlpha};
					lodxy = lod.y;
					// bmp = bump(u_tex1, fractuv(vUv), vec4(-0.7, 0.2, 0.7, u_texbump.y)) * vP.w;
					bmp = bumpSmooth(u_tex1, fractuv(vUv), vec4(-0.7, 0.2 / (1. + u_texbump.y), 0.7, u_texbump.y)) * vP.w;
				}

				vec3 i = cameraPosition - vP.xyz;
				vec3 rit = cross(i, vNormal);
				vec3 v = normalize( reflect( -i , vNormal ) ); // - rit * bmp ); // * vP.w );
				float rough = lodxy / (1. + lodxy);

				pc_FragColor = phongLight(vNormal, u_lightPos, cameraPosition, vP.xyz,
						u_ambientColor.rgb * pc_FragColor.rgb, pc_FragColor.rgb * u_color.rgb,
						u_specularColor.rgb, u_shininess, rough);

				vec2 equv = equirectUv( vec3( flipEnvMap * v.x, v.yz ), RECIPROCAL_PI, RECIPROCAL_PI2 );
				vec4 envColor = textureLod( envMap, equv, lodxy);
				envColor.xyz = fSchlick(envColor.xyz, v, i, 0.);

				vec3 toneColr = mixColorT ( pc_FragColor.xyz * vIntense,
											reinhardTone(envColor.xyz, u_exposure),
											white );
				`// FIXME but directional shadow is different from env shadow.
				+ `
				${receiveShadow ? 'pc_FragColor.xyz = toneColr * shadow();' : 'pc_FragColor.xyz = toneColr;'}
				xColor.rgb = mixColorT( pc_FragColor.xyz * vIntense,
									envColor.xyz * u_exposure,
									white );
				xColor.a = pc_FragColor.a;
				xEnvSpecular = threshold(pc_FragColor);

				xBokehDepth = bokehDepth();
			}`)
			.replaceAll(/\n\t\t\t/g, '\n').replaceAll(/\t/g, '  '),

		// a_box - w, h, scale
		// a_loc - prism center in model, y: height
		vertexShader: (`#version 300 es
			precision highp float;
			uniform mat4 modelMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;

			uniform vec3 cameraPosition;
			uniform float u_shininess;
			uniform vec4 u_color; // diffuse color
			uniform vec3 u_ambientColor;
			uniform vec3 u_specularColor;
			uniform vec3 u_lightColor;
			uniform vec3 u_lightPos;
			uniform float u_lightIntensity;
			uniform mat4 directionalShadowMatrix[ ${n_dirLight} ];

			in vec2 uv;
			in vec3 normal;
			in vec3 position;
			in vec3 a_box;

			out vec2 vUv;
			out vec3 vRefract;
			out vec4 vP;
			out vec3 vNormal;
			out vec3 vwDir;
			out float vIntense;
			out float vxzWeight;

			${glx.revertNormal()}
			${glx.transformDirection}
			${!receiveShadow ? '' : glx.shadow.setShadowCoords(1)}
			${glx.bokehDepth.v}

			void main() {
				vUv = ${texscl > 0 ? `uv * a_box.xy / (a_box.z == 0. ? 1. : a_box.z * float(${texscl}))` : 'uv'};
				vxzWeight = dot(vec3(0., 1., 0.), normal);
				vP = modelMatrix * vec4(position, 1.0);
				// vNormal = revertNormal(normalize(normal));
				vNormal = normalize(normal);
				vwDir = transformDirection( position, modelMatrix );

				vec3 I = normalize( vP.xyz - cameraPosition );
				vRefract = refract( I, vNormal, ${glConfig.refractionRatio} );
				vIntense = u_lightIntensity;

				gl_Position = projectionMatrix * viewMatrix * vP;

				${!receiveShadow ? '' : 'setShadowCoords(directionalShadowMatrix, vP)'};
				bokehDepth();
			}`)
			.replaceAll(/\n\t\t\t/g, '\n').replace(/\t/g, '  ')
	}
}

texEnv.initUniform = initPhongUni;
texEnv.updateUniform = updatePhongUni;

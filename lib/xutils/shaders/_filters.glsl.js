
import { glx, glConfig } from './glx.glsl';

import { BokehShader } from '../../../packages/three/shaders/BokehShader2';

/**Filter: horizontal/tripod blur, depth bokeh, lens flare, ...
 * <p>Reference</p>
 * <ol>
 * 	<li><a href='https://www.shadertoy.com/view/lt3fzN'>ShaderToy Simple Blur</a></li>
 * </ol>
 * @param {object=} xwparas xworld options
 * @param {object=} xwparas.light
 * @param {object=} xwparas.camera
 * @param {object=} wparas.finalQuad
 * @param {bool=} debug show quad color
 * @member xglsl._filters
 * @function
 *  */
export function _filters(xwparas = {}, debug) {
	let r;
	let pLight = xwparas.light || {};
	let pCam = xwparas.camera || {};
	let pFinal = xwparas.finalQuad || {};

	let flaring = !!pLight.flare && pLight.flare !== 0;
	if (flaring) r = pLight.flare;

	let bokeh = pCam.bokeh > 0;
	let ssao = pFinal.ssao && pFinal.ssao.radius > 0 && pFinal.ssao.intense > 0;
	let debugSSAO = pFinal.ssao && pFinal.ssao.debug;

	let showFocus = pCam.showFocus;
	const n_dirLight = '1';

	return {
		vertexShader: `#version 300 es
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat4 directionalShadowMatrix[ ${n_dirLight} ];

			uniform vec3 u_campos;
			uniform vec3 u_camlook;

			in vec3 position;
			in vec2 uv;
			out vec2 vUv;
			${flaring ? `out vec4 vP_DirShadowCoord;` : ``}

			${flaring ? glx.vPShadow.setVpDirShadowcoord(n_dirLight) : ''}

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );`
				// FIXME u_camlook is not used in setVpDirShadowcoord()
				+ `
				${flaring ? `setVpDirShadowcoord(directionalShadowMatrix[0], u_campos, u_camlook);` : ``}
			}`
		.replaceAll(/\n\t\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: (`#version 300 es
			precision highp float;
			precision highp int;
			layout(location = 0) out vec4 xBlurColor;
			layout(location = 1) out vec4 xOutline;

			uniform float u_time;
			uniform float u_blurRadius;
			uniform float u_blurIntense;
			uniform sampler2D xFragColor;
			uniform sampler2D xColor;
			uniform sampler2D xEnvSpecular;
			uniform sampler2D xBokehDepth;
			uniform vec2 u_texsize;
			uniform sampler2D u_testex;

			uniform sampler2D u_noise;
			uniform vec2 u_flareUv; `// light reprojection
			+ `
			const float Pi2_3 = 6.28318530718 / 3.;
			const float _2Pi = 6.28318530718;
			const float Pi_10 = 0.628318530718;
			const float PI = 3.141592653589793;

			in vec2 vUv;

			${glx.threshold}
			${filters.blurTripod}
			${bokeh || ssao ? 'float us2;' : ''}
			${ssao ? filters.ssao : ''}
			${bokeh ? filters.bokeh.f(showFocus) : ''}
			${flaring ? filters.flare : ''}

			void main() {
				${flaring ?          `xBlurColor.rgb += flare( vUv, u_flareUv, u_noise, float(${r}), directionalLights[0].color );` : ''}
				${debug && flaring ? `xBlurColor.rgb += texture( directionalShadowMap[ 0 ], vUv ).rgb * 0.4;` : ''}

				${bokeh || ssao  ? 'us2 = texture(xBokehDepth, vUv).z;' : '' }
				${!debug && bokeh ? `
				vec4 bk = bokeh( xBokehDepth, xFragColor, vUv );
				xBlurColor.rgb += bk.rgb;
				vec4 xBloomColor = textureLod( xEnvSpecular, vUv, u_blurRadius * bk.a ) * u_blurIntense * 0.5;
				xBloomColor += textureLod( xEnvSpecular, vUv, u_blurRadius ) * u_blurIntense * 0.5;
				xBlurColor.rgb += xBloomColor.rgb;`
				 : `
				xBlurColor.rgb += texture( xFragColor, vUv).rgb;`
				// vec4 xBloomColor = textureLod( xEnvSpecular, vUv, u_blurRadius ) * u_blurIntense;
				+ `
				vec4 xBloomColor = blur( xEnvSpecular, vUv, u_blurRadius, u_texsize ) * u_blurIntense;
				xBlurColor.rgb += xBloomColor.rgb;` }

				${debug && bokeh ? 'xBlurColor = texture( xBokehDepth, vUv );'
								 : '' }
				${!debugSSAO && ssao  ? 'xBlurColor.rgb -= ssao( xBokehDepth, vUv );' : ''}
				${ debugSSAO ? 'xOutline = vec4(0., 0., ssao( xBokehDepth, vUv ), 1.);'
							 : '' }
				${debug ? 'xBlurColor.r += smoothstep(0.49, 0.51, vUv.x) * 0.2;' : ''}
				xOutline += vec4(0.0);
			}`)
			.replaceAll(/\n\t\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
			.replaceAll(/ +$/g, '')
			.replaceAll(/\n+/g, '\n')
	};
}

const filters = {
	blurH: `
		vec4 blur( in sampler2D tex, in vec2 uv, in float blurRadius, in vec2 texsize ) {
			vec2 blurSize = blurRadius / texsize;
			vec4 sum = vec4(0.);

			sum += textureLod(tex, vec2(uv.x - 4.0 * blurSize.x, uv.y), 4.) * 0.05;
			sum += textureLod(tex, vec2(uv.x - 3.0 * blurSize.x, uv.y), 4.) * 0.09;
			sum += textureLod(tex, vec2(uv.x - 2.0 * blurSize.x, uv.y), 4.) * 0.12;
			sum += textureLod(tex, vec2(uv.x - 1.0 * blurSize.x, uv.y), 4.) * 0.15;
			sum += textureLod(tex,      uv,                             4.) * 0.16;
			sum += textureLod(tex, vec2(uv.x + 1.0 * blurSize.x, uv.y), 4.) * 0.15;
			sum += textureLod(tex, vec2(uv.x + 2.0 * blurSize.x, uv.y), 4.) * 0.12;
			sum += textureLod(tex, vec2(uv.x + 3.0 * blurSize.x, uv.y), 4.) * 0.09;
			sum += textureLod(tex, vec2(uv.x + 4.0 * blurSize.x, uv.y), 4.) * 0.05;

			return sum;
		}`.replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '),

	/* Reference: https://www.shadertoy.com/view/Xltfzj
	*/
	blurTripod: (`
		const float thetaStep = 4.0;
		vec4 blur( in sampler2D tex, in vec2 uv, in float blurRadius, in vec2 texsize ) {
			vec2 r = blurRadius / texsize;

			vec4 blor = texture(tex, uv);
			if (blor.a == 0.) return blor;
			float lod = blurRadius * 1.2;

			for( float d = 0.0; d < _2Pi; d += _2Pi / thetaStep ) {
			    float intense = pow(d, 0.5);
			    blor += textureLod( tex, uv + vec2(cos(d), sin(d)) * r * d, lod * d) * intense;
			    blor += textureLod( tex, uv + vec2(cos(d + Pi2_3), sin( d + Pi2_3)) * r * d, lod * d) * intense;
			    blor += textureLod( tex, uv + vec2(cos(d - Pi2_3), sin( d - Pi2_3)) * r * d, lod * d) * intense;
			    if (blor.a == 0.) return blor;
			}
			blor /= (1. + blor);
			blor.a = 1.0;
			return max(blor, 0.);
		}`)
		.replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '),

	// https://www.shadertoy.com/view/XdfXRX
	flare: (`in float vflareIntense;
			${glx.vPShadow.frag}
			float ang_noise(float t, sampler2D u_noise) {
				return texture(u_noise, vec2(t, 0.0) / u_texsize).x;
			}
			float ang_noise(vec2 t, sampler2D u_noise) {
				return texture(u_noise, (t + vec2(u_time)) / u_texsize).x;
			}

			vec3 lensflare(vec2 uv, vec2 pos, sampler2D u_noise, float r) {
				vec2 main = uv - pos;
				vec2 uvd = uv * (length(uv));

				float ang = atan(main.y, main.x);
				float dist= length(main); dist = pow(dist,.1);
				float n = ang_noise(vec2((ang - u_time/9.0)*16.0,dist*32.0), u_noise);

				float f0 = 1.0 / (length(uv - pos) * 16.0 + 1.0);

				f0 = f0 + f0 * (sin((ang + u_time / 18.0 + ang_noise(abs(ang) + n / 2.0, u_noise) * 2.0) * 12.0) * .1 + dist * .1 + .8);
				float f2  = clamp(10.0 / (1.0 + 14.0 * pow(length(uvd * 14. + 02.8 * pos), 2.)), 0., .11) * 1.1;
				float f22 = clamp(10.0 / (1.0 + 16.0 * pow(length(uvd * 14. + 02.95 * pos), 2.)), .0, .11) * 1.05;
				float f23 = clamp(10.0 / (1.0 + 19.0 * pow(length(uvd * 15. + 03.1 * pos), 2.)), .0, .12) * 1.;

				vec2 uvx = mix(uv, uvd, -0.5);

				float f4  = max(0.01 - pow(length(uvx + 0.4 * pos), 2.4), .0) * 12.0;
				float f42 = max(0.01 - pow(length(uvx + 0.45* pos), 2.4), .0) * 10.0;
				float f43 = max(0.01 - pow(length(uvx + 0.5 * pos), 2.4), .0) * 8.0;

				uvx = mix(uv, uvd, -.4);

				float f5  = max(0.01 -pow(length(uvx + 0.2 * pos), 5.5), .0) * 2.0;
				float f52 = max(0.01 -pow(length(uvx + 0.4 * pos), 5.5), .0) * 2.0;
				float f53 = max(0.01 -pow(length(uvx + 0.6 * pos), 5.5), .0) * 2.0;

				uvx = mix(uv, uvd, -0.5);

				float f6  = max(0.01 - pow(length(uvx - 0.3  * pos), 2.1), .0) * 15.0;
				float f62 = max(0.01 - pow(length(uvx - 0.325* pos), 1.85), .0) * 9.0;
				float f63 = max(0.01 - pow(length(uvx - 0.35 * pos), 1.6), .0) * 8.0;

				vec3 c = vec3(.0);

				c.r += f2 + f4 + f5 + f6; c.g += f22 + f42 + f52 + f62; c.b += f23 + f43 + f53 + f63;
				c += vec3(f0 * r);

				return c;
			}

			vec3 flare(vec2 quadUv, vec2 lightUv, sampler2D texNoise, float r, vec3 hue) {
				vec3 f = lensflare(quadUv - 0.5, lightUv / 2., texNoise, r);
				return hue * f * vPShadow() * vflareIntense;
			}
		`).replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '),

	// three.js bokeh example: examples/jsm/shaders/BokehShader.js
	// vec3 color(vec2 coords,float blur);
	bokeh: glx.bokehFilter, // BokehShader.fragmentShader,

	// FIXME should bokehing also use this function?
	ssao: (`uniform float u_ssaoRadius;
		uniform float u_ssaoIntense;
		uniform float u_ssaoLOD;

		vec2 ssaoSampling( sampler2D depth, vec2 uv0, float theta, vec2 r, float lod, float e ) {
			float ao = 0.;
			float w = 0.;

			vec2 sampleuv = uv0 + vec2(cos(theta), sin(theta)) * r;
			float us_ = texture( depth, sampleuv ).z;
			if (us_ + 0.1 * e < us2 && us2 - us_ < e) {
				// ao = smoothstep(us_, us2, textureLod( depth, sampleuv, lod ).z - e );
				ao = smoothstep(0., e, textureLod( depth, sampleuv, lod ).z - us2 );
				w++;
			}

			sampleuv = uv0 + vec2(cos(theta + Pi2_3), sin( theta + Pi2_3)) * r;
			us_ = texture( depth, sampleuv ).z;
			if (us_ + 0.1 * e < us2 && us2 - us_ < e) {
				// ao += smoothstep(us_, us2, textureLod( depth, sampleuv, lod ).z - e );
				ao = smoothstep(0., e, textureLod( depth, sampleuv, lod ).z - us2 );
				w++;
			}

			sampleuv = uv0 + vec2(cos(theta - Pi2_3), sin( theta - Pi2_3)) * r;
			us_ = texture( depth, sampleuv ).z;
			if (us_ + 0.1 * e < us2 && us2 - us_ < e) {
				// ao += smoothstep(us_, us2, textureLod( depth, sampleuv, lod ).z - e );
				ao = smoothstep(0., e, textureLod( depth, sampleuv, lod ).z - us2 );
				w++;
			}
			return vec2(ao, w);
		}

		float ssao(sampler2D tex, vec2 uv) {
			float epsilon = 0.01 * max(0.0001, 1. - us2 * us2);
			float lod = u_ssaoLOD;
			vec2 r = u_ssaoRadius / u_texsize / max(0.03, us2);
			float us = 0.;
			float w  = 0.;
			float us_ = texture( tex, uv, lod ).z;
			if (us_ + 0.1 * epsilon < us2 && us2 - us_ < epsilon) {
				vec2 aov2;
				for (int i = 0; i < 5; i++) {
					float d = float(i) / 5. * Pi2_3;
					aov2 += ssaoSampling( tex, uv, d, r, lod * 0.1, epsilon );
				}
				return max(us2 - aov2.x/15., 0.) * u_ssaoIntense;
			}

			return 0.;
		}
		`).replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '),

	ssao_bak: (`uniform float u_ssaoRadius;
		uniform float u_ssaoIntense;
		float ssao(sampler2D tex, vec2 uv) {
			float epsilon = 0.01 * max(0.0001, us2 * us2);
			float lod = 4. / (1. + us2 * 3.); // 1 ~ 4
			vec2 r = u_ssaoRadius / u_texsize / max(0.01, us2);
			float d = -Pi_10;
			float us = 0.;
			float w = 0.;
			float us_ = texture( tex, uv, lod ).z;
			if (us_ < us2 && us2 - us_ < epsilon) {
				vec2 sampleuv = uv + vec2(cos(d), sin(d)) * r;
				us_ = texture( tex, sampleuv ).z;
				if (us_ < us2 && us2 - us_ < epsilon) {
					us += smoothstep(us_, us2, textureLod( tex, sampleuv, lod ).z - epsilon );
					w++;
				}

				sampleuv = uv + vec2(cos(d + Pi2_3), sin( d + Pi2_3)) * r;
				us_ = texture( tex, sampleuv ).z;
				if (us_ < us2 && us2 - us_ < epsilon) {
					us += smoothstep(us_, us2, textureLod( tex, sampleuv, lod ).z - epsilon );
					w++;
				}

				sampleuv = uv + vec2(cos(d - Pi2_3), sin( d - Pi2_3)) * r;
				us_ = texture( tex, sampleuv ).z;
				if (us_ < us2 && us2 - us_ < epsilon) {
					us += smoothstep(us_, us2, textureLod( tex, sampleuv, lod ).z - epsilon );
					w++;
				}

				if (w > 0.) {
					us /= w;
					return max(us2 - us, 0.) * u_ssaoIntense;
				}
			}

			return 0.;
		}
		`).replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '),

	// TODO seems interesting: https://discourse.threejs.org/t/simple-motion-blur-effect/3107
	motion: `
	`
}

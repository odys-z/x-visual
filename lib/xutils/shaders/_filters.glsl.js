
import {glx, glConfig} from './glx.glsl';

/**Filter: horizontal blur.
 * Reference
 * <ol>
 * 	<li><a href='https://www.shadertoy.com/view/lt3fzN'>ShaderToy Simple Blur</a></li>
 * </ol>
 * @param {object=} vparas Visual.paras
 * @param {bool=} debug show quad color
 * @member xglsl._hBlur
 * @function
 *  */
export function _hBlur(vparas = {}, debug) {
	let r;
	let flaring = !!vparas.flare && vparas.flare !== 0;
	if (flaring) r = vparas.flare;
	let flareHue = vparas.flareHue || glConfig.xfilter.flareHue;
	return {
		vertexShader: `#version 300 es
			in vec3 position;
			in vec2 uv;
			out vec2 vUv;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
		`.replaceAll(/\n\t\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `#version 300 es
			precision highp float;
			precision highp int;
			layout(location = 0) out vec4 xOutline;
			layout(location = 1) out vec4 xBlurColor;

			uniform float u_time;
			uniform float u_blurRadius;
			uniform sampler2D xFragColor;
			uniform sampler2D xColor;
			uniform sampler2D xEnvSpecular;
			uniform vec2 u_texsize;

			uniform sampler2D u_noise;
			uniform vec2 u_flareUv; `/* light reprojection */ + `
			uniform vec3 u_flareHue;

			in vec2 vUv;

			${glx.xenv.threshold}
			${filters.blurH}
			${flaring ? filters.flare(flareHue) : ''}

			void main() {
				xBlurColor = blurH( xEnvSpecular, vUv, u_blurRadius, u_texsize );
				${flaring ? `xBlurColor.xyz += flare( vUv, u_flareUv, u_noise, float(${r}), u_flareHue );` : ''}

				xOutline += vec4(0.);
				${debug ? 'xBlurColor.r += smoothstep(0.49, 0.51, vUv.x) * 0.2;' : ''}
			}
			`.replaceAll(/\n\t\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

const filters = {
	/* but take a look at https://www.shadertoy.com/view/Xltfzj
		void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
			float Pi = 6.28318530718; // Pi*2
			float Directions = 4.0;
			float Size = 6.0; // BLUR SIZE (Radius)

			vec2 Radius = Size/iResolution.xy;

			// Normalized pixel coordinates (from 0 to 1)
			vec2 uv = fragCoord/iResolution.xy;
			// Pixel colour
			vec4 Color = texture(iChannel0, uv);

			float lod = Size * 0.6;
			// Blur calculations
			for( float d=0.0; d<Pi; d+=Pi/Directions) {
			    Color += textureLod( iChannel0, uv + vec2(0.0, 1.0) * Radius * 0.5, lod);
			    Color += textureLod( iChannel0, uv + vec2(-0.886, -0.5) * Radius * 0.6, lod);
			    Color += textureLod( iChannel0, uv + vec2(0.886, -0.5) * Radius * 0.55, lod);
			}

			Color /= 3. * Directions;
			fragColor =  Color;
		}
	*/
	blurH: `
		vec4 blurH( in sampler2D tex, in vec2 uv, in float blurRadius, in vec2 texsize ) {
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

			return sum; // * texture(tex, uv);
		}
		`.replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '),
	// https://www.shadertoy.com/view/XdfXRX
	flare (hue) { return `
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

		    float f2  = max(1.0 / (1.0 + 32.0*pow(length(uvd + 0.8 * pos), 2.0)), .0) * 00.25;
			float f22 = max(1.0 / (1.0 + 32.0*pow(length(uvd + 0.85 *pos), 2.0)), .0) * 00.23;
			float f23 = max(1.0 / (1.0 + 32.0*pow(length(uvd + 0.9 * pos), 2.0)), .0) * 00.21;

			vec2 uvx = mix(uv, uvd, -0.5);

			float f4  = max(0.01 - pow(length(uvx + 0.4 * pos), 2.4), .0) * 6.0;
			float f42 = max(0.01 - pow(length(uvx + 0.45* pos), 2.4), .0) * 5.0;
			float f43 = max(0.01 - pow(length(uvx + 0.5 * pos), 2.4), .0) * 3.0;

			uvx = mix(uv, uvd, -.4);

			float f5  = max(0.01 -pow(length(uvx + 0.2 * pos), 5.5), .0) * 2.0;
			float f52 = max(0.01 -pow(length(uvx + 0.4 * pos), 5.5), .0) * 2.0;
			float f53 = max(0.01 -pow(length(uvx + 0.6 * pos), 5.5), .0) * 2.0;

			uvx = mix(uv, uvd, -0.5);

			float f6  = max(0.01 - pow(length(uvx - 0.3  * pos), 1.6), .0) * 6.0;
			float f62 = max(0.01 - pow(length(uvx - 0.325* pos), 1.6), .0) * 3.0;
			float f63 = max(0.01 - pow(length(uvx - 0.35 * pos), 1.6), .0) * 4.0;

			vec3 c = vec3(.0);

			c.r += f2 + f4 + f5 + f6; c.g += f22 + f42 + f52 + f62; c.b += f23 + f43 + f53 + f63;
			c += vec3(f0 * r);

			return c;
		}

		vec3 flare(vec2 quadUv, vec2 lightUv, sampler2D texNoise, float r, vec3 hue) {
		  // quadUv.x *= u_texsize.x/u_texsize.y;
		  // lightUv.x *= u_texsize.x/u_texsize.y;
		  vec3 f = lensflare(quadUv - 0.5, lightUv / 2., texNoise, r);
		  return hue * f;
		}
		`.replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '); },

	// three.js bokeh example:
	// examples/jsm/shaders/BokehShader.js
	bokeh: `
	`,

	// TODO seems interesting: https://discourse.threejs.org/t/simple-motion-blur-effect/3107
	motion: `
	`
}

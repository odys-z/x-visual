
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

			uniform vec2 u_flareUv;

			in vec2 vUv;

			${glx.xenv.threshold}
			${glx.mrt.f_blurH}
			${filters.flare}

			void main() {
				xBlurColor = blurH( xEnvSpecular, vUv, u_blurRadius, u_texsize );
				xBlurColor.xyz += lensflare( vUv, u_flareUv, u_noise );

				xOutline += vec4(0.);
				${debug? 'xBlurColor.r += smoothstep(0.49, 0.51, vUv.x) * 0.2;' : ''}
			}
			`.replaceAll(/\n\t\t\t/g, '\n')
			.replaceAll(/\t/g, '  ')
	};
}

const filters = {
	// https://www.shadertoy.com/view/XdfXRX
	flare: `
	float ang_noise(float t, sampler2D u_noise) {
		return texture(u_noise, vec2(t, 0.0) / u_texsize).x;
	}
	float ang_noise(vec2 t, sampler2D u_noise) {
		return texture(u_noise, (t + vec2(u_time)) / u_texsize).x;
	}

	vec3 lensflare(vec2 uv, vec2 pos, sampler2D u_noise) {
		vec2 main = uv-pos;
		vec2 uvd = uv*(length(uv));

		float ang = atan(main.y, main.x);
		float dist= length(main); dist = pow(dist,.1);
		float n = ang_noise(vec2((ang - u_time/9.0)*16.0,dist*32.0), u_noise);

		float f0 = 1.0/(length(uv-pos)*16.0+1.0);

		f0 = 0.3 * f0 + f0 * (sin((ang + u_time/18.0 + ang_noise(abs(ang) + n/2.0, u_noise) * 2.0) * 12.0) * .1 + dist * .1 + .8);
		f0 *= 0.4 * abs(cos(ang - 0.16 * u_time))
	        + (0.3 * abs(sin(ang + 0.2 * u_time)) + 0.2 * abs(sin(ang - 0.1 * u_time))) * abs(sin(0.1 * u_time));
		f0 *= 0.5;

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
		float f63 = max(0.01 - pow(length(uvx - 0.35 * pos), 1.6), .0) * 5.0;

		vec3 c = vec3(.0);

		c.r += f2 + f4 + f5 + f6; c.g += f22 + f42 + f52 + f62; c.b += f23 + f43 + f53 + f63;
		c+=vec3(f0);

		return vec3(1.4, 1.2, 1.0) * c;
	}
	`
	/*
	vec3 flare(in vec2 uv, in vec2 lightDir ) {
		return vec3(1.4, 1.2, 1.0) * lensflare(uv, lightDir);
	}

	vec3 mainImage( in vec2 uv ) {
		// vec2 uv = fragCoord.xy / iResolution.xy - 0.5;
		// uv.x *= iResolution.x/iResolution.y; //fix aspect ratio

		vec3 color = vec3(1.4,1.2,1.0) * lensflare(uv, vec2(0.2));
		// fragColor = vec4(color,1.0);
		return color;
	}
	*/
}

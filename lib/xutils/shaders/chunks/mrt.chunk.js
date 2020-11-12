import {WebGLProgram} from '../../../../packages/three/three.module-MRTSupport'

export const mrt = {
	/**
	 * 	precision highp float;
	 * 	precision highp int;
	 * 	layout(location = 0) out vec4 pc_FragColor;
	 * 	layout(location = 1) out vec4 xColor;
	 * 	layout(location = 2) out vec4 xEnvSpecular;
	 */
	f_layout: (`#version 300 es
		precision highp float;
		precision highp int;
		` + WebGLProgram.mrt_layouts)
		.replaceAll(/\t/g, ''),

	f_blurH: `
		vec4 blurH( in sampler2D tex, in vec2 uv, in vec2 blurSize, in float t0 ) {
			vec4 sum = vec4(0.);

			sum += threshold( textureLod(tex, vec2(uv.x - 4.0 * blurSize.x, uv.y), 13.), t0) * 0.05;
			sum += threshold( textureLod(tex, vec2(uv.x - 3.0 * blurSize.x, uv.y), 8.), t0) * 0.09;
			sum += threshold( textureLod(tex, vec2(uv.x - 2.0 * blurSize.x, uv.y), 3.), t0) * 0.12;
			sum += threshold( textureLod(tex, vec2(uv.x - 1.0 * blurSize.x, uv.y), 1.), t0) * 0.15;
			sum += threshold( textureLod(tex, uv, 0.), t0) * 0.16;
			sum += threshold( textureLod(tex, vec2(uv.x + 1.0 * blurSize.x, uv.y), 1.), t0) * 0.15;
			sum += threshold( textureLod(tex, vec2(uv.x + 2.0 * blurSize.x, uv.y), 3.), t0) * 0.12;
			sum += threshold( textureLod(tex, vec2(uv.x + 3.0 * blurSize.x, uv.y), 8.), t0) * 0.09;
			sum += threshold( textureLod(tex, vec2(uv.x + 4.0 * blurSize.x, uv.y), 13.), t0) * 0.05;

			return sum; // * texture(tex, uv);
		}
		`.replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '),

	f_envSpecular: `
	`
}

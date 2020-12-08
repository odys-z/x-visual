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

	// f_blurH: `
	// 	vec4 blurH( in sampler2D tex, in vec2 uv, in float blurRadius, in vec2 texsize ) {
	// 		vec2 blurSize = blurRadius / texsize;
	// 		vec4 sum = vec4(0.);
	//
	// 		sum += textureLod(tex, vec2(uv.x - 4.0 * blurSize.x, uv.y), 4.) * 0.05;
	// 		sum += textureLod(tex, vec2(uv.x - 3.0 * blurSize.x, uv.y), 4.) * 0.09;
	// 		sum += textureLod(tex, vec2(uv.x - 2.0 * blurSize.x, uv.y), 4.) * 0.12;
	// 		sum += textureLod(tex, vec2(uv.x - 1.0 * blurSize.x, uv.y), 4.) * 0.15;
	// 		sum += textureLod(tex,      uv,                             4.) * 0.16;
	// 		sum += textureLod(tex, vec2(uv.x + 1.0 * blurSize.x, uv.y), 4.) * 0.15;
	// 		sum += textureLod(tex, vec2(uv.x + 2.0 * blurSize.x, uv.y), 4.) * 0.12;
	// 		sum += textureLod(tex, vec2(uv.x + 3.0 * blurSize.x, uv.y), 4.) * 0.09;
	// 		sum += textureLod(tex, vec2(uv.x + 4.0 * blurSize.x, uv.y), 4.) * 0.05;
	//
	// 		return sum; // * texture(tex, uv);
	// 	}
	// 	`.replaceAll(/\t\t/g, '').replaceAll(/\t/g, '  '),

	f_envSpecular: `
	`
}

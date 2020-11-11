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

	f_envSpecular: `
	`
}

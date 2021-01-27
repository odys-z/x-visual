
/** get shader of gl_point for debugging
 * @param {object=} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testPoint
 * @function
 */
export function testPoint(paras = {}) {
	return {
		vertexShader: (`#version 300 es
			precision highp float;
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			in vec3 position;
			void main() {
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				gl_PointSize = 3.0 * ${paras.vert_scale || '1.0'};
			}`)
		.replaceAll(/\t\t\t/g, ''),
		fragmentShader: `${glx.mrt.f_layout}
			void main() { pc_FragColor = vec4( 1., 1., 0., 1. ); }`
		.replaceAll(/\t\t\t/g, ''),
	};
}

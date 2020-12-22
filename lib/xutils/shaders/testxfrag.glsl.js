
/** get shader of gl_point for debugging
 * @param {object=} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testPoint
 * @function
 */
export function testXFrag(paras = {}) {
	return {
		vertexShader: (`#version 300 es
			precision highp float;
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			in vec3 position;
			in vec2 uv;

			out vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`
		).replaceAll(/\t\t\t/g, ''),

		fragmentShader: (`#version 300 es
			precision highp float;
			precision highp int;
			layout(location = 0) out vec4 pc_FragColor;

			uniform sampler2D xFragColor;
			uniform sampler2D xColor;
			uniform sampler2D xEnvSpecular;
			uniform sampler2D xBlurH;
			uniform float u_time;

			in vec2 vUv;

			void main() { pc_FragColor = textureLod( xFragColor, vUv, sin(u_time / 1000.) * 4. + 4. ); }`
		).replaceAll(/\t\t\t/g, ''),
	};
}

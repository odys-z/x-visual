
/** get shader of gl_point for debugging
 * @param {object=} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testXFrag
 * @function
 */
export function testXFrag(paras = {}) {
	let xlod = paras.lodMagnitude || 0
	xlod = `float(${xlod})`;
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
			uniform float u_time;

			in vec2 vUv;

			void main() { pc_FragColor = textureLod( xFragColor, vUv, sin(u_time / 1000.) * ${xlod} + ${xlod} ); }`
		).replaceAll(/\t\t\t/g, ''),
	};
}

/** get shader of gl_point for debugging
 * @param {object=} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testXSpec
 * @function
 */
export function testXSpec(paras = {}) {
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

			uniform sampler2D xEnvSpecular;
			uniform float u_time;

			in vec2 vUv;

			void main() { pc_FragColor = textureLod( xEnvSpecular, vUv, sin(u_time / 1000.) * 4. + 4. ); }`
		).replaceAll(/\t\t\t/g, ''),
	};
}

export function testXDepth(paras = {}) {
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

			uniform sampler2D xBokehDepth;
			uniform float u_time;

			in vec2 vUv;

			void main() {
				pc_FragColor.rgb = vec3( textureLod( xBokehDepth, vUv, sin(u_time / 1000.) * 3. + 3.).z );
				pc_FragColor.a = 1.0;
			}`
		).replaceAll(/\t\t\t/g, ''),
	};
}

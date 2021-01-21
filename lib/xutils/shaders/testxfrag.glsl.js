
let vertexShader = (`#version 300 es
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
		).replaceAll(/\t\t\t/g, '');

/** get shader of finalQuad for showing xFragColor.
 * @param {object=} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testXFrag
 * @function
 */
export function testXFrag(paras = {}) {
	let xlod = paras.lodMagnitude || 0
	xlod = `float(${xlod})`;
	return {
		vertexShader,

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

/** get shader of finalQuad for showing speculate color.
 * @param {object=} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testXSpec
 * @function
 */
export function testXSpec(paras = {}) {
	return {
		vertexShader,

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

/** get shader of finalQuad for showing xBokehDepth.
 * @param {object=} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testXDepth
 * @function
 */
export function testXDepth(paras = {}) {
	return {
		vertexShader,

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

/** show everthing in xOutline, e.g. SSAO color set by filter..
 * @param {object=} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testXDepth
 * @function
 */
export function finalOutline(paras = {}) {
	let debugAlpha = paras.debug > 0 ? paras.debug : 0;
	return {
		vertexShader,

		fragmentShader: (`#version 300 es
			precision highp float;
			precision highp int;
			layout(location = 0) out vec4 pc_FragColor;

			uniform sampler2D xOutline;
			uniform sampler2D xBlurH;
			uniform float u_time;

			in vec2 vUv;

			void main() {
				pc_FragColor.rgb = texture( xBlurH, vUv ).xyz * float(${debugAlpha});
				// pc_FragColor.rgb += textureLod( xOutline, vUv, sin(u_time / 1000.) * 2. + 2.).zzz;
				pc_FragColor.g += texture( xOutline, vUv ).z;
				pc_FragColor.a = 1.0;
			}`
		).replaceAll(/\t\t\t/g, ''),
	};
}

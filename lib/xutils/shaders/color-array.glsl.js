
import {GlxError, glx, glConfig, initPhongUni, updatePhongUni} from './glx.glsl';
import {ShaderFlag, ShaderAlpha} from '../../component/visual';

/**Get a shader that can be morphed with colors and textures.<br>
 * Test page: test/html/morph-color.html<br>
 * ShaderFlag: colorArray<br>
 * See test page for different mixing mode results.
 *
 * <a href='file:///home/ody/git/x-visual/docs/design-memo/shaders/phong.html'>
 * x-visual doc: Morphing Phong Material</a><br>
 * <a href='http://www.cs.toronto.edu/~jacobson/phong-demo/'>
 * referencing implementation @ cs.toronto.edu</a>
 * @param {object} vparas <pre>{
   texMix: vparas.texMix - ShaderAlpha.multiply | additive | mix, see {@link XComponent.ShaderAlpha}
   uniforms: {
	 u_ambientColor: vec3
	 u_specularColor: vec3
	 u_lightPos: vec3 - diffuse light direction & specular light position
	 u_alpha: float - object color alpha
   }
  }</pre>
 * @param {object} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.phongMorph2
 * @function
*/
export function phongMorph2(vparas) {
	// array uniform example:
	// https://stackoverflow.com/questions/60154858/rotate-a-texture-map-on-only-one-face-of-a-cube/60158820#60158820
	let tex = vparas.u_tex;
	let colr = vparas.colors;
	let len = colr.length;

	if (!colr || tex && !Array.isArray(tex)
		|| !Array.isArray(colr)
		|| tex && colr.length != tex.length
		|| colr.length <= 0) {
		console.error('paras: ', vparas);
		throw new GlxError(`paras.u_tex and paras.colors not matching (required at least one color or texture): ${vparas}`);
	}

	// u_tex can be eighter empty or same length with colors
	let fragUnis = tex ? `uniform sampler2D u_tex[${len}];` : '';
	let vertUnis = `uniform vec3 u_colors[${len}];`;
	let bothUnis = '';
	let morphvert = '';
	let i = 0;
	for (; i < len; i++) {
		bothUnis += `\nuniform float u_morph${i};`;
		if (i > 0)
			// vec3 colori = u_color[0];
			morphvert += `\ncolori = blend(colori, u_colors[${i}], u_morph${i - 1});`;
	}
	if (i > 0)
		morphvert += `\ncolori = blend(colori, u_colors[0], u_morph${len - 1});`;

	let morphfrag = '';
	if ( tex ) {
		// len > 0
		morphfrag = `
			tex0 = texture( u_tex[0], vUv );`;
		for (let i = 1; i < len; i++) {
			morphfrag += `
			texi = texture( u_tex[${i}], vUv );
			if (texi.a > 0.0)
				tex0 = blend( tex0, texi, u_morph${i-1} );` ;
		}
		if (len > 1)
			morphfrag += `
			texi = texture( u_tex[0], vUv );
			tex0 = blend(tex0, texi, u_morph${len - 1});` ;
	}
	else morphfrag = `tex0 = vec4(vmorphColor, 1.);`;

	// vec4 blend(txa, txb, t);
	let statements = '';
	if (vparas.texMix & ShaderAlpha.product) {
		statements = `clr = txa * txb;`;
	}
	if (vparas.texMix & ShaderAlpha.multiply) {
		statements = `clr = txa * txb * t;`;
	}
	if (vparas.texMix & ShaderAlpha.differential) {
		statements = `clr = txa * abs(0.5 - t) + txb * abs(t - 0.5);`;
	}
	else if (vparas.texMix & ShaderAlpha.additive) {
		// default ShaderAlpha.mix
		statements = `clr = clamp(txa * (1.0 - t) + txb * t, 0.0, 1.0);`;
	}
	else {
		statements = `clr = mix(txa, txb, t);`;
	}

	let vertBlender = `vec3 blend(vec3 txa, vec3 txb, float t) {
		vec3 clr = vec3(0.4);
		${statements}
		return clr;
	} `;

	let fragBlender = `vec4 blend(vec4 txa, vec4 txb, float t) {
		vec4 clr = vec4(0.4);
		${statements}
		return clr;
	} `;

	return {
		vertexShader: `#version 300 es
			uniform vec3 cameraPosition;
			uniform mat4 modelMatrix;
			uniform mat4 viewMatrix;
			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform mat3 normalMatrix;
			${glx.u_alpha}
			${vertUnis}
			${bothUnis}
			uniform float u_lightIntensity;

			in vec3 position;
			in vec3 normal;
			in vec2 uv;

			out vec3 vnormal;
			out vec3 vertPos;
			out float vAlpha;
			out vec2 vUv;

			out vec3 vmorphColor;
			out float vIntense;

			${vertBlender}
			vec3 morphColors() {
				vec3 colori = u_colors[0];
				${morphvert}
				return colori;
			}
			${glx.fresnelAlpha}
			${glx.bokehDepth.v}

			void main(){
				vUv = uv;
				vAlpha = u_alpha;

				vec4 wp4 = modelMatrix * vec4(position, 1.0);
				vertPos = wp4.xyz;
				gl_Position = projectionMatrix * viewMatrix * wp4;

				vmorphColor = morphColors();
				vIntense = fresnelAlpha( cameraPosition, wp4.xyz, normal ) * u_lightIntensity;
				vnormal = normalMatrix * normal;
				bokehDepth();
			}
			`.replaceAll(/\t\t\t/g, '').replaceAll(/\t/g, '  '),

		fragmentShader: `${glx.mrt.f_layout}
			${glx.u_alpha}
			${bothUnis}
			${fragUnis}

			uniform vec3 cameraPosition;
			uniform float u_texWeight;
			uniform vec4  u_color; // diffuse
			uniform float u_shininess;
			uniform vec3  u_ambientColor;
			uniform vec3  u_specularColor;
			uniform vec3  u_lightPos;

			in float vAlpha;` /* NOT used ? */ + `
			in vec2  vUv;

			in vec3  vertPos;
			in vec3  vmorphColor;
			in vec3  vnormal;
			in float vIntense;

			${glx.phongLight}
			${glx.reinhardTone}
			${glx.threshold}
			${glx.bokehDepth.f}

			${fragBlender}
			vec4 mixTexi() {
				vec4 tex0 = vec4(0.0);
				vec4 texi = vec4(0.0);
				${morphfrag}
				if (tex0.a < 0.00001)
					discard;
				return tex0;
			}

			void main() {
				vec3 diffuseColor = mix(vmorphColor, u_color.xyz, vIntense);
				vec4 phong = phongLight(vnormal, u_lightPos, cameraPosition, vertPos,
						u_ambientColor.xyz, diffuseColor, u_specularColor.xyz, u_shininess, 0.1)
						* vIntense;

				pc_FragColor = mix( phong, mixTexi(), u_texWeight );
				pc_FragColor.a *= u_alpha;
				xColor = pc_FragColor;
				pc_FragColor.rgb = reinhardTone(pc_FragColor.rgb, 1.);
				xEnvSpecular = threshold(pc_FragColor);
				xBokehDepth = bokehDepth();
			}
			`.replaceAll(/\t\t\t/g, '').replaceAll(/\t/g, '  '),
	};
}

phongMorph2.initUniform = initPhongUni;
phongMorph2.updateUniform = updatePhongUni;

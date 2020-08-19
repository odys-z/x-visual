
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
     u_lightPos: vec3 - light direction
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
    var tex = vparas.u_tex;
    var colr = vparas.colors;

    if (!colr || tex && !Array.isArray(tex)
        || !Array.isArray(colr)
        || tex && colr.length != tex.length
        || colr.length <= 0) {
        console.error('paras: ', vparas);
        throw new GlxError(`paras.u_tex and paras.colors not matching (required at least one color or texture): ${vparas}`);
    }

    var len = colr.length;
    // u_tex can be eighter empty or same length with colors
    var fragUnis = tex ? `uniform sampler2D u_tex[${len}];` : '';
    var vertUnis = `uniform vec3 u_colors[${len}];`;
	var bothUnis = '';
    var morphvert = '';

    for (var i = 0; i < len; i++) {
        bothUnis += `\nuniform float u_morph${i};`;
        if (i > 0)
            // vec3 colori = u_color[0];
            morphvert += `\ncolori = blend(colori, u_colors[${i}], u_morph${i - 1});`;
    }
    if (i > 0)
        morphvert += `\ncolori = blend(colori, u_colors[0], u_morph${len - 1});`;

    var morphfrag = '';
    if ( tex ) {
        // len > 0
        morphfrag = `
            tex0 = texture2D( u_tex[0], vUv );`;
        for (var i = 1; i < len; i++) {
            morphfrag += `
            texi = texture2D( u_tex[${i}], vUv );
            if (texi.a > 0.0)
                tex0 = blend( tex0, texi, u_morph${i-1} );` ;
        }
        if (len > 1)
            morphfrag += `
            texi = texture2D( u_tex[0], vUv );
            tex0 = blend(tex0, texi, u_morph${len - 1});` ;
    }
    else morphfrag = `tex0 = vec4(vmorphColor, 1.);`;

    // vec4 blend(txa, txb, t);
    var statements = '';
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

    var vertBlender = `vec3 blend(vec3 txa, vec3 txb, float t) {
        vec3 clr = vec3(0.4);
        ${statements}
        return clr;
    } `;

    var fragBlender = `vec4 blend(vec4 txa, vec4 txb, float t) {
        vec4 clr = vec4(0.4);
        ${statements}
        return clr;
    } `;

    return {
  vertexShader: `
    ${glx.u_alpha}
    ${vertUnis}
    ${bothUnis}
    uniform float u_lightIntensity;

    varying vec3 vnormal;
    varying vec3 vertPos;
    // varying vec4 vColor;
    varying float vAlpha;
    varying vec2 vUv;

    varying vec3 vmorphColor;
    varying float vIntense;

    ${vertBlender}
    vec3 morphColors() {
        vec3 colori = u_colors[0];
        ${morphvert}
        return colori;
    }

    ${glx.intenseAlpha}

    void main(){
        vUv = uv;
        vAlpha = u_alpha;

        vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
        // vertPos = vertPos4.xyz / vertPos4.w;
        vertPos = vertPos4.xyz;
        gl_Position = projectionMatrix * vertPos4;

        vmorphColor = morphColors();
        vIntense = intenseAlpha(u_lightIntensity);
        vnormal = normalMatrix * normal;
    } `,

  fragmentShader: `
    ${glx.u_alpha}
    ${bothUnis}
    ${fragUnis}

    uniform float u_texWeight;
    uniform vec4 u_color; // diffuse
    uniform float u_shininess;
    uniform vec3 u_ambientColor;
    uniform vec3 u_specularColor;
    uniform vec3 u_lightPos;

    varying float vAlpha;
    varying vec2 vUv;

    varying vec3 vertPos;
    varying vec3 vmorphColor;
    varying vec3 vnormal;
    varying float vIntense;

    ${glx.phongLight}

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
        vec4 vColor = phongLight(vnormal, u_lightPos, cameraPosition, vertPos,
                u_ambientColor.xyz, diffuseColor, u_specularColor.xyz, u_shininess)
                * vIntense;

        // gl_FragColor = mix( vColor, mixTexi(), u_texWeight * u_alpha );
        gl_FragColor = mix( vColor, mixTexi(), u_texWeight);
        gl_FragColor.a *= u_alpha;
    }
  `};
}

phongMorph2.initUniform = initPhongUni;
phongMorph2.updateUniform = updatePhongUni;

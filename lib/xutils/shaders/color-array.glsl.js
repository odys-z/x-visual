
import {GlxError, glx, glConfig} from './glx.glsl'
import {ShaderFlag, ShaderAlpha} from '../../component/visual'

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
   texMix: vparas.texMix - ShaderAlpha, multiply | additive | mix, see {@link XComponent.ShaderAlpha}
   uniforms: {
     u_ambientColor: vec3
     u_specularColor: vec3
     u_lightPos: vec3 - light direction
     u_alpha: float - object color alpha
   } }</pre>
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
	var bothUnis = glx.u_alpha;
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
    else morphfrag = `        tex0 = vColor;`;

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
    uniform vec4 u_color; // diffuse
    uniform float u_shininess;
    uniform vec3 u_ambientColor;
    uniform vec3 u_specularColor;
    uniform vec3 u_lightPos;
    uniform float u_lightIntensity;

    ${vertUnis}
    ${bothUnis}

    varying vec3 normalInterp;
    varying vec3 vertPos;
    varying vec4 vColor;
    varying float vAlpha;
    varying vec2 vUv;

    ${vertBlender}
    vec3 morphColors() {
        vec3 colori = u_colors[0];
        ${morphvert}
        return colori;
    }

    ${glx.phongLight}
    ${glx.intenseAlpha}

    void main(){
        vUv = uv;
        vAlpha = u_alpha;

        vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
        vertPos = vec3(vertPos4) / vertPos4.w;
        normalInterp = normalMatrix * normal; // three.js normalMatrix is 3 x 3
        gl_Position = projectionMatrix * vertPos4;

        vec3 diffuseColor = morphColors();
        diffuseColor = mix(diffuseColor, u_color.xyz, intenseAlpha(u_lightIntensity));

        // vColor = phongLight(normal, u_lightPos, vertPos4,
        // vec3 L = normalMatrix * normalize(u_lightPos);
        vColor = phongLight(normal, u_lightPos, cameraPosition, vertPos,
                u_ambientColor.xyz, diffuseColor, u_specularColor.xyz, u_shininess)
                * u_lightIntensity;
    } `,

  fragmentShader: `
    ${bothUnis}
    ${fragUnis}

    uniform float u_texWeight;

    varying vec4 vColor;
    varying float vAlpha;
    varying vec2 vUv;

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
        // gl_FragColor = mix( vColor, mixTexi(), u_texWeight * u_alpha );
        gl_FragColor = mix( vColor, mixTexi(), u_texWeight * u_alpha );
    }
  `};
}

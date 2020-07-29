
import {GlxError} from './glx.glsl'
import {ShaderFlag, ShaderAlpha} from '../../component/visual'

/**
 * Get shaders for creating color-morphable material (THREE.Material).
 * @deprecated
 * @param {object} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.phongColorMorph
 * @function
 */
function phongColorMorph(vparas) {
    var colori = ''; // 'uniform vec4 u_color0; uniform float u_morph0;';
    var morph = 'vec3 morph = u_color0;';
    for (var i = 0; i < vparas.colors.length; i++) {
        colori += `\nuniform vec3 u_color${i}; uniform float u_morph${i};`;
        if (i > 0)
            morph += `\nmorph = mix(morph, u_color${i}, u_morph${i - 1});`;
    }
    if (i > 0)
        morph += `\nmorph = mix(morph, u_color0, u_morph${i - 1});`;

    var ka = '1.0';
    var kd = '1.0';
    var ks = '1.0';

    return { vertexShader: `
    uniform float shininessVal;
    uniform vec3 ambientColor;
    uniform vec3 specularColor;
    uniform vec3 u_lightPos;
    uniform float u_alpha;

    ${colori}

    varying vec3 normalInterp;
    varying vec3 vertPos;
    varying vec4 vColor; //color
    varying float vAlpha;

    vec3 morphColors() {
        ${morph}
        return morph;
    }

    void main(){
        vAlpha = u_alpha;
        float Ka = ${ka};
        float Kd = ${kd};
        float Ks = ${ks};

        vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
        vertPos = vec3(vertPos4) / vertPos4.w;
        // normalInterp = vec3(modelMatrix  * vec4(normal, 0.0));
        // normalInterp = vec3(normalMatrix * vec4(normal, 0.0)); // original
           normalInterp = normalMatrix * normal; // three.js normalMatrix is 3 x 3
        gl_Position = projectionMatrix * vertPos4;

        vec3 N = normalize(normalInterp);
        vec3 L = normalize(u_lightPos - vertPos);

        // Lambert's cosine law
        float lambertian = max(dot(N, L), 0.0);
        float specular = 0.0;
        if(lambertian > 0.0) {
            vec3 R = reflect(-L, N);      // Reflected light vector
            vec3 V = normalize(-vertPos); // Vector to viewer
            // Compute the specular term
            float specAngle = max(dot(R, V), 0.0);
            specular = pow(specAngle, shininessVal);

            // debug
            // L = V;
            specular = pow(specAngle, 1.0);
        }

        vec3 diffuseColor = morphColors();

        vColor = vec4(Ka * ambientColor +
                    Kd * lambertian * diffuseColor +
                    Ks * specular * specularColor, u_alpha); // u_alpha = vparas.uniforms.u_alpha
        // working: vColor = vec4(L * Ka, 1.0);
        // working with normalMatrix: vColor = vec4(Kd * lambertian);
        // working with normalMatrix: vColor = vec4(Ks * specular, 0.1, 0.2, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D u_tex;
    varying vec4 vColor;
    varying float vAlpha;

    void main() {
        gl_FragColor = vColor;
        // gl_FragColor = gl_FragColor * texture2D( u_tex, gl_FragCoord );
        // gl_FragColor.a *= vAlpha;
    }
  `};
}

/**Get a shader that can be morphed with colors and textures.<br>
 * Test page: test/html/morph-color.html<br>
 * ShaderFlag: colorArray<br>
 * See test page for different mixing mode results.
 * @param {object} vparas <pre>{
   texMix: vparas.texMix - ShaderAlpha, multiply | additive | mix, see {@link XComponent.ShaderAlpha}
   uniforms: {
     ambientColor: vec3
     specularColor: vec3
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
    var vertUnis = `uniform vec3 u_color[${len}];`;
    var bothUnis = 'uniform float u_alpha;';
    var morphvert = '';

    for (var i = 0; i < len; i++) {
        bothUnis += `\nuniform float u_morph${i};`;
        if (i > 0)
            // vec3 colori = u_color[0];
            morphvert += `\ncolori = blend(colori, u_color[${i}], u_morph${i - 1});`;
    }
    if (i > 0)
        morphvert += `\ncolori = blend(colori, u_color[0], u_morph${len - 1});`;

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

    // uniform int mode;   // Rendering mode
    // Material color
    // uniform vec3 diffuseColor;
    var ka = '1.0';   // Ambient reflection coefficient, e.g. 1.0,
    var kd = '1.0';   // Diffuse reflection coefficient, e.g. 0.4,
    var ks = '1.0';   // Specular reflection coefficient, e.g. 1.0,

    return {
  vertexShader: `
    uniform float n;
    uniform float shininessVal; // Shininess, e.g. 80
    uniform vec3 ambientColor;
    uniform vec3 specularColor;
    uniform vec3 u_lightPos; // Light position

    ${vertUnis}
    ${bothUnis}

    varying vec3 normalInterp;
    varying vec3 vertPos;
    varying vec4 vColor;
    varying float vAlpha;
    varying vec2 vUv;

    ${vertBlender}
    vec3 morphColors() {
        vec3 colori = u_color[0];
        ${morphvert}
        return colori;
    }

    void main(){
        vUv = uv;
        vAlpha = u_alpha;
        float Ka = ${ka};
        float Kd = ${kd};
        float Ks = ${ks};

        vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
        vertPos = vec3(vertPos4) / vertPos4.w;
        // normalInterp = vec3(modelMatrix  * vec4(normal, 0.0));
        // normalInterp = vec3(normalMatrix * vec4(normal, 0.0)); // original
        normalInterp = normalMatrix * normal; // three.js normalMatrix is 3 x 3
        gl_Position = projectionMatrix * vertPos4;

        vec3 N = normalize(normalInterp);
        vec3 L = normalize(u_lightPos - vertPos);

        // Lambert's cosine law
        float lambertian = max(dot(N, L), 0.0);
        float specular = 0.0;
        if(lambertian > 0.0) {
            vec3 R = reflect(-L, N);      // Reflected light vector
            vec3 V = normalize(-vertPos); // Vector to viewer
            // Compute the specular term
            float specAngle = max(dot(R, V), 0.0);
            specular = pow(specAngle, shininessVal);

            // debug
            // L = V;
            specular = pow(specAngle, 1.0);
        }

        vec3 diffuseColor = morphColors();

        vColor = vec4(Ka * ambientColor +
                    Kd * lambertian * diffuseColor +
                    Ks * specular * specularColor, u_alpha); // u_alpha = vparas.uniforms.u_alpha
    }
  `,
        // useful debug lines:
        // working vColor = vec4(L * Ka, u_morph0);
        // working with normalMatrix: vColor = vec4(Kd * lambertian);
        // working with normalMatrix: vColor = vec4(Ks * specular, 0.1, 0.2, 1.0);

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
        // gl_FragColor = vColor;
        // gl_FragColor = mix(gl_FragColor, mixTexi(), u_texWeight);
        gl_FragColor = mix( vColor, mixTexi(), u_texWeight * u_alpha );
    }
  `};
}


import * as xutils from '../xcommon'

/**Create vertex & fragment shaders that can morphing between multiple positions.
 * @deprecated
 * @param {object} paras
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.cubeVoxels9
 * @function
function cubeVoxels9(paras) {
 return { vertexShader: `
  uniform float u_alpha;
  uniform vec3 u_sects;
  uniform vec3 u_box0;
  uniform vec3 u_box1; uniform float u_morph1; uniform mat4 u_trans1;
  ${paras.a_dest2 ? 'uniform vec3 u_box2; uniform float u_morph2; uniform mat4 u_trans2' : ''}

  attribute vec3 color;
  attribute float size;
  ${paras.a_noise ? 'attribute float a_noise;' : ''}
  // attribute vec3 ix;    // use position as index

  varying vec3 vColor;
  varying float vAlpha;

  vec4 ix2world(vec3 sects, vec3 box) {
    return modelViewMatrix * vec4(box * sects / u_sects, 1.0);
  }

  void main() {
    vColor = color;
    vAlpha = u_alpha;
    vec4 pos0 = ix2world(position, u_box0);
    vec4 pos1 = ix2world(position, u_box1);
    pos0 = mix(modelViewMatrix * pos0, u_trans1 * pos1, u_morph1);
    // ${paras.a_noise && !paras.vert_scale ? 'pos0.xyz += a_noise * color' : ''}
    // ${paras.a_noise &&  paras.vert_scale ? 'pos0.xyz += a_noise * color * ' + paras.vert_scale : ''}

    ${paras.a_dest2 ? 'pos1 = ix2world(position, a_box2);' : ''}
    ${paras.a_dest2 ? 'pos0 = mix(pos0, u_trans2 * pos1, u_morph2);' : ''}

    ${paras.a_noise && !paras.vert_scale ? 'pos0.xyz += a_noise * color' : ''}
    ${paras.a_noise &&  paras.vert_scale ? 'pos0.xyz += a_noise * color * ' + paras.vert_scale : ''}

    //vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_PointSize = size * ${paras.vert_scale || '10.0'};
    gl_Position = projectionMatrix * pos0; //mvPosition;
    // gl_Position = projectionMatrix * vec4(0., 0., 0., 1.);

    gl_PointSize = 100000.0;
  }
  `,

 fragmentShader: `
  uniform sampler2D u_tex;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4( vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( u_tex, gl_PointCoord );
    gl_FragColor.a *= vAlpha;
  } `
 };
}
 */

/**Create vertex &amp; fragment shaders that can morphing between multiple box
 * positions.
 * @param {object} paras
 * paras.uniforms.u_cubes array of boxes
 * param.uniforms.u_box1, 2, ... vec3 for position index (voxel index, not position)
 * param.uniforms.u_morph, morph animation, 0 - 1
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.cubeVoxels
 * @function
 */
export function cubeVoxels(paras) {
    var boxi = ''; // 'uniform vec3 u_box0; uniform float u_morph0;';
    var pos = '';
    for (var i = 0; i < paras.uniforms.u_cubes.length; i++) {
        boxi += `\nuniform vec3 u_box${i}; uniform float u_morph${i};`;
        if (i > 0)
        pos += `pos = mix(pos, ix2model(u_sects, u_box${i}), u_morph${i-1});\n    `
             + `p_ = mix(p_, next2model(u_sects, u_box${i}), u_morph${i-1});\n    `;
    }
    pos += `pos = mix(pos, ix2model(u_sects, u_box0), u_morph${i-1});\n    `;
         + `p_ = mix(p_, next2model(u_sects, u_box0), u_morph${i-1});\n    `;

 return { vertexShader: `
  uniform float u_alpha;
  uniform vec3 u_sects;
  //uniform vec3 u_box0; uniform float u_morph0;
  ${boxi}

  attribute vec3 color;

  varying vec3 vColor;
  varying float vAlpha;

  vec4 ix2model(vec3 sects, vec3 box) {
    return vec4((position - sects / 2.) * box / sects, 1.);
  }

  vec3 next2model(vec3 sects, vec3 box) {
    return (position + 1. - sects/ 2.) * box / sects;
  }

  void main() {
    vColor = color;
    vAlpha = u_alpha;

    vec4 pos = ix2model(u_sects, u_box0);
    vec3 p_ = next2model(u_sects, u_box0);    // also morph next grid
    vec3 d0 = p_ - pos.xyz;                    // model 0 section length
    // pos = mix(pos, ix2model(u_sects, u_box1), u_morph1);
    ${pos}

    gl_Position = projectionMatrix * modelViewMatrix * pos;
    vec4 p1 = projectionMatrix * modelViewMatrix * vec4(p_, 1.);

    gl_PointSize = 3.0 * ${paras.vert_scale !== undefined ? paras.vert_scale : '10.0'};
    // scale point size as the same to section scale
    vec3 d1 = p1.xyz - pos.xyz;
    gl_PointSize *= length(d0) / length(d1);
  }
  `,

 fragmentShader:
 // `void main() { gl_FragColor = vec4(1.0); } `
 `uniform sampler2D u_tex;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4( vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( u_tex, gl_PointCoord );
    gl_FragColor.a *= vAlpha;
  } `
 }
};

/**Get geometry buffer for cube voxels, with attributes that the shader can work,
 * each vertex has a random color, noise and size.<br>
 * The uniform names are color, size (default by Three.js) and a_noise.
 * @param {object} vparas
 * u_sects: [w, h, d] segements in 3D
 * @return {THREE.BufferGeometry} the geometry buffer.
 * @member xglsl.cubeVoxels
 * @function
 */
export function cubeVoxelGeom(vparas) {
    var whd = vparas.u_sects;
    var ixyz = []; // position, a.k.a vertex index
    var colors = [];
    var sizes = [];
    var noise = [];
    var count = (whd[0] + 1) * (whd[1] + 1) * (whd[2] + 1);
    for (var iw = 0; iw <= whd[0]; iw++)
        for (var ih = 0; ih <= whd[1]; ih++)
            for (var id = 0; id <= whd[2]; id++) {
                ixyz.push(iw, ih, id);
                var color = xutils.randomRGB();
                colors.push( color.r, color.g, color.b );
                sizes.push( (Math.random() * 2 - 1 ) );

                if (vparas.a_noise)
                    noise.push( (Math.random() * vparas.noise - vparas.noise / 2 ) );
            }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(ixyz, 3) );

    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 )
            .setUsage( THREE.DynamicDrawUsage ) );
    geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 )
            .setUsage( THREE.DynamicDrawUsage ) );

    if (vparas.a_noise)
        geometry.setAttribute( 'a_noise', new THREE.Float32BufferAttribute( noise, 1 )
                .setUsage( THREE.DynamicDrawUsage ) );

    return geometry;
}

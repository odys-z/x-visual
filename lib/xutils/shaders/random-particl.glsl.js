
/**Get shader for ShaderFlag.randomParticles.
 * If u_morph is animated, must providing uniform vec3 &amp a_target.
 * Used variables: position, color, size.
 * gl_position = mix(pos, taget, morph) + noise * dist;
 * @param {object} paras
 * paras.u_dist {float} in world
 * paras.u_morph {float}
 * paras.a_dest {vec3} in world
 * paras.a_noise {float}
 * paras.size_scale {float}
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.randomRarticl
 * @function */
export function randomParticl(paras) {
 return { vertexShader: `
  uniform float u_alpha;
  uniform float u_dist;
  uniform float u_morph;

  attribute vec3 color;
  attribute float size;
  ${paras.a_dest ? 'attribute vec3 a_dest;' : ''}
  ${paras.a_noise ? 'attribute float a_noise;' : ''}

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vAlpha = u_alpha;
    ${!paras.a_dest && !paras.a_noise ? 'vec3 pos = position * (1.0 + u_morph);' : ''}
    ${ paras.a_dest && !paras.a_noise ? 'vec3 pos = mix(position, a_dest, u_morph) + u_dist * 5.0;' : ''}
    ${!paras.a_dest && paras.a_noise ? 'vec3 pos = position + u_dist * 100 * a_noise;' : ''}
    ${ paras.a_dest && paras.a_noise ? 'vec3 pos = mix(position, a_dest, u_morph) + u_dist * 5.0 * a_noise;' : ''}
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

    // gl_PointSize = u_morph * ( 300.0 / -mvPosition.z );
    gl_PointSize = size * ${paras.vert_scale || '10.0'};
    gl_Position = projectionMatrix * mvPosition;
  } `,
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

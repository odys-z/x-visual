
/**
 * Get points geometry buffer for simulating flowing path.
 * @param {THREE.Vector3} point
 * @return {THREE.Geometry} point geometry
 * @member xglsl.pointGeom
 * @function
 */
export function pointGeom(point) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        point
        // new THREE.Vector3( -10,  10, 0 )
        // new THREE.Vector3( -10, -10, 0 ),
        // new THREE.Vector3(  10, -10, 0 )
    );
    // geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
    geometry.computeBoundingSphere();
    return geometry;
}

/**Example:
 * See docs/design memoe/shader samples
 *
 * @param {object} paras
 * paras.vert_scale: point scale
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.flameLight
 * @function
 */
export function blinkStar(paras = {}) {
 return { vertexShader: `
  uniform vec2 fragSize;
  varying vec2 size;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = 3.0 * ${paras.vert_scale || '10.'};

    if (fragSize.x == 0. && fragSize.y == 0.)
      size = vec2(gl_PointSize);
 }`,
 fragmentShader: `
  uniform float iTime;

  varying vec2 size;

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec4 a = dot(i, vec3(1., 57., 21.)) + vec4(0., 57., 21., 78.);
    vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
    a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
    a.xy = mix(a.xz, a.yw, f.y);
    return mix(a.x, a.y, f.z);
  }

  float sphere(vec3 p, vec4 spr) {
    return length(spr.xyz-p) - spr.w;
  }

  float flame(vec3 p) {
    float d = sphere(p, vec4(-0.460, -1.0, 0.0, 1.));
    return d + (noise(p + vec3(.0, 0. * 2., .0)) + noise(p * 3.) * .5) * .25 * (p.y);
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord, in vec2 size ) {
    // can we use z for p?
    vec4 p = 1.5 - vec4(flame(vec3(abs(fragCoord - vec2(0.5)), 0.)));
    // vec4 p = 1.5 - vec4(flame(vec3(abs(fragCoord - size * 0.5), 0.) / 500.0));

    float glow = p.w;
    vec4 col = mix(vec4(1., .5, .1, 1.), vec4(0.1, .5, 1., 1.), p.y * .02 + .4);
    fragColor = mix(vec4(0.), col, pow(glow * 0.75, 10.));
  }

  void main() {
    mainImage(gl_FragColor, gl_PointCoord, size);

    // gl_FragColor.r = 0.5;
    // gl_FragColor.a = max(gl_FragColor.a, 0.5);
    // gl_FragColor = vec4(1.0);
  }` };
}

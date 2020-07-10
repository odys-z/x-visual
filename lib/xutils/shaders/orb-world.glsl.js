

/**Get shader of scaled orb, with respect to vertex dir & cent attribute
 * @deprecated replaced by scaleOrb?
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.dirOrb2
 * @function
function dirOrb2() {
 return {
 vertexShader: `
  uniform vec3 wpos;
  uniform vec3 orbScale;

  attribute vec3 a_tan;

  varying vec2 vUv;
  varying vec3 I;
  varying vec3 P;
  varying vec3 vtan;
  varying vec4 cent;
  // varying mat3 R3;
  varying vec3 vabc;

  mat3 calcLookAtMatrix(vec3 target, float roll) {
    vec3 rr = vec3(sin(roll), cos(roll), 0.0);
    vec3 ww = normalize(target);
    vec3 uu = normalize(cross(ww, rr));
    vec3 vv = normalize(cross(uu, ww));
    // return mat3(uu, vv, -ww);
    return mat3(uu, vv, ww);
  }

  void main() {
    vUv = uv;
    vtan = a_tan;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    I = normalize(cameraPosition - P);

    mat3 R3 = calcLookAtMatrix(a_tan, 0.);
    // vec4 v = modelMatrix * vec4(R3 * orbScale, 1.);
    vabc = R3 * orbScale;
    cent = modelMatrix * vec4(wpos, 1.);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `,

 fragmentShader: `
  // uniform float modelAlpha;
  uniform float r;
  uniform vec3 orbScale;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vtan;
  varying vec4 cent;
  varying vec3 vabc;

  /**Vector distance  to orignal point.
   * https://math.stackexchange.com/questions/778171/intersection-of-ellipsoid-with-ray
   * /
  vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 cent, vec3 abc ) {
      // e = o - c, where o = eye, c = cent
      vec3 e = eye - cent;
      e = e / vabc;

      // delta = (u . e)^2 + r^2 - |e|^2
      u = normalize(u / vabc);

      float delta = pow( dot( u, e ), 2. ) + pow( r, 2. ) - dot(e, e);
      if (delta < 0.) return vec2(delta);
      // d = - u.e +/- delta^0.5
      delta = pow( delta, 0.5 );
      return vec2( -dot( u, e ) + delta, -dot( u, e ) - delta );
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    // float r = 30.;
    vec3 e = cameraPosition;
    vec3 i = normalize( P - cameraPosition );
    // vec2 dists = sdEllipsoid( e, i, r, cent.xyz, vec3(1.2, .25, .5) );
    // vec2 dists = sdEllipsoid( e, i, r, cent.xyz, orbScale );
    vec2 dists = sdEllipsoid( e, i, r, cent.xyz, vabc );

    if (dists.x < 0.0) {
      // Didn't hit anything
      // fragColor = mix(vec4( abs(modelAlpha) ), texture2D(iChannel0, vUv), .3);
      fragColor = vec4(vtan, 0.4);
      fragColor.g += 0.2;
      return;
    }

    vec3 p = e + dists.x * i;
    vec3 n = normalize(p - cent.xyz);
    float ratio = abs(length(dists.x - dists.y)) / (2. * r);
    fragColor = vec4 ( pow( clamp(ratio, 0.001, 1.), 4. ) );
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }`
 }
}
 */
/**<p id="worldOrbs">Get shader of a sequnce of orbs, with respect to vertex dir
 * &amp; cent attribute.</p>
 * Test page: test/html/map3d/geopath-road.html<br>
 * ShaderFlag: worldOrbs
  <pre>uniform float r;
  uniform float whiteAlpha;
  uniform sampler2D u_tex;
  uniform vec3 wpos;
  uniform vec3 offsets[${orbs}];
  uniform vec3 orbScale;
  uniform float r[${orbs}];
  uniform vec4 orbColors[${orbs}];

  attribute vec3 a_tan;
  attribute vec3 a_pos;</pre>
 *
 * sub function:<br>
 * vec2 sdEllipsoid(): Vector distance  to orignal point.
 * param vec3 eye - raycast origin
 * param vec3 u - ray direction
 * param float r - orb radius
 * param vec3 cnetr - orb center
 * param vec3 abc - orb x y z scale
 * return vec2 distances where ray intercecting ellipsoid; less than zero if not.
 * see https://math.stackexchange.com/questions/778171/intersection-of-ellipsoid-with-ray
 * @param {object} vparas paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.worldOrbs
 * @function
 */
export function worldOrbs(vparas) {
 var orbs = vparas.offsets.length || 1;
 return { fragmentShader: `
  uniform float r[${orbs}];
  uniform vec4 orbColors[${orbs}];

  uniform float whiteAlpha;
  uniform vec3 orbScale;
  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vscale;
  varying vec4 cent[${orbs}];

  vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 centr, vec3 abc ) {
      // e = o - c, where o = eye, c = center
      vec3 e = eye - centr;
      e = e / abc;

      // delta = (u . e)^2 + r^2 - |e|^2
      u = normalize(u / abc);

      float delta = pow( dot( u, e ), 2. ) + pow( r, 2. ) - dot(e, e);
      if (delta < 0.) return vec2(delta);
      // d = - u.e +/- delta^0.5
      delta = pow( delta, 0.5 );
      return vec2( -dot( u, e ) + delta, -dot( u, e ) - delta );
  }

  // void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec4 mainImage( in vec2 fragCoord ) {
    vec4 fragColor = vec4(0.);
    vec3 e = cameraPosition;
    vec3 u = normalize( P - cameraPosition );

    for (int i = 0; i < ${orbs}; i++) {
        vec3 ci = cent[i].xyz;
        vec2 dists = sdEllipsoid( e, u, r[i], ci, vscale );

        if (dists.x <= 0.00001) {
          ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
          continue;
        }

        vec3 p = e + dists.x * u;
        vec3 n = normalize(p - ci);
        float ratio = abs(length(dists.x - dists.y)) / (2. * r[i]);
        // fragColor += vec4 ( pow( clamp(ratio, 0.0, 1.), 4. ) );
        fragColor += pow( clamp(ratio, 0.0, 1.), 4. ) * orbColors[i];
    }
    fragColor = clamp(fragColor, 0., 1.);
    float txAlpha = clamp(whiteAlpha, 0., 1.);
    fragColor.a = 1. - txAlpha;

    vec4 texcolor = texture2D(u_tex, vUv);
    fragColor = mix(fragColor, texcolor, txAlpha);
	return fragColor;
  }

  void main() {
    // mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor += mainImage(gl_FragCoord.xy);
  }`,

 vertexShader: `
  uniform vec3 wpos;
  uniform vec3 offsets[${orbs}];
  uniform vec3 orbScale;

  attribute vec3 a_tan;
  attribute vec3 a_pos;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vscale;
  varying vec4 cent[${orbs}];

  void main() {
    vUv = uv;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    vscale = orbScale;
    for (int i = 0; i < ${orbs}; i++){
      cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}


import {glx} from './glx.glsl'

/**<p id="scaleOrb">Get shader of scaled orb, with respect to vertex dir & cent
 * attribute.</p>
 * @param {object} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.scaleOrb
 * @function
 */
export function scaleOrb(vparas) {
 return { fragmentShader: `
  uniform float r;
  ${glx.u_whiteAlpha}
  uniform vec3 orbScale;
  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vtan;
  varying vec3 vscale;
  varying vec4 cent;
  // varying mat3 R3;

  /**Vector distance  to orignal point.
   * https://math.stackexchange.com/questions/778171/intersection-of-ellipsoid-with-ray
   */
  vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 cent, vec3 abc ) {
      // abc = normalize(normalize(vtan) * normalize(abc));

      // e = o - c, where o = eye, c = cent
      vec3 e = eye - cent;
      e = e / abc;

      // delta = (u . e)^2 + r^2 - |e|^2
      u = normalize(u / abc);

      float delta = pow( dot( u, e ), 2. ) + pow( r, 2. ) - dot(e, e);
      if (delta < 0.) return vec2(delta);
      // d = - u.e +/- delta^0.5
      delta = pow( delta, 0.5 );
      return vec2( -dot( u, e ) + delta, -dot( u, e ) - delta );
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec3 e = cameraPosition;
    vec3 i = normalize( P - cameraPosition );
    vec2 dists = sdEllipsoid( e, i, r, cent.xyz, vscale );

    fragColor = texture2D(u_tex, vUv);
    fragColor.a = clamp(whiteAlpha, 0.0, 1.);
    if (dists.x < 0.0) {
      ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
      return;
    }

    vec3 p = e + dists.x * i;
    vec3 n = normalize(p - cent.xyz);
    float ratio = abs(length(dists.x - dists.y)) / (2. * r);
    fragColor += vec4 ( pow( clamp(ratio, 0.0, 1.), 4. ) );
    fragColor = clamp(fragColor, 0., 1.);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }`,

 vertexShader: `
  uniform vec3 wpos; // actually model pos
  uniform vec3 orbScale;

  attribute vec3 a_tan;

  varying vec2 vUv;
  varying vec3 I;
  varying vec3 P;
  varying vec3 vtan;
  varying vec3 vscale;
  varying vec4 cent;
  // varying mat3 R3;

  void main() {
    vUv = uv;
    vec4 v = projectionMatrix * modelViewMatrix * vec4( a_tan, 1.0 );
    vtan = v.xyz;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    I = normalize(cameraPosition - P);
    vscale = orbScale;
    cent = modelMatrix * vec4(wpos, 1.);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

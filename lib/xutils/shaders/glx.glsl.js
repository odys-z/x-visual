
/**Glsl sub functions
 * @enum {string} */
export const glx = {
  /**Is the bit is true?
   * At least better than this:<br>
   * a = ...5, bit = 2 (start at 0), a_rem = a % 2^3 = 5, div = 5 / 4 >= 1
   * Reference: <a href='https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf'>
   * WebGL 1.0 API Quick Reference Card</a>
   */
  bitTrue: `
    bool bitTrue(int a, int bit) {
      float a_rem = mod(float(a), exp2(float(bit+1)));
      return a_rem / exp2(float(bit)) >= 1.;
    }`,

  /**Find distance to ellipsoid */
  sdEllipsoid: `vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 centr, vec3 abc ) {
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
  }`,

  /** Mix 3 colors of interposition t */
  thermalColor: `
    vec4 thermalColor(vec3 colrs[3], vec2 t0_1, float t) {
      float midrange = abs(t0_1.y - t0_1.x) / 2.;

      vec3 c0 = colrs[0];
      vec3 c1 = colrs[1];

      if (t > midrange) {
        c0 = colrs[1]; c1 = colrs[2];
        t = t - midrange;
      }

      return clamp(vec4(mix(c0, c1, t / abs(t0_1.y - midrange)), 1.), 0., 1.);
    }`,

  /**<h6>Fragment Function.</h6>
   * Get color on module face, reducing on distance, and is perspective on face,
   * not used for volumetric rendering.<br>
   * function: float pointFace( vec3 p, vec3 c )<br>
   * parameters:<br>
   * p: varying from vertex position, transformed to world:<pre>
    vec4 v4 =  modelMatrix * vec4(  vec3(-150., 0., -50.), 1.0 );
    P0 = v4.xyz;</pre>
   * c: the point in world, e.g. varying c<pre>
   * c = modelMatrix * vec4(0.);</pre>
   * return {float}: distance
   */
  pointFace: `float pointFace( vec3 p, vec3 c ) {
    return length(p - c);
  } `,

  /**<h6>Fragment Function.</h6>
   * 2D round box distance<br>
   * parameters:<br>
   * p {vec2}: varying from vertex poisition, transformed to world<br>
   * size {vec2}: box size<br>
   * r {float}: corner radius<br>
   * return {float}: distance
   */
  box2: `float box2(vec2 p, vec2 size, float r){
    return length(max(abs(p) - size, 0.0)) - r;
  }`,
}

/**
 * Error thrown by shader/*.glsl.
 * @param {number} err error message
 * @param {number} [code] error code
 * @class GlxError
 */
export function GlxError(err, code) {
	this.code = code;
	this.message = err;
	this.name = 'GlxError';
}

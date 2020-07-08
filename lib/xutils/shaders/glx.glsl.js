
/**Glsl sub functions */
export const glx = {
  /**Is the bit is true?
   * At least better than this:<br>
   * a = ...5, bit = 2 (start at 0), a_rem = a % 2^3 = 5, div = 5 / 4 >= 1
   * Reference: <a href='https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf'>
   * WebGL 1.0 API Quick Reference Card</a>
   * @param {object} vparas paras.vert_scale [optional] number scale of vertices
   * @return {object} {vertexShader, fragmentShader}
   * @member xglsl.bitTrue
   * @function
   */
  bitTrue: `
    bool bitTrue(int a, int bit) {
      float a_rem = mod(float(a), exp2(float(bit+1)));
      return a_rem / exp2(float(bit)) >= 1.;
    }`,

  /**Find distance to ellipsoid */
  sdEllipsoid: `
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
    }`,

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
}

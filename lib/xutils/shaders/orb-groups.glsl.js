
import {glx} from './glx.glsl';

/**<p id='orbGroups'>Get shader of a sequnce of orb groups, each for a wpos - an
 * vec3 array, with respect to vertex dir & cent attribute.</p>
 * Test page: test/html/map3d/geopaths.html<br>
 * ShaderFlag: worldOrbs
 * @param {object} vparas paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.orbGroups
 * @function
 */
export function orbGroups(vparas) {
 var grps = vparas.follows.length;
 var orbs = vparas.offsets.length;
 return { fragmentShader: `
  uniform float r[${orbs}];
  uniform vec3 orbColors[${orbs}];

  uniform float u_t;
  uniform float tmin;
  uniform float tmax;
  uniform float follows[${grps}];

  ${glx.u_whiteAlpha}
  uniform vec3 orbScale;
  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vtan; // ignored in v0.3
  varying vec3 vscale;
  varying vec3 vcent[${grps * orbs}];

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

  vec4 mainImage( in vec2 fragCoord ) {
    vec4 fragColor = vec4(0.);
    vec3 e = cameraPosition;
    vec3 u = normalize( P - cameraPosition );

    fragColor = vec4(0.);
    for (int j = 0; j < ${grps}; j++) {
      float flwj = follows[j] / 100.;
      if (tmin <= u_t - flwj && u_t - flwj <= tmax ) {
        for (int i = 0; i < ${orbs}; i++) {
            vec3 ci = vcent[j*${grps} + i];
            vec2 dists = sdEllipsoid( e, u, r[i], ci, vscale );

            // if (dists.x <= 0.00001) {
            //   ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
            //   continue;
            // }

            vec3 p = e + dists.x * u;
            vec3 n = normalize(p - ci);
            float ratio = abs(length(dists.x - dists.y)) / (2. * r[i]);
            ratio = clamp(ratio, 0., 1.);
            fragColor += vec4(pow( ratio, 4. ) * orbColors[i], ratio);
        }
      }
    }
    fragColor = clamp(fragColor, 0., 1.);

    float txAlpha = clamp(whiteAlpha, 0., 1.);
    // fragColor.a = 1. - txAlpha;

    // fragColor = mix(fragColor, texcolor, txAlpha);
    vec4 texcolor = texture2D(u_tex, vUv);
    texcolor.a = txAlpha;
    fragColor += texcolor;

    return clamp(fragColor, 0., 1.);
  }

  void main() {
    gl_FragColor = mainImage(gl_FragCoord.xy);
  }`,

 /* wpos[] group cent ( alone path )
    vec3 tan = normalize(a_tan);
    for (int i = 0; i < ${grps}; i++) {
      vfollows[i] = modelMatrix * (tan * follows[i] + cent[0]);
    }
 */
 vertexShader: `
  uniform vec3 wpos[${grps}];
  uniform vec3 wtan[${grps}];
  uniform float follows[${grps}];
  uniform vec3 orbScale;

  uniform float offsets[${orbs}];

  attribute vec3 a_tan;
  attribute vec3 a_pos;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 vtan; // ignored in v0.3
  varying vec3 vscale;
  varying vec3 vcent[${grps * orbs}];

  void main() {
    vUv = uv;
    vec4 v = projectionMatrix * modelViewMatrix * vec4( a_tan, 1.0 );
    vtan = v.xyz;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    vscale = orbScale;

    for (int j = 0; j < ${grps}; j++) {
      for (int i = 0; i < ${orbs}; i++) {
        if (length(a_tan) > 0.) {
          vec4 vc = modelMatrix * vec4(wpos[j] + normalize(a_tan) * offsets[i], 1.);
          vcent[j*${grps} + i] = vc.xyz;
        }
        else if (length(wtan[j]) > 0.) {
          vec4 vc = modelMatrix * vec4(wpos[j] + normalize(wtan[j]) * offsets[i], 1.);
          vcent[j*${grps} + i] = vc.xyz;
        }
        else {
          // vec4 vc = modelMatrix * vec4(wpos[j] + offsets[i], 1.);
          vec4 vc = modelMatrix * vec4(wpos[j], 1.);
          vcent[j*${grps} + i] = vc.xyz;
        }
      }
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

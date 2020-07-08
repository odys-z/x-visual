
import {glx} from './glx.glsl'

/**
 * It's supposed look like <a href='https://www.shadertoy.com/view/3ssGzn'>
 * Thermal Particles III @shadertoy</a>. And uv distortion can be done like
 * <a href='https://www.shadertoy.com/view/4sf3zS'>Texture twistery @shadertoy</a>,
 * with the help of color re-shaping:<pre>
     vec2 getDistortion(vec2 uv, float d, float t) {
      uv.x += cos(d) + t * 0.9;
      uv.y += sin(d + t * 0.75);
      return uv;
    }

    vec4 getDistortedTexture(sampler2D iChannel, vec2 uv) {
      vec4 rgb = texture(iChannel, uv);
      return rgb;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      vec2 uv = fragCoord.xy / iResolution.xy;
      float t = iTime * 0.125;
      vec2 mid = vec2(0.5,0.5);

      vec2 focus = iMouse.xy / iResolution.xy;
      float d1 = distance(focus+sin(t * 0.125) * 0.5, uv);
      float d2 = distance(focus+cos(t), uv);

      vec4 rgb = (getDistortedTexture(iChannel0, getDistortion(uv, d1, t))
                  + getDistortedTexture(iChannel1, getDistortion(uv, -d2, t))) * 0.5;
      rgb.r /= d2;
      rgb.g += -0.5 + d1;
      rgb.b = -0.5 + (d1 + d2) / 2.0;
      // rgb.a = pow(rgb.a, 0.125);
      // rgb.g = pow(rgb.g, 0.5);
      rgb.r = pow(rgb.r, 1.5) * (sin(t * 10.) + 1.) * 0.125;
      rgb.b = pow(rgb.b, 1.5) * (sin((t + 5.2) * 10.) + 1.) * 0.125;
      fragColor = rgb;
    } </pre>
 * @param {object} vparas paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.thremalTile
 * @function
 */
function tileOrbs(vparas) {
 var orbs = vparas.offsets.length || 1;
 var groups = vparas.geostyle.groups || 1;
 return {
  fragmentShader: `
    uniform float now;
    // uniform float speedFrag[${groups}];
    // uniform float speed;
    uniform float r[${orbs}];
    uniform vec4 orbColors[${orbs}];

    uniform float whiteAlpha;
    uniform vec3 orbScale;
    uniform sampler2D u_tex;

    varying vec2 vUv;
    varying vec3 P;
    varying vec3 vscale;
    varying vec4 vcent[${orbs}];
    varying float vspeed;

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

      // float speed = speedFrag[ int(tileIx) ];
      // float vspeed = .01;

      for (int i = 0; i < ${orbs}; i++) {
        vec3 ci = vcent[i].xyz;
        float ri = r[i];
        ri *= sin(now * vspeed * 0.6 + float(i) * 0.3) + 1.2;
        vec2 dists = sdEllipsoid( e, u, ri, ci, vscale );

        if (dists.x <= 0.00001) {
          ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
          continue;
        }

        vec3 p = e + dists.x * u;
        vec3 n = normalize(p - ci);
        float ratio = length(dists.x - dists.y) / (2. * ri);
        // working: fragColor += pow( clamp(ratio, 0.0, 1.), 8. * (sin(now * 0.001) + 1.75) ) * orbColors[i];
        // fragColor.r += pow( clamp(ratio, 0.0, 1.), 6. * (sin(now * speed + float(i) * 0.1      ) * 8. + 8.1) ) * orbColors[i].r;
        // fragColor.g += pow( clamp(ratio, 0.0, 1.), 8. * (sin(now * speed + float(i) * 0.1 + 0.01) * 9. + 9.6) ) * orbColors[i].g;
        // fragColor.b += pow( clamp(ratio, 0.0, 1.), 10. * (sin(now * speed + float(i) * 0.1 + 0.02) * 10. + 10.1) ) * orbColors[i].b;
        // fragColor.a += pow( clamp(ratio, 0.0, 1.), 11. * (sin(now * speed + float(i) * 0.1 + 0.03) * 10.5 + 10.6) ) * orbColors[i].a;

        fragColor += pow( clamp(ratio, 0.0, 1.), 8. + (abs(sin(now * vspeed + float(i) * 0.06)) * 4.) ) * orbColors[i];
        fragColor.a = 1.2 - ri;
      }
      fragColor = clamp(fragColor, 0., 1.);
      float txAlpha = clamp(whiteAlpha, 0., 1.);
      fragColor.a = 1. - txAlpha;

      vec4 texcolor = texture2D(u_tex, vUv);
      fragColor = mix(fragColor, texcolor, txAlpha);
      return fragColor;
    }

    void main() {
      gl_FragColor += mainImage(gl_FragCoord.xy);
    }`,

  vertexShader: `
    uniform float now;
    uniform float speedVert[${groups}];
    uniform float speedFrag[${groups}];
    // uniform float speed;
    uniform vec3 wpos;
    uniform vec3 offsets[${orbs}];
    uniform vec3 orbScale;

    attribute vec3 a_tan;
    attribute vec3 a_loc;

    varying vec2 vUv;
    varying vec3 P;
    varying vec3 vscale;
    varying vec4 vcent[${orbs}];
    varying float vspeed;

    void main() {
      vUv = uv;

      // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);

      P = worldPosition.xyz;
      vscale = orbScale;
      float speed = speedVert[ int(a_tan.y) ];
      vspeed = speedFrag[ int(a_tan.y) ];
      for (int i = 0; i < ${orbs}; i++) {
        vec3 offi = offsets[i] * 2. * sin(now * speed * 0.1 + float(i) * 0.3);
        vcent[i] = modelMatrix * vec4(a_loc + wpos + offi, 1.);
      }

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    } `
 }
}

export function thermalTile(vparas) {
 var orbs = vparas.offsets.length || 1;
 var groups = vparas.geostyle.groups || 1;
 return {
  fragmentShader: `
    uniform float now;
    uniform float r[${orbs}];
    uniform vec4 orbColors[${orbs}];
	uniform float maxHeight;

    uniform float whiteAlpha;
    uniform vec3 orbScale;
	uniform vec3 thermalColors[3];
    uniform sampler2D u_tex;

    varying vec2 vUv;
    varying vec3 P;
    varying vec3 vscale;
    varying vec4 vcent[${orbs}];
    varying float vspeed;
	varying float pos_y;
    ${glx.thermalColor}
    ${glx.sdEllipsoid}

    vec4 mainImage( in vec2 fragCoord ) {
      vec4 fragColor = vec4(0.);
      vec3 e = cameraPosition;
      vec3 u = normalize( P - cameraPosition );

      for (int i = 0; i < ${orbs}; i++) {
        vec3 ci = vcent[i].xyz;
        float ri = r[i];
        ri *= sin(now * vspeed * 0.6 + float(i) * 0.3) + 1.2;
        vec2 dists = sdEllipsoid( e, u, ri, ci, vscale );

        if (dists.x <= 0.00001) {
          ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
          continue;
        }

        vec3 p = e + dists.x * u;
        vec3 n = normalize(p - ci);
        float ratio = length(dists.x - dists.y) / (2. * ri);
        // working: fragColor += pow( clamp(ratio, 0.0, 1.), 8. * (sin(now * 0.001) + 1.75) ) * orbColors[i];
        fragColor += pow( clamp(ratio, 0.0, 1.), 8. + (abs(sin(now * vspeed + float(i) * 0.06)) * 4.) ) * orbColors[i];
        fragColor.a = 1.2 - ri;
      }
      fragColor = clamp(fragColor, 0., 1.);
      float txAlpha = clamp(whiteAlpha, 0., 1.);
      fragColor.a = 1. - txAlpha;

      // vec4 texcolor = texture2D(u_tex, vUv);
      // fragColor = mix(fragColor, texcolor, txAlpha);
	  vec4 thermal = thermalColor(thermalColors, vec2(0, maxHeight), pos_y);
      fragColor = mix(fragColor, thermal, txAlpha);
      return fragColor;
    }

    void main() {
      gl_FragColor += mainImage(gl_FragCoord.xy);
    }`,

  vertexShader: `
    uniform float now;
    uniform float speedVert[${groups}];
    uniform float speedFrag[${groups}];
    uniform vec3 wpos;
    uniform vec3 offsets[${orbs}];
    uniform vec3 orbScale;

    attribute vec3 a_tan;
    attribute vec3 a_loc;

    varying vec2 vUv;
    varying vec3 P;
    varying vec3 vscale;
    varying vec4 vcent[${orbs}];
    varying float vspeed;
	varying float pos_y;

    void main() {
      vUv = uv;
      pos_y = position.y;

      // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);

      P = worldPosition.xyz;
      vscale = orbScale;
      float speed = speedVert[ int(a_tan.y) ];
      vspeed = speedFrag[ int(a_tan.y) ];
      for (int i = 0; i < ${orbs}; i++) {
        vec3 offi = offsets[i] * 2. * sin(now * speed * 0.1 + float(i) * 0.3);
        vcent[i] = modelMatrix * vec4(a_loc + wpos + offi, 1.);
      }

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    } `
 }
}

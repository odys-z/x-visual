
import {glx} from './glx.glsl'
/**Render sdf texture in volumetric style.
 * floor texture.
 * @function
 *  */
export function texSDF(vparas = {}) {
 var {edgeWeight, xytile, yztile, xztile} = para4Layers(vparas);

 return { fragmentShader: `
  #define WEIGHT ${edgeWeight}

  uniform sampler2D u_tex;
  uniform float now;
  uniform vec4 u_hue;

  varying vec3 P;
  varying vec4 vcent;
  varying vec3 vxyzOffset;
  varying float vnorth;
  varying vec3 vsize[3];
  varying vec2 vtiles[3];

  varying float va;
  varying vec4 vColor;

  ${glx.box3}
  ${glx.rayPlaneInsec}
  ${glx.rotateY}

  float tessellate2( vec2 xz, vec2 c0, vec2 rectSize ) {
      vec2 d = xz - c0;
      vec2 modxz = mod ( d / rectSize, 2. );
      return modxz.x > 1. && modxz.y > 1. || modxz.x < 1. && modxz.y < 1. ?
             0.5 : 0.001;
  }

  float box3Color(vec3 e, vec3 i, vec3 c0, vec3 n0, float radi, vec3 size, vec2 tiles, float w) {
    n0 = rotateY(-radi, n0);
    vec4 p0 = rayPlaneInsec( e, i, c0, n0 );

    if (p0.w > 0.) {
      vec3 p_ = p0.xyz - c0;
      vec3 p_0 = rotateY(radi, p_);

      float box = box3( p_0, size * 0.5, 0.5 );
      box = 1.0/box * w * (1. - va);

      float tes = 0.02 * (1. - va) * ( 1. - abs( sin(now * 0.0005) ) );
      return max(box, 0.05) * tes + abs(box) * 0.004;
    }
    else return 0.;
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = 0.;

    vec3 i = normalize(P - cameraPosition);
    vec3 e = cameraPosition;

    for (int cx = 0; cx < ${yztile.layrs}; cx++) {
      vec3 ci = vcent.xyz + rotateY(-vnorth, vec3(float(cx) * ${yztile.layerDist} + vxyzOffset.x, 0., 0.));
      col += box3Color(e, i, ci, vec3(1., 0., 0.), vnorth, vsize[0], vtiles[1], WEIGHT);
    }

    for (int cx = 0; cx < ${xztile.layrs}; cx++) {
      vec3 ci = vcent.xyz + rotateY(-vnorth, vec3(0., float(cx) * ${xztile.layerDist} + vxyzOffset.y, 0.));
      col += box3Color(e, i, ci, vec3(0., 1., 0.), vnorth, vsize[1], vtiles[2], WEIGHT);
    }

    for (int cx = 0; cx < ${xytile.layrs}; cx++) {
      vec3 ci = vcent.xyz + rotateY(-vnorth, vec3(0., 0., float(cx) * ${xytile.layerDist} + vxyzOffset.z));
      col += box3Color(e, i, ci, vec3(0., 0., 1.), vnorth, vsize[2], vtiles[0], WEIGHT);
    }

    return u_hue * col;
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    gl_FragColor = mix(gl_FragColor, vColor, va * 0.9 + 0.1);
  }`,

 // a_box - xz: floor size, y: height ( layer's offset )
 vertexShader: `
  uniform float u_shininess;
  uniform vec4 u_color; // diffuse color
  uniform vec3 u_ambientColor;
  uniform vec3 u_specularColor;
  uniform vec3 u_lightColor;
  uniform vec3 u_lightPos;
  uniform float u_lightIntensity;
  uniform float u_alpha;

  uniform vec3 wpos;
  uniform vec3 u_offsetxyz;
  uniform float u_north;


  attribute vec3 a_box;
  attribute vec2 a_tiles;
  attribute vec3 a_loc;
  attribute float a_north;

  varying vec3 P;
  varying vec4 vcent;
  varying vec3 vxyzOffset;
  varying float vnorth;
  varying float va;
  varying vec3 vsize[3];
  varying vec2 vtiles[3];
  varying vec4 vColor;

  float buildingAlpha(vec3 e, vec3 P, vec3 np) {
    vec3 i = normalize(e - P);
    float a = dot( i, normalize(np) );
    return a > 0. ? 1. - a : 0.;
  }

  ${glx.phongLight}

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    vsize[0] = a_box ${yztile.boxsize};
    vsize[1] = a_box ${xztile.boxsize};
    vsize[2] = a_box ${xytile.boxsize};

    vtiles[0] = a_tiles ${xytile.tiles};
    vtiles[1] = a_tiles ${yztile.tiles};
    vtiles[2] = a_tiles ${xztile.tiles};

    vnorth = a_north + u_north;
    vxyzOffset = u_offsetxyz;

    P = worldPosition.xyz; // /worldPosition.w; // v0.3.33
    va = buildingAlpha(cameraPosition, P, normal);
    va *= u_alpha;

    vcent = modelMatrix * vec4( a_loc + wpos, 1. );

    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    // float Ka = 1.0;
    // float Kd = 1.0;
    // float Ks = 1.0;
    //
    vec3 N = normalize(normalMatrix * normal);
    // vec3 vertPos = worldPosition.xyz/worldPosition.w;
    // vec3 L = normalize(u_lightPos - worldPosition.xyz);
    //
    // vec2 lambershine = lambertShine(N, L, vertPos, u_shininess);
    // vColor = vec4(Ka * u_ambientColor.xyz
    //             + Kd * lambershine.s * u_color.xyz
    //             + Ks * lambershine.t * u_specularColor
    //             , u_alpha);
    vColor = phongLight(N, u_lightPos, worldPosition,
            u_ambientColor.xyz, u_color.xyz, u_specularColor.xyz, u_shininess)
            * u_lightIntensity;
  } `
 }
}

// color alpha hilighted at corner
function texPrism_alpha_corner(vparas) {
 var ptile = vparas.tile || {};
 var layrs = ptile.layers || 3;
 var vtiles = ptile.change ? ' vtiles / float(cx + 1) ' : ' vtiles ';
 return { fragmentShader: `
  #define WEIGHT 3.4

  uniform vec4 u_hue,
  uniform sampler2D u_basetex;
  uniform sampler2D u_lateraltex;
  uniform float now;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying float va;
  varying vec2 vsize;
  varying vec2 vtiles;
  ${glx.box2}
  ${glx.rayPlaneInsec}

  // filter p with base texture
  float baseTex(vec2 p, vec2 box, float r) {
    float d = box2(p, box, r);
    if (d <= 0.) {
      vec2 modxz = mod ( p, box * 0.5 / vtiles );
      return d * (texture2D ( u_basetex, modxz / box )).a;
    }
    else return 0.0;
  }

  float tessellate2( vec2 xz, vec2 c0, vec2 rectSize ) {
      vec2 d = xz - c0;
      vec2 modxz = mod ( d / rectSize, 2. );
      return modxz.x > 1. && modxz.y > 1. || modxz.x < 1. && modxz.y < 1. ?
             1. : 1000.;
  }

  // rasterize functions
  // get xz plane box distance color
  float boxY(vec3 e, vec3 P, vec3 c0, vec2 size, vec2 tiles, float w) {
    vec4 p0d = rayPlaneInsec( e, normalize(P - e), c0, vec3(0., 1., 0.) );
    if (p0d.w > 0.) {
      float tes = tessellate2( p0d.xz, c0.xz, size * 0.5 / tiles );
      float d = baseTex( p0d.xz, size * 0.5, 5. );
      d = 1.0/d * w * (1. - va);
      tes = 0.4/tes * (1. - va) * ( 1. - abs( sin(now * 0.001) ) );
      return abs(d) * tes + abs(d) * 0.02;
    }
    else return 0.;
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = boxY(cameraPosition, P, cent[0].xyz, vec2(280., 92.), vec2(6., 3.), WEIGHT);
    // return vec4(0., col * 0.2, 0.8, col);
    return u_hue * col;
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    gl_FragColor.a += va;
  }`,

 vertexShader: `
  uniform vec3 wpos;

  attribute vec3 a_box;
  attribute vec2 a_tiles;
  attribute vec3 a_prevert;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying float va;
  varying vec2 boxsize;
  varying vec2 vtiles;

  float buildingAlpha(vec3 e, vec3 P, vec3 np) {
    vec3 i = normalize(e - P);
    float a = dot( i, normalize(np) );
    return a > 0. ? 1. - a : 0.;
  }

  void main() {
    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    vec4 _p = modelMatrix * vec4(a_prevert, 1.0);
    vec3 n = cross(P - _p.xyz, normal);
    va = buildingAlpha(cameraPosition, P, normal);
    vtiles = a_tiles + vec2(3, 1.5);

    for (int i = 0; i < ${layrs}; i++){
      // cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
      // cent[i] = modelMatrix * vec4(0.);
      float h = a_box.y / float(${layrs});
      if (h == 0.) h = 10.;
      cent[i] = modelMatrix * vec4(0., h * float(i) - a_box.y * 0.5, 0., 1.);
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

function para4TexSDF(vparas) {
    const w = vparas.edgeWeight;
    const edgeWeight = w !== undefined ?
                        `(float(${w}))` : '(3.4)';

    if (vparas.xytile && vparas.xytile.box.length === 2)
         vparas.xytile.box = [vparas.xytile.box[0], vparas.xytile.box[1], 0];

    if (vparas.yztile && vparas.yztile.box.length === 2)
         vparas.yztile.box = [0, vparas.yztile.box[0], vparas.yztile.box[1]];

    if (vparas.xztile && vparas.xztile.box.length === 2)
         vparas.xztile.box = [vparas.xztile.box[0], 0, vparas.xztile.box[1]];


    return { edgeWeight,
            xytile: tile(vparas.xytile),
            yztile: tile(vparas.yztile),
            xztile: tile(vparas.xztile) };

    function tile( ptile = {} ) {
        var layrs = ptile.layers || 0;
        var vtiles = ptile.change ? ' vtiles / float(cx + 1) ' : ' vtiles ';

        // boxsize can preventing vsize = vec2(0.) when using three.js geometry (no a_box)
        var boxsize = '';
        if (ptile.box) {
            boxsize = `+ vec3(float(${ptile.box[0]}), float(${ptile.box[1]}), float(${ptile.box[2]}))`;
        }

        // fragmentShader: vtiles[i] = a_tiles ${xztile.tiles};
        var tiles = '';
        if (ptile.tiles) {
            tiles = `+ vec2(float(${ptile.tiles[0]}), float(${ptile.tiles[1]}))`;
        }

        var layerDist = ptile.layerDist ?
                        `(float(${ptile.layerDist}))` : '(0.)';

        return {layrs, boxsize, tiles, layerDist};
    }
}

// works for line but hard to find segments, see
// https://homepage.univie.ac.at/Franz.Vesely/notes/hard_sticks/hst/hst.html
function texPrism_line_dist(vparas) {
 var layrs = vparas.layars || 3;
 return { fragmentShader: `
  #define WEIGHT 0.4

  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 P0;
  varying vec3 P1;
  varying vec3 P2;
  varying vec3 P3;
  varying vec4 cent[${layrs}];

  // https://math.stackexchange.com/questions/2213165/find-shortest-distance-between-lines-in-3d
  // 𝐧 = 𝐞1 × 𝐞2 = (−20,−11,−26)
  // rasterize functions
  float line(vec3 e, vec3 P, vec3 p0, vec3 p1, float w) {
    vec3 e2 = p1 - p0;
    vec3 e1 = P - e;
    vec3 n = normalize(cross(e1, e2));
    float dist = dot(n, e - p0);
    dist = 1.0/dist * WEIGHT * w;
    // return min(dist * dist, 1.0);
    return abs(dist);
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float line_width = 0.4;
    float col = line(cameraPosition, P, P0, P1, line_width);
    col += line(cameraPosition, P, P2, P3, line_width);
    return vec4(col);
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    gl_FragColor.g += 0.7;
    gl_FragColor.a += 0.2;
  }`,

 vertexShader: `
  uniform vec3 wpos;
  uniform vec3 offsets[${layrs}];
  uniform vec3 orbScale;

  attribute vec3 a_tan;
  attribute vec3 a_pos;

  varying vec2 vUv;
  varying vec3 P;
  varying vec3 P0;
  varying vec3 P1;
  varying vec3 P2;
  varying vec3 P3;
  varying vec3 vscale;
  varying vec4 cent[${layrs}];

  void main() {
    // vUv = uv;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    vscale = orbScale;
    for (int i = 0; i < ${layrs}; i++){
      // cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
      cent[i] = worldPosition;
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    vec4 v4 =  modelMatrix * vec4(  vec3(-150., 0., -50.), 1.0 );
    P0 = v4.xyz;
    v4 = modelMatrix * vec4(  vec3(150., 0., -50.), 1.0 );
    P1 = v4.xyz;

    v4 = modelMatrix * vec4(  vec3(0., 150., 50.), 1.0 );
    P2 = v4.xyz;
    v4 = modelMatrix * vec4(  vec3(0., -150., 50.), 1.0 );
    P3 = v4.xyz;

    v4 = projectionMatrix * modelViewMatrix * vec4(uv.s, uv.t, 0., 1.0);
    vUv = v4.xy; // / v4.z;
  } `
 }
}

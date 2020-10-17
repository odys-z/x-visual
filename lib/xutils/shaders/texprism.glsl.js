
import {glx, initPhongUni, updatePhongUni} from './glx.glsl';

/**Render prism extruded from xz polygon, with texture on roof and leteral faces.
 * @see glx.boxLayers for a try to shade building floor without the floor texture.
 * @param {object=} vparas Visual.paras
 * @param {opbject=} vparas.tile tile texture parameters, see test for examples
 * @member xglsl.texPrism
 * @function
 *  */
export function texPrism(vparas = {}) {
 var ptile = vparas.tile || {};
 var layrs = ptile.layers || 1; // with a roof layer
 var vtiles = ptile.change ? ' vtiles / float(cx + 1) ' : ' vtiles ';
 var boxsize = ptile.box ? `+ vec2( float(${ptile.box[0]}), float(${ptile.box[1]}) )` : '';
 // var vUv = vparas.uvScale ? ` (mod(uv * vec2(float(${vparas.uvScale[0]}), float(${vparas.uvScale[1]})), vec2(1.) )) ` : '(uv)';
 var uv_vert = vparas.uvScale ? `(uv * vec2(float(${vparas.uvScale[0]}), float(${vparas.uvScale[1]})))` : '(uv)';

 const w = ptile.edgeWeight || vparas.edgeWeight;
 const edgeWeight = w !== undefined ?
                     `(float(${w}))` : '(3.4)';

 const roofAlpha = `(float(${vparas.whiteAlphas ? vparas.whiteAlphas[0] : 0.7}))`;
 const sideAlpha = `(float(${vparas.whiteAlphas ? vparas.whiteAlphas[1] : 0.9}))`;
 // const floorAlpha = `(float(${vparas.whiteAlphas ? vparas.whiteAlphas[2] : 0.95}))`

 // shadow
 var receiveShadow = vparas.dirShadow;
 const n_dirLight = '1';

 // DESIGN MEMO: sampler2D arry can't work, neither colorArray?
 // vxzWeight: the xz plane's color weight (possibility of roof)
 return { fragmentShader: `
  #define WEIGHT ${edgeWeight}

  uniform vec4 u_hue;
  uniform sampler2D u_tex0, u_tex1, u_tex2, u_tex3, u_tex4, u_tex5, u_tex6, u_tex7;
  uniform sampler2D u_tex[3]; // [roof, lateral, floor]
  uniform float now;
  uniform float u_lightIntensity;

  varying vec2 vUv;
  varying float va;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying vec2 vsize;
  varying vec2 vtiles;
  varying float vxzWeight;
  ${glx.box2}
  ${glx.intenseAlpha}
  ${glx.fractuv}
  ${glx.rayPlaneInsec}
  ${!receiveShadow ? '' : glx.shadow.frag}

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
      float box = box2( p0d.xz - c0.xz, size * 0.5, 0.5 );
      box = 1.0/box * w * (1. - va);
      tes = 0.4/tes * (1. - va) * ( 1. - abs( sin(now * 0.0005) ) );
      return abs(box) * tes + abs(box) * 0.02;
    }
    else return 0.;
  }

  vec4 texY(vec3 e, vec3 P, vec3 c0, vec2 size, vec2 tiles, vec2 boader) {
    vec4 p0d = rayPlaneInsec( e, normalize(P - e), c0, vec3(0., 1., 0.) );
    if (p0d.w > 0.) {
      float box = box2( p0d.xz - c0.xz, size * 0.5, 0.5 );
      box = 1.0/box * boader.s * (1. - va);
      return texture2D( u_tex0, (.5 - (p0d.xz - c0.xz) / size) );
    }
    else return vec4(0.);
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = 0.;`
    // floors
	+ `
    for (int cx = 0; cx < ${layrs}; cx++)
      col += boxY(cameraPosition, P, cent[cx].xyz, vsize, ${vtiles} * 0.5, WEIGHT);
    vec4 col4 = u_hue * col;` +

    // it's upward base (roof)
	`
    if (vxzWeight > 0.9) {
        col4 = mix(col4,
            texY(cameraPosition, P, cent[${layrs} - 1].xyz, vsize, vtiles * 0.5, vec2(WEIGHT)),
            ${roofAlpha});
    }
    return col4;
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy); `

    // it's lateral face
	+`
    if (vxzWeight <= 0.9) {
        gl_FragColor = mix(gl_FragColor, texture2D(u_tex1, fractuv(vUv)),
                           ${sideAlpha});
    }

	gl_FragColor.xyz *= u_lightIntensity;
    ${!receiveShadow ? '' : 'gl_FragColor.xyz *= shadow();'}
  }`,

 // a_box - xz: floor size, y: floor height ( layer's offset )
 // a_loc - prism center in model, y: height
 vertexShader: `
  uniform float u_shininess;
  uniform vec4 u_color; // diffuse color
  uniform vec3 u_ambientColor;
  uniform vec3 u_specularColor;
  uniform vec3 u_lightColor;
  uniform vec3 u_lightPos;
  uniform float u_lightIntensity;
  ${glx.u_alpha}
  uniform mat4 directionalShadowMatrix[ ${n_dirLight} ];

  attribute vec3 a_box;
  attribute vec2 a_tiles; // x-div, z-div
  attribute vec3 a_loc;

  varying vec2 vUv;
  varying float va;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying vec2 vsize;
  varying vec2 vtiles;
  varying float vxzWeight;

  ${glx.phongLight}
  ${glx.buildingAlpha}
  ${!receiveShadow ? '' : glx.shadow.setShadowCoords(1)}

  void main() {
    vUv = ${uv_vert};
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    vsize = a_box.xz ${boxsize};
    vtiles = a_tiles; // + vec2(1, 1);
    P = (worldPosition).xyz;
    va = buildingAlpha(cameraPosition, P, normal);
    vxzWeight = dot(vec3(0., 1., 0.), normal);

    for (int i = 0; i < ${layrs} - 1; i++){
      float h = a_box.y / float(${layrs});
      if (h == 0.) h = 10.;

      vec3 loc = vec3(a_loc.x, 0, a_loc.z) + vec3(0., h * float(i) * 0.5, 0.);
      cent[i] = modelMatrix * vec4(loc, 1.);
    }
    cent[${layrs} - 1] = modelMatrix * vec4(a_loc[0], a_box[1], a_loc[2], 1.); // roof

    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    ${!receiveShadow ? '' : 'setShadowCoords(directionalShadowMatrix, worldPosition)'};
  } `
 }
}

texPrism.initUniform = initPhongUni;
texPrism.updateUniform = updatePhongUni;

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

  ${glx.buildingAlpha}

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
  // 𝐧 = 𝐞1 × 𝐞2 = (−20, −11, −26)
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

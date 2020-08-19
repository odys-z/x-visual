
import {glx} from './glx.glsl'
/**Render sdf texture in volumetric style.
 * floor texture.
 * @function
 *  */
export function texSDF(vparas = {}) {
 var {edgeWeight, xytile, yztile, xztile} = para4Layers(vparas);

 // if in box, get color on yz, xz, xy
 return { fragmentShader: `
  #define WEIGHT ${edgeWeight}

  uniform sampler2D u_tex;
  uniform float now;
  uniform vec4 u_hue;

  varying vec4 vP;
  varying vec4 vcent;
  varying vec3 vxyzOffset;
  varying float vnorth;
  varying vec3 vsize;

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

  vec3 = fallinCube(vec4 pos, vec3 size) {

  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = 0.;

    vec3 i = normalize(P - cameraPosition);
    vec3 e = cameraPosition;

    vec3 cube = fallinCube(vP, vsize);

    float d3 = box3( p_0, size * 0.5, 0.5 );
    if (d3 > 0.) {
      vec3 cx = cube + rotateY(-vnorth, vec3(vsize.x, 0., 0.));
      col += box3Color(e, i, cx, vec3(1., 0., 0.), vnorth, vsize * 2., vec2(1.), WEIGHT);

      vec3 cy = cube + rotateY(-vnorth, vec3(0., vsize.y, 0.));
      col += box3Color(e, i, cy, vec3(0., 1., 0.), vnorth, vsize * 2., vec2(1.), WEIGHT);

      vec3 cz = cube + rotateY(-vnorth, vec3(0., 0., vsize.z));
      col += box3Color(e, i, cz, vec3(0., 0., 1.), vnorth, vsize * 2., vec2(1.), WEIGHT);
    }

    // for (int cx = 0; cx < 3; cx++) {
    //   vec3 ci = vcent.xyz + rotateY(-vnorth, vec3(float(cx) * 20. + vxyzOffset.x, 0., 0.));
    //   col += box3Color(e, i, ci, vec3(1., 0., 0.), vnorth, vsize[0], vtiles[1], WEIGHT);
    // }
    // for (int cx = 0; cx < 3; cx++) {
    //   vec3 ci = vcent.xyz + rotateY(-vnorth, vec3(0., float(cx) * 20. + vxyzOffset.y, 0.));
    //   col += box3Color(e, i, ci, vec3(0., 1., 0.), vnorth, vsize[1], vtiles[2], WEIGHT);
    // }
    // for (int cx = 0; cx < 3; cx++) {
    //   vec3 ci = vcent.xyz + rotateY(-vnorth, vec3(0., 0., float(cx) * 20. + vxyzOffset.z));
    //   col += box3Color(e, i, ci, vec3(0., 0., 1.), vnorth, vsize[2], vtiles[0], WEIGHT);
    // }

    return u_hue * col;
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    gl_FragColor = mix(gl_FragColor, vColor, va * 0.9 + 0.1);
  }`,

 vertexShader: `
  ${glx.u_alpha}
  uniform float u_lightIntensity;

  varying vec4 vP;
  varying vec3 vnormal;
  // varying vec3 vertPos;
  varying float vAlpha;
  varying float vfresnel;
  varying vec2 vUv;

  varying vec3 vmorphColor;
  varying float vIntense;

  ${vertBlender}
  vec3 morphColors() {
    vec3 colori = u_colors[0];
    ${morphvert}
    return colori;
  }

  ${glx.intenseAlpha}
  ${glx.fresnelAlpha}

  void main(){
    vUv = uv;
    vAlpha = u_alpha;
    vfresnel = fresnelAlpha(cameraPosition, P, normal);
    vIntense = intenseAlpha(u_lightIntensity);
    vnormal = normalMatrix * normal;
    vmorphColor = morphColors();

    vec4 vP = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * vP;
  }`,
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

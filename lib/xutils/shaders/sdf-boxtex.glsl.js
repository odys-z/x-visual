
import {glx} from './glx.glsl'
/**Render sdf texture in volumetric style.
 * floor texture.
 * @function
 *  */
export function cubeTex(vparas = {}) {
 var {edgeWeight, cubes} = para4Cubetex(vparas);

 // if in box, get color on yz, xz, xy
 return { fragmentShader: `
  #define WEIGHT ${edgeWeight}

  uniform sampler2D u_tex;
  uniform float now;
  uniform vec4 u_hue;

  varying vec4 vP;
  varying vec3 vmodP;
  varying vec3 vxyzOffset;
  varying float vnorth;
  varying vec3 vsize;

  varying float va;
  varying float vfresnel;
  varying vec3 vColor;

  ${glx.box3}
  ${glx.line}
  ${glx.rayPlaneInsec}
  ${glx.rotateY}

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

  // get center of cube at pos
  vec3 innerCube(vec3 mpos, vec3 size, vec3 cubes) {
    return vec3(-0., 0., 0.);
  }

  vec3 outerCube(vec3 inner, vec3 size) {
    return inner - size * 0.5;
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = 0.;

    vec3 i = normalize(vP.xyz - cameraPosition);
    vec3 e = cameraPosition;

    vec3 cube = innerCube(vmodP, vsize, vec3(4., 3., 2.));
    vec3 cub1 = outerCube(cube, vsize);

    float d3 = box3( vP.xyz - cube, vsize * 0.5, 0. );
    if (d3 <= 0.) {
      col = 1.0;
      col += box3Color(e, i, cub1, vec3(1., 0., 0.), vnorth, vsize * 2., vec2(1.), WEIGHT);

      col += box3Color(e, i, cub1, vec3(0., 1., 0.), vnorth, vsize * 2., vec2(2.), WEIGHT * 0.5);
      col += box3Color(e, i, vec3(cube.x, cub1.y, cube.z), vec3(0., 1., 0.), vnorth, vsize, vec2(1.), WEIGHT);

      col += box3Color(e, i, cub1, vec3(0., 0., 1.), vnorth, vsize * 2., vec2(1.), WEIGHT);

	  col += line(e, vP.xyz, vec3(0., -10., 0.), vec3(50., -10, 0.), WEIGHT);
    }
	else col = .4;

    return vec4(0.5) * col;
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    // gl_FragColor = mix(gl_FragColor, vec4(vColor, 1.), va * 0.9 + 0.1);
  }`,

 vertexShader: `
  ${glx.u_alpha}
  uniform float u_lightIntensity;
  uniform float u_north;

  attribute float a_north;

  varying vec4 vP;
  varying vec3 vmodP;
  varying vec3 vnormal;
  varying vec3 vsize;
  varying float vnorth;
  varying float va;
  varying float vfresnel;
  varying vec2 vUv;

  varying vec3 vColor;
  varying float vIntense;

  vec3 morphColors() {
    // vec3 colori = u_colors[0];
    // return colori;
    return vec3(0.5, 0.5, 0.5);
  }

  ${glx.intenseAlpha}
  ${glx.fresnelAlpha}
  ${glx.buildingAlpha}

  void main(){
    vUv = uv;

	vmodP = position;
    vP = modelMatrix * vec4(position, 1.0);
    vfresnel = fresnelAlpha(cameraPosition, vP.xyz, normal);
    va = buildingAlpha(cameraPosition, vP.xyz, normal);

    vIntense = intenseAlpha(u_lightIntensity);
    vnormal = normalMatrix * normal;
    vColor = morphColors();
	vsize = vec3(80., 40., 80.);

    vec4 vP = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * vP;
  }`,
 }
}

export function cubeTex_2(vparas = {}) {
 var {edgeWeight, cubes} = para4Cubetex(vparas);

 // if in box, get color on yz, xz, xy
 return { fragmentShader: `
  #define WEIGHT ${edgeWeight}

  uniform sampler2D u_tex;
  uniform float now;
  uniform vec4 u_hue;

  varying vec4 vP;
  varying vec3 vmodP;
  varying vec3 vxyzOffset;
  varying float vnorth;
  varying vec3 vsize;

  varying float va;
  varying float vfresnel;
  varying vec3 vColor;

  ${glx.box3}
  ${glx.line}
  ${glx.rayPlaneInsec}
  ${glx.rotateY}

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

  // get center of cube at pos
  vec3 innerCube(vec3 mpos, vec3 size, vec3 cubes) {
    return vec3(-0., 0., 0.);
  }

  vec3 outerCube(vec3 inner, vec3 size) {
    return inner - size * 0.5;
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = 0.;

    vec3 i = normalize(vP.xyz - cameraPosition);
    vec3 e = cameraPosition;

    vec3 cube = innerCube(vmodP, vsize, vec3(4., 3., 2.));
    vec3 cub1 = outerCube(cube, vsize);

    float d3 = box3( vP.xyz - cube, vsize * 0.5, 0. );
    if (d3 <= 0.) {
      col = 1.0;
      col += box3Color(e, i, cub1, vec3(1., 0., 0.), vnorth, vsize * 2., vec2(1.), WEIGHT);

      col += box3Color(e, i, cub1, vec3(0., 1., 0.), vnorth, vsize * 2., vec2(2.), WEIGHT * 0.5);
      col += box3Color(e, i, vec3(cube.x, cub1.y, cube.z), vec3(0., 1., 0.), vnorth, vsize, vec2(1.), WEIGHT);

      col += box3Color(e, i, cub1, vec3(0., 0., 1.), vnorth, vsize * 2., vec2(1.), WEIGHT);

	  col += line(e, vP.xyz, vec3(0., -10., 0.), vec3(50., -10, 0.), WEIGHT);
    }
	else col = .4;

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

    // return u_hue * col;
    return vec4(0.5) * col;
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    // gl_FragColor = mix(gl_FragColor, vec4(vColor, 1.), va * 0.9 + 0.1);
  }`,

 vertexShader: `
  ${glx.u_alpha}
  uniform float u_lightIntensity;
  uniform float u_north;

  attribute float a_north;

  varying vec4 vP;
  varying vec3 vmodP;
  varying vec3 vnormal;
  varying vec3 vsize;
  varying float vnorth;
  varying float va;
  varying float vfresnel;
  varying vec2 vUv;

  varying vec3 vColor;
  varying float vIntense;

  vec3 morphColors() {
    // vec3 colori = u_colors[0];
    // return colori;
    return vec3(0.5, 0.5, 0.5);
  }

  ${glx.intenseAlpha}
  ${glx.fresnelAlpha}
  ${glx.buildingAlpha}

  void main(){
    vUv = uv;

	vmodP = position;
    vP = modelMatrix * vec4(position, 1.0);
    vfresnel = fresnelAlpha(cameraPosition, vP.xyz, normal);
    va = buildingAlpha(cameraPosition, vP.xyz, normal);

    vIntense = intenseAlpha(u_lightIntensity);
    vnormal = normalMatrix * normal;
    vColor = morphColors();
	vsize = vec3(80., 40., 80.);

    vec4 vP = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * vP;
  }`,
 }
}

function para4Cubetex(vparas) {
    const w = vparas.edgeWeight;
    const edgeWeight = w !== undefined ?
                        `(float(${w}))` : '(3.4)';

    if (!vparas.cube || !vparas.cube.cubes)
         vparas.cube.cubes = [2, 2, 1];


    return { edgeWeight,
             cubes: vparas.cube.cubes };

}

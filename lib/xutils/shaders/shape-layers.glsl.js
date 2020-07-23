import {glx} from './glx.glsl'
/**Render tiled xz plane, bound by a area texture.
 * @see glx.tiledLayers for a try to shade building floor without the
 * floor texture.
 * @function
 *  */
export function shapeLayers(vparas) {
 var layrs = vparas.layars || 3;
 return { fragmentShader: `
  #define WEIGHT 3.4

  uniform sampler2D u_floor;
  uniform float now;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying float va;
  ${glx.box2}

  // filter p with uv box
  float texFilt(vec2 p, vec2 box, float r) {
    float d = box2(p, box, r);
    if (d <= 0.)
      return sampler2D(u_floor, ((p / box) % tiles) / box).
    else return 0;
  }

  // ray plane intersection
  // https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection#Algebraic_form
  vec4 rayPlaneInsec(vec3 l0, vec3 l, vec3 p0, vec3 n) {
    float d = dot( (p0 - l0), n );
    float l_n = dot(l, n);
    if (l_n == 0.) {
      if (dot(p0 - l0, n) == 0.)
        return vec4(l0, 0.); // in plane
      else return vec4(p0, -1.); // parallel
    }
    d /= l_n;
    vec3 p_ = l0 + normalize(l) * d;
    return vec4(p_, abs(d));
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
      float d = texFilt( p0d.xz, size * 0.5, 5. );
      d = 1.0/d * w * (1. - va);
      tes = 0.4/tes * (1. - va) * ( 1. - abs( sin(now * 0.01) ) );
      return abs(box) * tes + abs(box) * 0.02;
    }
    else return 0.;
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = boxY(cameraPosition, P, cent[0].xyz, vec2(280., 92.), vec2(6., 3.), WEIGHT);
    return vec4(0., col * 0.2, 0.8, col);
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    gl_FragColor.g += 0.7;
    gl_FragColor.a += va;
  }`,

 vertexShader: `
  uniform vec3 wpos;
  uniform vec3 offsets[${layrs}];

  attribute vec3 a_tan;
  attribute vec3 a_pos;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying float va;
  varying vec2 boxsize;

  float buildingAlpha(vec3 e, vec3 P, vec3 np) {
    vec3 i = normalize(e - P);
    float a = dot( i, normalize(np) );
    return a > 0. ? 1. - a : 0.;
  }

  void main() {
    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    va = buildingAlpha(cameraPosition, P, normal);
    for (int i = 0; i < ${layrs}; i++){
      cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
      // cent[i] = modelMatrix * vec4(0.);
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

/**This shader can render a tessellated xz plane in a box model. The problem is
 * it can't finding out distance to a polygon to restrict the floor area. There
 * is an example by Inigo Quilez [2] that can figure out distance quickly in
 * fragment shader but the problem is we can't find out an efficient way to send
 * polygon info into fragment via with webgl [3].<br>
 * Reference:<br>
 * [1] <a href='https://www.shadertoy.com/view/MsjSzz'>Da Rasterizer,
 * Example of fragment matrix operation</a>.
 * Simplified: <pre>
    #define WEIGHT (12.0 / iResolution.x)

    // rasterize functions
    float line(vec2 p, vec2 p0, vec2 p1, float w) {
        vec2 d = p1 - p0;
        float t = clamp(dot(d,p-p0) / dot(d,d), 0.0,1.0);
        vec2 proj = p0 + d * t;
        float dist = length(p - proj);
        dist = 1.0/dist * WEIGHT * w;
        return min(dist*dist,1.0);
    }

    // matrices
    mat4 getRotMatrix(vec3 a) {
        vec3 s = sin(a);
        vec3 c = cos(a);
        mat4 ret;
        ret[0] = vec4(c.y*c.z,c.y*s.z,-s.y,0.0);
        ret[1] = vec4(s.x*s.y*c.z-c.x*s.z,s.x*s.y*s.z+c.x*c.z,s.x*c.y,0.0);
        ret[2] = vec4(c.x*s.y*c.z+s.x*s.z, c.x*s.y*s.z-s.x*c.z,   c.x*c.y,0.0);
        ret[3] = vec4(0.0,0.0,0.0,1.0);
        return ret;
    }
    mat4 getPosMatrix(vec3 p) {
        mat4 ret;
        ret[0] = vec4(1.0,0.0,0.0,p.x);
        ret[1] = vec4(0.0,1.0,0.0,p.y);
        ret[2] = vec4(0.0,0.0,1.0,p.z);
        ret[3] = vec4(0.0,0.0,0.0,1.0);
        return ret;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
        vec2 uv = fragCoord.xy / iResolution.xy;
        uv = uv * 2.0 - 1.0;
        uv.x *= iResolution.x / iResolution.y;

        float line_width = 0.4;
        float time = iTime * 0.31415;
        vec3 c = vec3(mix(vec3(0.19,0.13,0.1),vec3(1.0), 0.5*pow(length(uv)*0.5,2.0)));
        mat4 cam = getPosMatrix(vec3(0.0,0.0,10.0));

        mat4 rot = getRotMatrix(vec3(time,time*0.86,time*0.473));

        vec3 instances[2];
        instances[0] = vec3( 0.0, 0.0,-1.0);

        // box pipeline
        for(int dip = 0; dip < 2; dip++) {

            // input assembly
            vec3 vert[8];
            vert[0] = vec3(-1.0,-1.0, 1.0);
            vert[1] = vec3(-1.0, 1.0, 1.0);
            vert[2] = vec3( 1.0, 1.0, 1.0);
            vert[3] = vec3( 1.0,-1.0, 1.0);
            vert[4] = vec3(-1.0,-1.0,-1.0);
            vert[5] = vec3(-1.0, 1.0,-1.0);
            vert[6] = vec3( 1.0, 1.0,-1.0);
            vert[7] = vec3( 1.0,-1.0,-1.0);

            // vertex processing
            mat4 pos = getPosMatrix(instances[dip] * 4.0);
            mat4 mat = pos * rot * cam;

            for(int i = 0; i < 8; i++) {

                // transform
                vert[i] = (vec4(vert[i],1.0) * mat).xyz;

                // perspective
                vert[i].z = 1.0 / vert[i].z;
                vert[i].xy *= vert[i].z;
            }

            // primitive assembly and rasterize
            float i;
            i  = line(uv,vert[0].xy,vert[1].xy,line_width);
            i += line(uv,vert[1].xy,vert[2].xy,line_width);
            i += line(uv,vert[2].xy,vert[3].xy,line_width);
            i += line(uv,vert[3].xy,vert[0].xy,line_width);
            i += line(uv,vert[4].xy,vert[5].xy,line_width);
            i += line(uv,vert[5].xy,vert[6].xy,line_width);
            i += line(uv,vert[6].xy,vert[7].xy,line_width);
            i += line(uv,vert[7].xy,vert[4].xy,line_width);
            i += line(uv,vert[0].xy,vert[4].xy,line_width);
            i += line(uv,vert[1].xy,vert[5].xy,line_width);
            i += line(uv,vert[2].xy,vert[6].xy,line_width);
            i += line(uv,vert[3].xy,vert[7].xy,line_width);

            c += clamp(i, 0., 1.);
        }

        fragColor = vec4(c,1.0);
    }</pre>
 * See also another <a href='https://www.shadertoy.com/view/Xlf3zl'>interesting
 * example</a>.<br>
 * [2]
 * To find out distance to a polygon in a plane, one can use
 * <a href='http://geomalgorithms.com/a03-_inclusion.html'>the Winding Number
 * Algorithm</a>.<br>
 * The shadertoy example can be found <a href='https://www.shadertoy.com/view/wdBXRW'>
 * here by iq</a>. A simplified version showing wn=2 are rendered as outside:<pre>
    // The MIT License
    // Copyright © 2019 Inigo Quilez

    // Distance to a regular pentagon, without trigonometric functions.
    float dot2( in vec2 v ) { return dot(v,v); }
    float cross2d( in vec2 v0, in vec2 v1) { return v0.x*v1.y - v0.y*v1.x; }

    const int N = 9;

    float sdPoly( in vec2[N] v, in vec2 p ) {
        const int num = v.length();
        float d = dot(p-v[0],p-v[0]);
        float s = 1.0;
        for( int i=0, j=num-1; i<num; j=i, i++ ) {
            // distance
            vec2 e = v[j] - v[i];
            vec2 w =    p - v[i];
            vec2 b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
            d = min( d, dot(b,b) );

            // winding number from http://geomalgorithms.com/a03-_inclusion.html
            bvec3 cond = bvec3( p.y>=v[i].y, p.y<v[j].y, e.x*w.y>e.y*w.x ); // e.x / e.y > w.x / w.y
            if( all(cond) || all(not(cond)) ) s *= -1.0;
        }

        return s * sqrt(d);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
        vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;

        vec2 v0 = 0.8*cos( 0.40*iTime + vec2(0.0,2.00) + 0.0 );
        vec2 v1 = 0.8*cos( 0.45*iTime + vec2(0.0,1.50) + 1.0 );
        vec2 v2 = 0.8*cos( 0.50*iTime + vec2(0.0,3.00) + 2.0 );
        vec2 v3 = 0.8*cos( 0.55*iTime + vec2(0.0,2.00) + 4.0 );
        vec2 v4 = 0.8*cos( 0.60*iTime + vec2(0.0,1.00) + 5.0 );
        vec2 v5 = 0.8*cos( 0.45*iTime + vec2(0.0,1.50) + 6.0 );
        vec2 v6 = 0.8*cos( 0.50*iTime + vec2(0.0,3.00) + 7.0 );
        vec2 v7 = 0.8*cos( 0.55*iTime + vec2(0.0,2.00) + 8.0 );
        vec2 v8 = 0.8*cos( 0.60*iTime + vec2(0.0,1.00) + 9.0 );

        // add more points
        vec2[] poly = vec2[](v0,v1,v2,v3,v4,v5,v6,v7,v8);

        float d = sdPoly(poly, p );

        vec3 col = vec3(0.);
        col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.015,abs(d)) );
        fragColor = vec4(col,1.0);
        if (d < 0.)
            fragColor.b = .4;
    }</pre>
 * [3] <a href='https://stackoverflow.com/questions/28437241/get-vertex-positions-in-fragment-shader'>
 * discussion on stackoverflow: Get vertex positions in fragment shader</a><br>
 */
export function tiledLayers(vparas = {}) {
 var ptile = vparas.tile || {};
 var layrs = ptile.layers || 3;
 var vtiles = ptile.change ? ' vtiles / float(cx + 1) ' : ' vtiles ';

 return { fragmentShader: `
  #define WEIGHT 3.4

  uniform sampler2D u_tex;
  uniform float now;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying float va;
  varying vec2 vsize;
  varying vec2 vtiles;
  ${glx.box2}

  // ray plane intersection
  // https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection#Algebraic_form
  vec4 rayPlaneInsec(vec3 l0, vec3 l, vec3 p0, vec3 n) {
    float d = dot( (p0 - l0), n );
    float l_n = dot(l, n);
    if (l_n == 0.) {
      if (dot(p0 - l0, n) == 0.)
        return vec4(l0, 0.); // in plane
      else return vec4(p0, -1.); // parallel
    }
    d /= l_n;
    vec3 p_ = l0 + normalize(l) * d;
    return vec4(p_, abs(d));
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
      // float box = box2( p0d.xz + c0.xz, size * 0.5, 0.5 );
      float box = box2( p0d.xz - c0.xz, size * 0.5, 0.5 );
      box = 1.0/box * w * (1. - va);
      tes = 0.4/tes * (1. - va) * ( 1. - abs( sin(now * 0.0005) ) );
      return abs(box) * tes + abs(box) * 0.02;
    }
    else return 0.;
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = 0.;
	/*
	col += boxY(cameraPosition, P, cent[0].xyz, vec2(240., 92.), vec2(6., 3.), WEIGHT);
    col += boxY(cameraPosition, P, cent[1].xyz, vec2(240., 92.), vec2(3., 2.), WEIGHT);
    col += boxY(cameraPosition, P, cent[2].xyz, vec2(240., 92.), vec2(1.5, 1.), WEIGHT);
	*/
	for (int cx = 0; cx < ${layrs}; cx++)
      col += boxY(cameraPosition, P, cent[cx].xyz, vsize, ${vtiles} * 0.5, WEIGHT);

    return vec4(0., col * 0.2, 0.8, col);
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    gl_FragColor.g += 0.7;
    gl_FragColor.a += va;
  }`,
  
 // a_box - xz: floor size, y: height ( layer's offset )
 vertexShader: `
  uniform vec3 wpos;
  // uniform vec3 offsets[${layrs}];

  attribute vec3 a_box;
  attribute vec2 a_tiles;
  // attribute vec3 a_tan;
  // attribute vec3 a_pos;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying float va;
  varying vec2 vsize;
  varying vec2 vtiles;

  float buildingAlpha(vec3 e, vec3 P, vec3 np) {
    vec3 i = normalize(e - P);
    float a = dot( i, normalize(np) );
    return a > 0. ? 1. - a : 0.;
  }

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

	vsize = a_box.xz + vec2(240, 92);
    vtiles = a_tiles + vec2(3, 1.5);
    P = (worldPosition).xyz;
    va = buildingAlpha(cameraPosition, P, normal);

    for (int i = 0; i < ${layrs}; i++){
      // cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
      cent[i] = modelMatrix * vec4(0., 25. * float(i) - a_box.y * 0.5, 0., 1.);
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

export function shapeLayers_box2(vparas) {
 var layrs = vparas.layars || 3;
 return { fragmentShader: `
  #define WEIGHT 1.4

  uniform sampler2D u_tex;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying float va;
  ${glx.box2}

  // ray plane intersection
  // https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection#Algebraic_form
  vec4 rayPlaneInsec(vec3 l0, vec3 l, vec3 p0, vec3 n) {
    float d = dot( (p0 - l0), n );
    float l_n = dot(l, n);
    if (l_n == 0.) {
      if (dot(p0 - l0, n) == 0.)
        return vec4(l0, 0.); // in plane
      else return vec4(p0, -1.); // parallel
    }
    d /= l_n;
    vec3 p_ = l0 + normalize(l) * d;
    return vec4(p_, abs(d));
  }

  // rasterize functions
  // get xz plane box distance color
  float boxY(vec3 e, vec3 P, vec3 c0, vec2 size, float w) {
    float d = 0.;
    vec4 p0d = rayPlaneInsec( e, normalize(P - e), c0, vec3(0., 1., 0.) );
    if (p0d.w > 0.)
      d = box2( vec2(p0d.x, p0d.z), size * 0.5, 5. );
    else return 0.;

    d = 1.0/d * w * (1. - va);
    return abs(d);
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float col = boxY(cameraPosition, P, cent[0].xyz, vec2(280., 90.), WEIGHT);
    return vec4(col);
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
    gl_FragColor.g += 0.7;
    gl_FragColor.a += va;
  }`,

 vertexShader: `
  uniform vec3 wpos;
  uniform vec3 offsets[${layrs}];

  attribute vec3 a_tan;
  attribute vec3 a_pos;

  varying vec3 P;
  varying vec4 cent[${layrs}];
  varying float va;
  varying vec2 boxsize;

  float buildingAlpha(vec3 e, vec3 P, vec3 np) {
    vec3 i = normalize(e - P);
    float a = dot( i, normalize(np) );
    return a > 0. ? 1. - a : 0.;
  }

  void main() {
    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    va = buildingAlpha(cameraPosition, P, normal);
    for (int i = 0; i < ${layrs}; i++){
      cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
      // cent[i] = modelMatrix * vec4(0.);
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

// works for line but hard to find segments, see
// https://homepage.univie.ac.at/Franz.Vesely/notes/hard_sticks/hst/hst.html
export function shapeLayers_line_dist(vparas) {
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

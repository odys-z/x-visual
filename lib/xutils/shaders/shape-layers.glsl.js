import {glx} from './glx.glsl'
/**
 * Reference: <a href='https://www.shadertoy.com/view/MsjSzz'>Da Rasterizer</a>
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
 * example</a>.
 */
export function shapeLayers(vparas) {
 var layrs = vparas.layars || 3;
 return { fragmentShader: `
  #define WEIGHT 3.4

  uniform sampler2D u_tex;
  uniform float now;

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
	  float box = box2( p0d.xz, size * 0.5, 0.5 );
      box = 1.0/box * w * (1. - va);
      tes = 0.4/tes * (1. - va) * ( 1. - abs( sin(now * 0.0005) ) );
      return abs(box) * tes + abs(box) * 0.02;
	  // some strange color:
      // return abs(box * tes + box * 0.025);
      // return mix(abs(box), abs(box * tes), ( sin(now * 0.001) + 1.) );
      // return mix(abs(box), abs(box * tes), ( sin(now * 0.001) + 1.) );
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

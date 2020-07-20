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
  #define WEIGHT 0.1

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
    float dist = dot(n, P - p0);
    // dist = 1.0/dist * WEIGHT * w;
    // return min(dist * dist, 1.0);
    return dist;
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float line_width = 0.4;
    // float col = line(vUv.xy, P0, P1, line_width);
    // col += line(vUv.xy, P2, P3, line_width);
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
      cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    vec4 v4 = modelMatrix * vec4( position + vec3(-150., 0., -50.), 1.0 );
    P0 = v4.xyz;
    v4 = modelMatrix * vec4( position + vec3(150., 0., -50.), 1.0 );
    P1 = v4.xyz;

    v4 = modelMatrix * vec4( position + vec3(150., 0., 50.), 1.0 );
    P2 = v4.xyz;
    v4 = modelMatrix * vec4( position + vec3(150., 0., -50.), 1.0 );
    P3 = v4.xyz;

    v4 = projectionMatrix * modelViewMatrix * vec4(uv.s, uv.t, 0., 1.0);
    vUv = v4.xy; // / v4.z;
  } `
 }
}

export function shapeLayers_uvdistance(vparas) {
 var layrs = vparas.layars || 3;
 return { fragmentShader: `
  #define WEIGHT 4.

  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P0;
  varying vec3 P1;
  varying vec3 P2;
  varying vec3 P3;
  varying vec4 cent[${layrs}];


  // rasterize functions
  float line(vec2 p, vec2 p0, vec2 p1, float w) {
    vec2 d = p1 - p0;
    float t = clamp(dot(d, p - p0) / dot(d, d), 0.0, 1.0);
    vec2 proj = p0 + d * t;
    float dist = length(p - proj);
    dist = 1.0/dist * WEIGHT * w;
    return min(dist * dist, 1.0);
  }

  vec4 mainImage( in vec2 fragCoord ) {
    float line_width = 0.4;
    float col = line(vUv.xy, P0.xy, P1.xy, line_width);
    col += line(vUv.xy, P2.xy, P3.xy, line_width);
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

    // P = worldPosition.xyz;
    vscale = orbScale;
    for (int i = 0; i < ${layrs}; i++){
      cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;

    vec4 v4 = projectionMatrix * modelViewMatrix * vec4( position + vec3(-150., 0., -50.), 1.0 );
    P0 = v4.xyz;
    v4 = projectionMatrix * modelViewMatrix * vec4( position + vec3(150., 0., -50.), 1.0 );
    P1 = v4.xyz;

    v4 = projectionMatrix * modelViewMatrix * vec4( position + vec3(150., 0., 50.), 1.0 );
    P2 = v4.xyz;
    v4 = projectionMatrix * modelViewMatrix * vec4( position + vec3(150., 0., -50.), 1.0 );
    P3 = v4.xyz;

    v4 = projectionMatrix * modelViewMatrix * vec4(uv.s, uv.t, 0., 1.0);
    vUv = v4.xy; // / v4.z;
  } `
 }
}

/** Render polygon of box shapes.
 * Inspired by <a href='https://www.shadertoy.com/view/XsfGDS'>
 * movAX13h, I/O, Shadertoy, 2013-08-09</a>.
 * A simplified version: </pre>
    float box(vec2 p, vec2 size, float r){
        size.x /= 0.701;
      return length(max(abs(p) - size, 0.0)) - r;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord ){
        const int numBlocks = 4;

        vec2 uv = fragCoord.xy / iResolution.xy - 0.5;
        float aspect = iResolution.x / iResolution.y;
        vec3 color = vec3(0.0);
        uv.x *= aspect;

        for (int i = 0; i < numBlocks; i++)
        {
            vec2 pos = vec2(float(i) * 0.2 - 0.5);

            // vec2 size = 3.8*vec2(0.04, 0.04 + 0.03*rand(tick+0.2));
            vec2 size = vec2(0.125);
            float b = box(uv - pos, size, 0.01); // distance to box of size at pos
            // edge0
            //float shine = .5 * smoothstep(-0.005000, b, 0.00182);
            //color += shine;

            // edge1
            float shine = .5 * smoothstep(b, 0.01001, 1.1);
            shine -= .5 * smoothstep(b, 0.00101, 1.1);
            color += shine;

            // edge2
            // if (b > 0.) {
            //     b = clamp(1. - b, 0., 1.);
            //     float shine = clamp(pow(b, 170.), 0., 1.);
            //     color += shine;
            // }
        }

        //color -= rand(uv) * 0.04;
        fragColor = vec4(color, 1.0);
    }</pre>
 * @param {object} vparas Visual.paras
 * @return {vertexShader, fragmentShader} shader
 * @function
 */
export function shapeLayers_box(vparas) {
 var layrs = vparas.layars || 3;
 return { fragmentShader: `
  uniform sampler2D u_tex;

  varying vec2 vUv;
  varying vec3 P;
  varying vec4 cent[${layrs}];

  vec4 mainImage( in vec2 fragCoord ) {
    vec4 fragColor = vec4(0.);
    vec3 e = cameraPosition;
    vec3 u = normalize( P - cameraPosition );

    for (int i = 0; i < ${layrs}; i++) {
        vec3 ci = cent[i].xyz;
        vec2 dists = sdPolygon( e, u, r[i], ci, vscale );

        if (dists.x <= 0.00001) {
          ${vparas.orbDebug ? 'fragColor.g += 0.2;' : ''}
          continue;
        }

        float ratio = 0.2;
        fragColor += ratio;
    }
    fragColor = clamp(fragColor, 0., 1.);

    vec4 texcolor = texture2D(u_tex, vUv);
    fragColor = mix(fragColor, texcolor, txAlpha);
    return fragColor;
  }

  void main() {
    gl_FragColor += mainImage(gl_FragCoord.xy);
  }`,

 vertexShader: `
  uniform vec3 wpos;
  uniform vec3 offsets[${layrs}];
  uniform vec3 orbScale;

  attribute vec3 a_tan;
  attribute vec3 a_pos;

  varying vec2 vUv;
  varying vec3 P; // top pos
  varying vec3 vscale;
  varying vec4 cent[${layrs}];

  void main() {
    vUv = uv;

    // gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    P = worldPosition.xyz;
    vscale = orbScale;
    for (int i = 0; i < ${layrs}; i++){
      cent[i] = modelMatrix * vec4(wpos + offsets[i], 1.);
    }

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  } `
 }
}

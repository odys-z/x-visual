
import {glx, initPhongUni, updatePhongUni} from './glx.glsl';

/**<p>Rendering tessellated planes in a box model.</p>
 * Issue:<br>
 * The problem is it can't finding out distance to a polygon to restrict the floor
 * area. There is an example by Inigo Quilez [2] that can figure out distance
 * quickly in fragment shader but the problem is we can't find out an efficient
 * way to send polygon info into fragment with webgl<sup>[3]</sup>.<br>
 * Reference:<br>
 * [1] <a href='https://www.shadertoy.com/view/MsjSzz'>Da Rasterizer,
 * Example of fragment matrix operation</a>.<br>
 * Simplified Example: <pre>
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
    } </pre>
 * See also another
 * <a href='https://www.shadertoy.com/view/Xlf3zl'>interesting example</a>.<br>
 * [2] <a href='http://geomalgorithms.com/a03-_inclusion.html'>the Winding Number Algorithm</a>.<br>
 * To find out distance to a polygon in a plane, one can use [2].
 * The shadertoy example can be found <a href='https://www.shadertoy.com/view/wdBXRW'>here</a>.
 * A simplified version showing wn=2 are rendered as outside:<pre>
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
    } </pre>
 * [3] <a href='https://stackoverflow.com/questions/28437241/get-vertex-positions-in-fragment-shader'>
 * discussion on stackoverflow: Get vertex positions in fragment shader</a><br>
 * @param {object} vparas Visual.paras
 * @return {object} {fragmentShader, vertexShader}
 * @member xglsl.xyzLayer2
 * @function
 */
export function xyzLayer2(vparas) {
	var {edgeWeight, xytile, yztile, xztile} = para4Layers(vparas);

	return {
		fragmentShader: `${glx.mrt.f_layout}
            #define WEIGHT ${edgeWeight}

            uniform vec3 cameraPosition;
            uniform sampler2D u_tex;
            uniform float now;
            uniform vec4 u_hue;

            in vec3 P;
            in vec4 vcent;
            in vec3 vxyzOffset;
            in float vnorth;
            in vec3 vsize[3];
            in vec2 vtiles[3];

            in float va;
            in vec4 vColor;

            ${glx.box3}
            ${glx.rayPlaneInsec}
            ${glx.rotateY}

            float tessellate2( vec2 xz, vec2 c0, vec2 rectSize ) {
              vec2 d = xz - c0;
              vec2 modxz = mod ( d / rectSize, 2. );
              return modxz.x > 1. && modxz.y > 1. || modxz.x < 1. && modxz.y < 1. ?
                     0.5 : 0.001;
            }`
            // TODO use glx.box3Color
            + `
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
                pc_FragColor += mainImage(gl_FragCoord.xy);
                pc_FragColor = mix(pc_FragColor, vColor, va * 0.9 + 0.1);
                xColor = vec4(0.);
                xEnvSpecular = vec4(0.);
            }`
            .replaceAll(/ {12}/g, ''),

    // a_box - xz: floor size, y: height ( layer's offset )
	// TODO replace with fresnelAlpha
    	vertexShader: `#version 300 es
            uniform vec3 cameraPosition;
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;

            uniform float u_shininess;
            uniform vec4 u_color; // diffuse color
            uniform vec3 u_ambientColor;
            uniform vec3 u_specularColor;
            uniform vec3 u_lightColor;
            uniform vec3 u_lightPos;
            uniform float u_lightIntensity;
            ${glx.u_alpha}

            uniform vec3 wpos;
            uniform vec3 u_offsetxyz;
            uniform float u_north;

    		in vec3 position;
    		in vec3 normal;
            in vec3 a_box;
            in vec2 a_tiles;
            in vec3 a_loc;
            in float a_north;

            out vec3 P;
            out vec4 vcent;
            out vec3 vxyzOffset;
            out float vnorth;
            out float va;
            out vec3 vsize[3];
            out vec2 vtiles[3];
            out vec4 vColor;

            ${glx.buildingAlpha}
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

                vColor = phongLight(normal, u_lightPos, cameraPosition, worldPosition.xyz,
                    u_ambientColor.xyz, u_color.xyz,
                    u_specularColor.xyz,
                    u_shininess, 0.1)
                    * u_lightIntensity;
            }`.replaceAll(/ {12}/g, ''  )
    }
}

xyzLayer2.initUniform = initPhongUni;
xyzLayer2.updateUniform = updatePhongUni;

function para4Layers(vparas) {
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

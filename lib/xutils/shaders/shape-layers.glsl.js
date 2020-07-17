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
export function shapeLayers(vparas) {
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

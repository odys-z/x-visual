
export const bokehDepth = {
	/** user need thsi: vzBokeh = mvPos.z; */
	v :`out float vzBokeh;
			float bokehDepth() {
				vzBokeh = -(modelViewMatrix * vec4(position, 1.0)).z;
				return vzBokeh;
			}
	`, // bokeh depth

	f     :`uniform float bokehNear;
			uniform float bokehFar;
			in float vzBokeh;
			vec4 bokehDepth() {
				float color = 1.0 - smoothstep( bokehNear, bokehFar, vzBokeh );
				return vec4( vec3( color ), 1.0 );
			}`,
}

export const bokehFilter = {
		/**TODO move uniforms here
		 */
	f: (debug) => {
		return `
			uniform float focalDepth;
			uniform float focalLength;
			uniform float fstop;
			uniform bool showFocus;
			uniform float bokehNear;
			uniform float bokehFar;
			uniform bool manualdof;

			float ndofstart = 1.0;
			float ndofdist = 2.0;
			float fdofstart = 1.0;
			float fdofdist = 3.0;
			float CoC = 0.03;

			uniform vec2 focusCoords;
			uniform float autofocus;
			uniform float bokehThreshold;
			uniform float gain;
			uniform float bias;
			uniform float fringe;
			uniform bool depthblur;

			float linearize(float depth) {
			  return -bokehFar * bokehNear / (depth * (bokehFar - bokehNear) - bokehFar);
			}

			vec3 bokeh(sampler2D bokehDepth, sampler2D tColor, vec2 uv) { ${debug ? `
			  if (abs(uv.x - 0.5) < 0.01 || abs(uv.y - 0.5) < 0.01)
				return vec3(0., 1., 0.);`
			  : ''}
			  float depth = linearize(texture(bokehDepth, uv.xy).x);
			  float fDepth = focalDepth;
			  if (autofocus > 0.0) {
				fDepth = linearize(texture(bokehDepth, focusCoords).x);
			  }
			  float blur = 0.0;
			  if (manualdof) {
			    float a = depth-fDepth;
			    float b = (a-fdofstart)/fdofdist;
			    float c = (-a-ndofstart)/ndofdist;
			    blur = (a>0.0) ? b : c;
			  }
			  else {
			    float f = focalLength;
			    float d = fDepth*1000.0;
			    float o = depth*1000.0;
			    float a = (o*f)/(o-f);
			    float b = (d*f)/(d-f);
			    float c = (d-f)/(d*fstop*CoC);
			    blur = abs(a-b)*c;
			  }
			  blur *= blur * fringe;
			  blur = clamp(blur, 0.0, 3.0);

			  vec3 col = vec3(0.0);
			  if(blur < 0.05) {
			    col = texture(xFragColor, uv.xy).rgb;
			  	if (showFocus) col.b = 1.;
			  }
			  else {
			    col = textureLod(tColor, uv.xy, blur).rgb;
			  }
			  return col;
			}`
		;
	}
}

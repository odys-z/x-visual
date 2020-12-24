
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
				// float color = 1.0 - smoothstep( bokehNear, bokehFar, vzBokeh );
				// return vec4( vec3( color ), 1.0 );

				// return vec4( 0., 0., clamp(vzBokeh, bokehNear, bokehFar), 1.0);
				return vec4( 0., 0., (vzBokeh - bokehNear) / (bokehFar - bokehNear), 1.0);
			}`,

}

export const bokehFilter = {
	f: (debug) => {
		return `
			#define B 8.0
			precision highp float;
			uniform float focalDepth;
			uniform float focalLength;
			uniform float F;
			uniform float fstop;
			uniform bool showFocus;
			uniform float blurAlpha;
			uniform float bokehNear;
			uniform float bokehFar;
			uniform bool manualdof;

			float ndofstart = 1.0;
			float ndofdist = 2.0;
			float fdofstart = 1.0;
			float fdofdist = 3.0;
			float CoC = 0.03; ` //circle of confusion size in mm
			+ `
			uniform vec2 focusCoords;
			uniform float autofocus;
			uniform float bokehThreshold;
			uniform float fringe;

			` // although we are in WebGl2, 1 stands for infinity remote can reduce parameters like Far or Near.
			+ `
			float linearize(float d) {
				return d * (bokehFar - bokehNear) + bokehNear;
			}

			vec3 bokeh(sampler2D bokehDepth, sampler2D tColor, vec2 uv) { ${ debug ? `
			  if ( showFocus &&
				  (abs(uv.x - focusCoords.x) < 0.001 || abs(uv.y - focusCoords.y) < 0.002) )
				return vec3(0., 1., 0.);` : '' }

			  float us2 = texture(bokehDepth, uv).z;
			  float us1 = texture(bokehDepth, focusCoords).z;
			  float s2 = linearize(us2) * 1000.0;
			  float s1 = linearize(us1) * 1000.0;
			  float blurring = 0.0;
			  float f = focalLength;
			  float A = f / F;
			  if (manualdof) {
			    float a = s2 - s1;
			    float b = (a-fdofstart)/fdofdist;
			    float c = (-a-ndofstart)/ndofdist;
			    blurring = (a>0.0) ? b : c;
			  }
			  else {
				float m = f / (s1 - f);
				float c = abs(1. - s1 / s2) * A * m;
				blurring = c;
				blurring = smoothstep(0., CoC, c);
			  }

			  vec3 col = vec3(0.0);

			  col = texture( xFragColor, uv, blurring * B ).rgb;

			  float thresh = CoC / 2.;

			  // front blurring depth
			  float us3 = textureLod( bokehDepth, uv, B * A * thresh ).z;

			  if (us2 >= us1 && us3 < us1) {  // occluded by front object
				float s3 = linearize(us3) * 1000.0;
				float c = abs(1. - s1 / s3) * A * 0.1;

				blurring = clamp( 0., B, pow(c, 0.25) );

				vec4 col1 = textureLod( xFragColor, uv, blurring * B * A);

				col = mix( col, col1.rgb, clamp(0., 1., pow((us1 - us3)/us1 * 2.5, 1.5) ));

				if ( showFocus ) col.r = blurring;
			  }

			  if ( showFocus && blurring < thresh ) col.b = 1.;

			  return col;
			}`
		;
	},

	f_temp: (debug) => {
		return `
			#define B 8.0
			uniform float focalDepth;
			uniform float focalLength;
			uniform float F;
			uniform float fstop;
			uniform bool showFocus;
			uniform float blurAlpha;
			uniform float bokehNear;
			uniform float bokehFar;
			uniform bool manualdof;

			float ndofstart = 1.0;
			float ndofdist = 2.0;
			float fdofstart = 1.0;
			float fdofdist = 3.0;
			float CoC = 0.03; ` //circle of confusion size in mm
			+ `
			uniform vec2 focusCoords;
			uniform float autofocus;
			uniform float bokehThreshold;
			uniform float fringe;

			` // although we are in WebGl2, 1 stands for infinity remote can reduce parameters like Far or Near.
			+ `
			float linearize(float d) {
				return d * (bokehFar - bokehNear) + bokehNear;
			}

			vec3 bokeh(sampler2D bokehDepth, sampler2D tColor, vec2 uv) { ${ debug ? `
			  if ( showFocus &&
				  (abs(uv.x - focusCoords.x) < 0.001 || abs(uv.y - focusCoords.y) < 0.002) )
				return vec3(0., 1., 0.);` : '' }

			  // float s2 = bdepth(bokehDepth, uv);
			  float s2 = linearize(texture(bokehDepth, uv).z) * 1000.0;
			  float s1 = linearize(texture(bokehDepth, focusCoords).z) * 1000.0;
			  float blur = 0.0;
			  if (manualdof) {
			    float a = s2 - s1;
			    float b = (a-fdofstart)/fdofdist;
			    float c = (-a-ndofstart)/ndofdist;
			    blur = (a>0.0) ? b : c;
			  }
			  else {
				float f = focalLength;
				float A = f / F;
				float m = f / (s1 - f);
				float c = abs(1. - s1 / s2) * A * m;
				blur = c;
			  }

			  vec3 col = vec3(0.0);
			  if(blur < CoC * 0.1) {
			    col = texture(xFragColor, uv.xy).rgb;

				s1 = textureLod(bokehDepth, focusCoords, 0.).z;
				s2 = textureLod(bokehDepth, uv, B ).z;
				if (s2 < s1) {
					// foreground edge blur
					// float f = focalLength;
					// float A = f / F;
					// float m = f / (s1 - f);
					// float c = abs(1. - s1 / s2) * A * m;
					// vec4 col1 = textureLod(xFragColor, uv, c * 300.);

					float delta = (s1 - s2) / (s1 - 0.);
					vec4 col1 = textureLod(xFragColor, uv, delta * B );

					// col = mix(col, col1.rgb, delta);
					col = col1.rgb;
					// col.r = clamp(0., 1., c * 5000.);
					// col.r = delta;
				}

			    if (showFocus) col.b = 1.;
			  }
			  else {
				col = textureLod(xFragColor, uv.xy, blur * 300.).rgb;
				if (showFocus) col *= blurAlpha;
			  }

			  // if (manualdof) // debug - disabled
			  // 	col.b = 1.;
			  return col;
			}`
		;
	}
}

const bokehFilter_bak2 = {
	f: (debug) => {
		return `
			uniform float focalDepth;
			uniform float focalLength;
			uniform float F;
			uniform float fstop;
			uniform bool showFocus;
			uniform float blurAlpha;
			uniform float bokehNear;
			uniform float bokehFar;
			uniform bool manualdof;

			float ndofstart = 1.0;
			float ndofdist = 2.0;
			float fdofstart = 1.0;
			float fdofdist = 3.0;
			float CoC = 0.03; ` //circle of confusion size in mm
			+ `
			uniform vec2 focusCoords;
			uniform float autofocus;
			uniform float bokehThreshold;
			uniform float fringe;

			` // although we are in WebGl2, 1 stands for infinity remote can reduce parameters like Far or Near.
			+ `
			float linearize(float d) {
				return d * (bokehFar - bokehNear) + bokehNear;
			}

			float bdepth(sampler2D bokehDepth, vec2 coords) {
				float d = 0.0;
				float kernel[9]; `// FIXME let's use uniform
				+ `
				vec2 offset[9];

				// 	vec2 wh = vec2(1.0/u_texsize.x,1.0/textureHeight) * dbsize;
				vec2 wh = 1.0/u_texsize * 25.0; //dbsize;

				offset[0] = vec2(-wh.x,-wh.y);
				offset[1] = vec2( 0.0, -wh.y);
				offset[2] = vec2( wh.x -wh.y);

				offset[3] = vec2(-wh.x,  0.0);
				offset[4] = vec2( 0.0,   0.0);
				offset[5] = vec2( wh.x,  0.0);

				offset[6] = vec2(-wh.x, wh.y);
				offset[7] = vec2( 0.0,  wh.y);
				offset[8] = vec2( wh.x, wh.y);

				kernel[0] = 1.0/16.0;   kernel[1] = 2.0/16.0;   kernel[2] = 1.0/16.0;
				kernel[3] = 2.0/16.0;   kernel[4] = 4.0/16.0;   kernel[5] = 2.0/16.0;
				kernel[6] = 1.0/16.0;   kernel[7] = 2.0/16.0;   kernel[8] = 1.0/16.0;

				for( int i=0; i<9; i++ ) {
					float tmp = texture(bokehDepth, coords + offset[i]).z;
					d += tmp * kernel[i];
				}

				return linearize(d);
			}

			vec3 bokeh(sampler2D bokehDepth, sampler2D tColor, vec2 uv) { ${ debug ? `
			  if ( showFocus &&
				  (abs(uv.x - focusCoords.x) < 0.001 || abs(uv.y - focusCoords.y) < 0.002) )
				return vec3(0., 1., 0.);` : '' }

			  // float s2 = bdepth(bokehDepth, uv);
			  float s2 = linearize(texture(bokehDepth, uv).z) * 1000.0;
			  float s1 = linearize(texture(bokehDepth, focusCoords).z) * 1000.0;
			  float blur = 0.0;
			  if (manualdof) {
			    float a = s2 - s1;
			    float b = (a-fdofstart)/fdofdist;
			    float c = (-a-ndofstart)/ndofdist;
			    blur = (a>0.0) ? b : c;
			  }
			  else {
				float f = focalLength;
				float A = f / F;
				float m = f / (s1 - f);
				float c = abs(1. - s1 / s2) * A * m;
				blur = c;
			  }

			  vec3 col = vec3(0.0);
			  if(blur < CoC * 0.1) {
			    col = texture(xFragColor, uv.xy).rgb;

				s2 = bdepth(bokehDepth, uv) * 1000.0;
				if (s2 < s1) {
					// foreground blur
					// float f = focalLength;
					// float A = f / F;
					// float m = f / (s1 - f);
					// float c = abs(1. - s1 / s2) * A * m;
					// blur = c;

					// blur = 6, if blur = CoC * 0.1
					vec4 col1 = textureLod(xFragColor, uv, blur * 300.);
					col = mix(col, col1.rgb, 0.8);
					// col = col1.rgb;
					col.r = blur * 500.;
				}

			    if (showFocus) col.b = blur * 500.;
			  }
			  else {
				col = textureLod(xFragColor, uv.xy, blur * 300.).rgb;
				if (showFocus) col *= blurAlpha;
			  }

			  if (manualdof) // debug - disabled
			  	col.b = 1.;
			  return col;
			}`
		;
	}
}

const bokehDepth_bak = {
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

const bokehFilter_bak = {
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
			float CoC = 0.03; ` //circle of confusion size in mm (35mm film = 0.03mm)
			+ `
			uniform vec2 focusCoords;
			uniform float autofocus;
			uniform float bokehThreshold;
			uniform float gain;
			uniform float bias;
			uniform float fringe;
			uniform bool depthblur;

			` // as we are in WebGl2, we can simplify this?
			+ `
			float linearize(float depth) {
			  return -bokehFar * bokehNear / (depth * (bokehFar - bokehNear) - bokehFar);
			}

			vec3 bokeh(sampler2D bokehDepth, sampler2D tColor, vec2 uv) { ${ debug ? `
			  if (abs(uv.x - focusCoords.x) < 0.001 || abs(uv.y - focusCoords.y) < 0.002 )
				return vec3(0., 1., 0.);` : '' }
			  float depth = linearize(texture(bokehDepth, uv.xy).x);
			  float fDepth = focalDepth;
			  // if (autofocus > 0.0) {
				fDepth = linearize(texture(bokehDepth, focusCoords).x);
			  // }
			  float blur = 0.0;
			  if (manualdof) {
			    float a = depth-fDepth;
			    float b = (a-fdofstart)/fdofdist;
			    float c = (-a-ndofstart)/ndofdist;
			    blur = (a>0.0) ? b : c;
			  }
			  else {
				`
				  /*
			    float f = focalLength;
			    float d = fDepth*1000.0;
			    float o = depth*1000.0;
			    float a = (o*f)/(o-f);
			    float b = (d*f)/(d-f);
			    float c = (d-f)/(d*fstop*CoC);
			    blur = abs(a-b)*c;
				*/
				// https://en.wikipedia.org/wiki/Circle_of_confusion
				// https://dofsimulator.net/en/
				// http://howmuchblur.dekoning.nl/#compare-1x-50mm-f1.4-and-1x-85mm-f1.8-on-a-0.9m-wide-subject
				// https://toolstud.io/photo/dof.php?cropfactor=1&focallengthmm=50&aperturef=1.2&distancem=10
				+ `
				float f = focalLength;
				float A = f / 1.4;
				float s1 = fDepth * 1000.0;
			    float s2 = depth * 1000.0;
				float m = f / (s1 - f);
				float c = abs(1. - s1 / s2) * A * m;
				blur = c / CoC;
			  }
			  // blur *= blur * fringe;
			  // blur = clamp(blur, 0.0, 3.0);

			  vec3 col = vec3(0.0);
			  if(blur < 0.05) {
			    col = texture(xFragColor, uv.xy).rgb;
			    if (showFocus) col.b = 1.;
			  }
			  else {
			    col = textureLod(tColor, uv.xy, blur).rgb;
			  }

			  if (manualdof) // debug - disabled
			  	col.b = 1.;
			  return col;
			}`
		;
	}
}

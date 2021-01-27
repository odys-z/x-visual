
import { glConfig } from '../glx.glsl'

export const bokehDepth = {
	/** user need thsi: vzBokeh = mvPos.z; */
	v:     `out float vzBokeh;
			float bokehDepth() {
				vzBokeh = -(modelViewMatrix * vec4(position, 1.0)).z;
				return vzBokeh;
			}
	`, // bokeh depth

	f:     `uniform float bokehNear;
			uniform float bokehFar;
			in float vzBokeh;
			vec4 bokehDepth() {
				return vec4( 0., 0., (vzBokeh - bokehNear) / (bokehFar - bokehNear), 1.0);
			}`,

}

export const bokehFilter = {
	f: (debug) => {
		return `
			#define B ${glConfig.xfilter.maxBokeh}
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

			vec4 bokeh(sampler2D bokehDepth, sampler2D tColor, vec2 uv) { ${ debug ? `
			  if ( showFocus &&
				  (abs(uv.x - focusCoords.x) < 0.001 || abs(uv.y - focusCoords.y) < 0.002) )
				return vec4(0., 1., 0., 0.);` : '' }

			  us2 = texture(bokehDepth, uv).z;
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
				blurring = clamp( 0., B * F, pow(c, 0.25) ) * 0.5;
			  }

			  vec3 col = vec3(0.0);

			  col = texture( xFragColor, uv, blurring * A ).rgb;

			  float thresh = CoC / 2.;

			  // front blurring depth
			  float us3 = textureLod( bokehDepth, uv, B * A * thresh ).z;

			  if (us2 >= us1 && us3 < us1) {  // occluded by front object
				float s3 = linearize(us3) * 1000.0;
				float c = abs(1. - s1 / s3) * A;

				blurring = clamp( 0., B * F, pow(c, 0.25) ) * 0.5;

				vec4 col1 = textureLod( xFragColor, uv, blurring * A);

				col = mix( col, col1.rgb, clamp(0., 1., pow((us1 - us3)/us1 * 2.5, 1.5) ));

				if ( showFocus ) col.r = blurring;
			  }

			  if ( showFocus && blurring < thresh ) col.b = 1.;

			  return vec4(col, blurring + 1.);
			}`
		;
	},
}

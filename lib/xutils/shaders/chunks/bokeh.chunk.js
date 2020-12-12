
export const bokehDepth = {
	/** user need thsi: vzBokeh = mvPos.z; */
	v_uni :`out float vzBokeh;`, // bokeh depth

	f     :`uniform float bokehNear;
			uniform float bokehFar;
			in float vzBokeh;
			vec4 bokehDepth() {
				float color = 1.0 - smoothstep( bokehNear, bokehFar, vzBokeh );
				// float color = 1.0 - smoothstep( 0.1, 2000., 500.0 );
				// float color = 1.0 - smoothstep( 0.1, 2000., vzBokeh );
				return vec4( vec3( color ), 1.0 );
			}`,
}


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

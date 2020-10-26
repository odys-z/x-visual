
export const tex = {
	// https://www.shadertoy.com/view/Msl3RH
	bump: `
		float bump(sampler2D texBump, vec2 uv, vec4 scale) {
			vec4 col = texture2D(texBump, uv);
			float lum = dot(col.xyz, vec3(0.333));
			vec3  nor = normalize( vec3( dFdx(lum), 0.1, dFdy(lum) ) );
			return clamp( 0.5 + 1.5 * dot(nor.xyz, scale.xyz * -scale.w), 0.0, 1.0 );
		}
	`,

}

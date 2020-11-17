
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

	// https://www.shadertoy.com/view/lt3fzN
	// Simple blur effect by Andrey A. Ugolnik
	// 2017
	blur: `
		lowp vec4 blur(in sampler2D tex, in highp vec2 uv, in highp vec2 resolution)
		{
			highp vec2 r = 2.50 / resolution;

		    const lowp float v = 5.0 + 1.0;
		    const lowp float d = 1.0 / (v * v);

		    lowp vec4 color = vec4(0.0);
		    for (float x = -2.; x <= 2.; x++)
		    {
		        for (float y = -1.; y <= 1.; y++)
		        {
		            highp vec2 coord = vec2(uv.x + x * r.x, uv.y + y * r.y);
		            color += texture(tex, coord) * d;
		        }
		    }

		    return color;
		}
	`,

	/*
		void mainImage(out vec4 fragColor, in vec2 fragCoord)
		{
		    // Normalized pixel coordinates (from 0 to 1)
		    highp vec2 uv = fragCoord/iResolution.xy;

			lowp vec4 col = blur(iChannel0, uv, iResolution.xy);

		    // Output to screen
		    fragColor = col;
		}
	*/
}

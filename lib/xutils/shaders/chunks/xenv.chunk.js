export const xenv = {
	threshold: `vec4 threshold(in vec4 rawColor, in float thresh) {
		if (length(rawColor.rgb) > thresh)
			return rawColor;
		else return vec4(0., 0., 0., rawColor.a);
	}
	`,
}

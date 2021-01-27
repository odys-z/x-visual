export const xenv = {
	threshold:
		(cfg) => { return `
			uniform float u_bloomThresh;
			vec4 threshold(in vec4 rawColor) {
				if (length(rawColor.rgb) > ${cfg} + u_bloomThresh)
					return rawColor;
				else return vec4(0., 0., 0., rawColor.a);
			}`.replaceAll(/\t\t\t/g, '').replaceAll(/\t/g, '  ');
		},
}

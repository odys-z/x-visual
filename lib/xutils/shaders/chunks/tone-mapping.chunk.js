
export const toneMapping = {
	testMocha1: "mocha says it's a function",
	testMocha2: "mocha says it's not a function".replaceAll(/ /g, 'b'),

	// source: https://www.cs.utah.edu/~reinhard/cdrom/
	reinhardTone: `
		vec3 reinhardTone ( vec3 color, float toneMappingExposure ) {
			color *= toneMappingExposure;
			return clamp( color / ( vec3( 1.0 ) + color ), 0., 1. );
		}
		`.replaceAll(/\n\t/g, '\n')
		.replaceAll(/\t/g, '  '),
}

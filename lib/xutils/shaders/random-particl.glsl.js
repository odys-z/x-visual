
import { glConfig, glx } from './glx.glsl';

/**Get shader for ShaderFlag.randomParticles.
 * If u_morph is animated, must providing uniform vec3 &amp a_target.
 * Used variables: position, color, size.
 * gl_position = mix(pos, taget, morph) + noise * dist;
 * @param {object} paras
 * paras.u_dist {float} in world
 * paras.u_morph {float}
 * paras.a_dest {vec3} in world
 * paras.a_noise {float}
 * paras.size_scale {float}
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.randomRarticl
 * @function */
export function randomParticl(paras) {
    return {
		vertexShader: (`#version 300 es
			uniform mat4 projectionMatrix;
			uniform mat4 modelViewMatrix;
			uniform float u_alpha;
			uniform float u_dist;
			uniform float u_morph;

			in vec3 position;
			in vec3 color;
			in float size;
			${paras.a_dest ? 'in vec3 a_dest;' : ''}
			${paras.a_noise ? 'in float a_noise;' : ''}

			${glx.threshold}

			out vec3 vColor;
			out float vAlpha;

			void main() {
				vColor = color;
				vAlpha = u_alpha;
				${!paras.a_dest && !paras.a_noise ? 'vec3 pos = position * (1.0 + u_morph);' : ''}
				${ paras.a_dest && !paras.a_noise ? 'vec3 pos = mix(position, a_dest, u_morph) + u_dist * 5.0;' : ''}
				${!paras.a_dest && paras.a_noise ? 'vec3 pos = position + u_dist * 100 * a_noise;' : ''}
				${ paras.a_dest && paras.a_noise ? 'vec3 pos = mix(position, a_dest, u_morph) + u_dist * 5.0 * a_noise;' : ''}
				vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

				gl_PointSize = size * ${paras.vert_scale || '10.0'};
				gl_Position = projectionMatrix * mvPosition;
			} `)
			.replaceAll(/\t\t\t/g, '').replaceAll(/\t/g, '  '),

		fragmentShader: `${glx.mrt.f_layout}
			uniform sampler2D u_tex;
			in vec3 vColor;
			in float vAlpha;
			${glx.threshold}

			void main() {
				pc_FragColor = vec4( vColor, 1.0 );
				pc_FragColor = pc_FragColor * texture( u_tex, gl_PointCoord );
				pc_FragColor.a *= vAlpha;
				xColor = pc_FragColor;
				xEnvSpecular = threshold(pc_FragColor);
			} `
			.replaceAll(/\t\t\t/g, '').replaceAll(/\t/g, '  '),
    };
}

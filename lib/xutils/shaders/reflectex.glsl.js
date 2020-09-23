
import {glConfig, glx, initPhongUni, updatePhongUni} from './glx.glsl';

/** get shader of reflector
 * @param {object=} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.testPoint
 * @function
 */
export function reflectex(paras = {}) {
  var n_light = '1';
	var ldr = glConfig.shadowLDR('s');
	console.log(ldr);
  return {
  vertexShader: `
	uniform mat4 directionalShadowMatrix[ ${n_light} ];
	uniform mat4 textureMatrix;
    uniform float u_lightIntensity;

	varying vec2 vUv;
    varying vec3 vnormal;
    varying vec3 vertPos;
	varying vec4 vUv4;
    varying float vIntense;

    ${glx.intenseAlpha}
	${glx.shadow.setShadowCoords(n_light)}

	void main() {
		vUv = uv;
		vUv4 = textureMatrix * vec4( position, 1.0 );

        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vertPos = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		setShadowCoords(directionalShadowMatrix, worldPosition);

        vIntense = intenseAlpha(u_lightIntensity);
        vnormal = normalMatrix * normal;
    }`,

  fragmentShader: `
	${glx.u_alpha}
	uniform sampler2D u_tex[1];
	uniform sampler2D tDiffuse;

	uniform float u_texWeight;
	uniform vec4  u_color; // diffuse
	uniform float u_shininess;
	uniform vec3  u_ambientColor;
	uniform vec3  u_specularColor;
	uniform vec3  u_lightPos;

	varying vec3  vertPos;
	varying vec4 vUv4;
	varying vec2 vUv;
	varying vec3  vnormal;
	varying float vIntense;

	${glx.phongLight}
	${glx.shadow.frag}

	float blendOverlay( float base, float blend ) {
		return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
	}

	vec3 blendOverlay( vec3 base, vec3 blend ) {
		return vec3(blendOverlay( base.r, blend.r ),
					blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
	}`

	+ `
	void main() {
		float s = shadow();

		vec4 refl = texture2DProj( tDiffuse, vUv4 );

		gl_FragColor = vec4( blendOverlay( refl.rgb, u_color.xyz * ${glConfig.shadowLDR('s')} ), 1.0 );

		gl_FragColor.rgb = mix(gl_FragColor.rgb, u_color.rgb * s, 0.5);
	}`
  }
}

reflectex.initUniform = initPhongUni;

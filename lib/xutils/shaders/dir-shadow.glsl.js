
import {glConfig, glx, initPhongUni, updatePhongUni} from './glx.glsl';

/** get shader of gl_point for debugging
 * @param {object=} paras paras.vert_scale [optional] number scale of vertices
 * @return {object} {vertexShader, fragmentShader}
 * @member xglsl.receiveShadow
 * @function
 */
export function receiveShadow( paras = {} ) {
	var n_light = '1';
	return {
		vertexShader: `#version 300 es
			precision highp float;
			uniform mat4 modelMatrix;
			uniform mat4 projectionMatrix;
			uniform mat4 modelViewMatrix;

			in vec3 position;
			uniform mat4 directionalShadowMatrix[ ${n_light} ];
			${glx.shadow.setShadowCoords(n_light)}
			void main() {
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;
				setShadowCoords(directionalShadowMatrix, modelMatrix * vec4( position, 1.0 ));
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),

		fragmentShader: `${glx.mrt.f_layout}
			${glx.shadow.frag}
			${glx.threshold}
			void main() {
				float s = shadow();
				pc_FragColor = vec4(vec3(s), 1.);
				xColor = pc_FragColor;
				xEnvSpecular = threshold(pc_FragColor);
				xBokehDepth = vec4(0.);
			}
		`.replaceAll(/\n\t\t/g, '\n')
		.replaceAll(/\t/g, '  '),
	};
}

/** Design Memo: This section shows how to co-operate whith Three.js directional
 * shadow. It's not recommended deleting this.
 *
let unpackRGBAToDepth = `const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
	const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
	const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
	float unpackRGBAToDepth( const in vec4 v ) {
	    return dot( v, UnpackFactors );
}`;

let texture2DCompare = `float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
    return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
}`;

let getShadow = `float getShadow( sampler2D shadowMap, vec2 shadowMapSize,
        float shadowBias, float shadowRadius, vec4 shadowCoord ) {
    float shadow = 1.0;
    shadowCoord.xyz /= shadowCoord.w;
    shadowCoord.z += shadowBias;
    bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0,
                                 shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
    bool inFrustum = all( inFrustumVec );
    bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
    bool frustumTest = all( frustumTestVec );
    if ( frustumTest ) {
        vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
        float dx0 = - texelSize.x * shadowRadius;
        float dy0 = - texelSize.y * shadowRadius;
        float dx1 = + texelSize.x * shadowRadius;
        float dy1 = + texelSize.y * shadowRadius;
        float dx2 = dx0 / 2.0;
        float dy2 = dy0 / 2.0;
        float dx3 = dx1 / 2.0;
        float dy3 = dy1 / 2.0;
        shadow = (
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
        ) * ( 1.0 / 17.0 );
    }
    return shadow;
}`;

function receiveShadow_backup( paras = {} ) {
  return {vertexShader: `
  uniform mat3 uvTransform;
  uniform mat4 directionalShadowMatrix[ 1 ];

  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vReflect;
  varying vec3 vColor;
  varying vec4 vDirectionalShadowCoord[ 1 ];

  attribute vec3 color;

  void main() {
      vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
      vColor.xyz = color.xyz;
      vNormal = normalize( normalMatrix * normal );

      vec4 mvPosition = vec4( position, 1.0 );
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;

      vViewPosition = - mvPosition.xyz;
      vec4 worldPosition = vec4( position, 1.0 );

      worldPosition = modelMatrix * worldPosition;
      vWorldPosition = worldPosition.xyz;

      vDirectionalShadowCoord[ 0 ] = directionalShadowMatrix[ 0 ] * worldPosition;
  }
  `,

  fragmentShader: `
    struct DirLight {
        vec3 direction;
        vec3 color;
        int shadow;
        float shadowBias;
        float shadowRadius;
        vec2 shadowMapSize;
    };
    uniform DirLight directionalLights[ 1 ];`

    /* shadow map * / + `
    uniform sampler2D directionalShadowMap[ 1 ];
    varying vec4 vDirectionalShadowCoord[ 1 ];

	${unpackRGBAToDepth}
	${texture2DCompare}
	${getShadow}

    void main() {
        DirLight dirLit = directionalLights[0];

        float s = getShadow( directionalShadowMap[ 0 ], dirLit.shadowMapSize,
            dirLit.shadowBias, dirLit.shadowRadius,
            vDirectionalShadowCoord[ 0 ] );
		gl_FragColor = vec4(vec3(s), 1.);
    }`,
 };
}
*/

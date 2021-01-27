export const shadow120 = {
	v: {
		/** use this in vertex like:<pre>
           uniform mat4 directionalShadowMatrix[ ${n_light} ];
           setShadowCoords(directionalShadowMatrix, worldPosition);</pre>
		 * Don't change name of directionalShadowMatrix, it's set by Three.js lights.
		 */
		setShadowCoords: (n_light) => {
			return `out vec4 vDirectionalShadowCoord[ ${n_light} ];

				void setShadowCoords(mat4[${n_light}] shadowMat4, vec4 worldpos) {
				for (int i = 0; i < ${n_light}; i++)
					vDirectionalShadowCoord[i] = shadowMat4[i] * worldpos;
				}`
			},

		setVpDirShadowcoord: (n_light) => {
			return `out float vflareIntense;
				struct DirLight {
					vec3 direction;
					vec3 color;
					float intensity;
				};
				uniform DirLight directionalLights[ ${n_light} ];

				void setVpDirShadowcoord(mat4 shadowMat, vec3 p3, vec3 looking) {
					vP_DirShadowCoord = shadowMat * vec4(p3, 1.);
					// vflareIntense = dot(looking, directionalLights[0].direction);
					vflareIntense = pow( max(vflareIntense, 0.) * directionalLights[0].intensity, 0.1 );
				}`
			}
	},

	// changed since r120
	f: {
		uni_varys: `
			struct DirLight {
				vec3 direction;
				vec3 color;
				float intensity;
			};
			uniform DirLight directionalLights[ 1 ];
			struct DirectionalLightShadow {
				float shadowBias;
				float shadowNormalBias;
				float shadowRadius;
				vec2 shadowMapSize;
			};
			uniform DirectionalLightShadow directionalLightShadows[ 1 ];

			uniform sampler2D directionalShadowMap[ 1 ];
			in vec4 vDirectionalShadowCoord[ 1 ];
			`,

		unpackRGBAToDepth: `const float PackUpscale = 256. / 255.;
			const float UnpackDownscale = 255. / 256.;
			const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
			const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
			float unpackRGBAToDepth( const in vec4 v ) {
				return dot( v, UnpackFactors );
			}`,

		// return step( compare, unpackRGBAToDepth( texture( depths, uv ) ) );
		texture2DCompare: `float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
				return smoothstep( compare - 0.01, compare + 0.01, unpackRGBAToDepth( texture( depths, uv ) ) );
			}`,

		getShadow:
			`float getShadow( sampler2D shadowMap, vec2 shadowMapSize,
				float shadowBias, float shadowRadius, vec4 shadowCoord ) {
				float shadow = 1.0;
				shadowCoord.z += shadowBias;
				shadowCoord.xyz /= shadowCoord.w;
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
			}`,

		shadow: `float shadow() {
			DirectionalLightShadow dirLightShadow;
			dirLightShadow = directionalLightShadows[ 0 ];

			return getShadow( directionalShadowMap[ 0 ],
				dirLightShadow.shadowMapSize, dirLightShadow.shadowBias,
				dirLightShadow.shadowRadius, vDirectionalShadowCoord[ 0 ] );
			}`,

		// depth occlusion
		getShadowSharp:
			`float getShadowSharp( sampler2D shadowMap, vec2 shadowMapSize,
					float shadowBias, vec4 shadowCoord ) {
				float shadow = 1.0;
				shadowCoord.z += shadowBias;
				shadowCoord.xyz /= shadowCoord.w;
				bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0,
											 shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
				bool inFrustum = all( inFrustumVec );
				bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
				bool frustumTest = all( frustumTestVec );
				if ( frustumTest ) {
					shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
				}
				return shadow;
			}`,

		/** Find is the position at vP_DirShadowCoord in the directinal shadow
		 * - directionalLightShadows[0]. */
		vPShadow:
			`in vec4 vP_DirShadowCoord;
			float vPShadow() {
				DirectionalLightShadow dirLightShadow = directionalLightShadows[ 0 ];

				return getShadowSharp( directionalShadowMap[ 0 ],
						dirLightShadow.shadowMapSize, dirLightShadow.shadowBias,
						vP_DirShadowCoord );
			}`,
	}
}

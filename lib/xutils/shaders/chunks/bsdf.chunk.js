/** See glx.bsdfGGX */
export const bsdfGGX = `
	#ifndef commonglsl
	#define commonglsl
	#define PI 3.141592653589793
	#define PI2 6.283185307179586
	#define PI_HALF 1.5707963267948966
	#define RECIPROCAL_PI 0.3183098861837907
	#define RECIPROCAL_PI2 0.15915494309189535
	#define EPSILON 1e-6

	#define saturate(a) clamp( a, 0.0, 1.0 )
	#define pow2(x) (x*x)
	#endif

	vec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {`
		// Original approximation by Christophe Schlick '94
		// float fresnel = pow( 1.0 - dotLH, 5.0 );

		// Optimized variant (presented by Epic at SIGGRAPH '13)
		// https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
		+ `
		float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );
		return ( 1.0 - specularColor ) * fresnel + specularColor;
	}`

	// Microfacet Models for Refraction through Rough Surfaces - equation (34)
	// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
	// alpha is "roughness squared" in Disney’s reparameterization
	+ `
	float G_GGX_Smith( const in float alpha, const in float dotNL, const in float dotNV ) {`

		// geometry term (normalized) = G(l)⋅G(v) / 4(n⋅l)(n⋅v)
		// also see #12151

		+ `
		float a2 = pow2( alpha );

		float gl = dotNL + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
		float gv = dotNV + sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );

		return 1.0 / ( gl * gv );

	}` // validated

	// Moving Frostbite to Physically Based Rendering 3.0 - page 12, listing 2
	// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
	+ `
	float G_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
		float a2 = pow2( alpha );

		// dotNL and dotNV are explicitly swapped. This is not a mistake.
		float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
		float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}`

	// Microfacet Models for Refraction through Rough Surfaces - equation (33)
	// http://graphicrants.blogspot.com/2013/08/specular-brdf-reference.html
	// alpha is "roughness squared" in Disney’s reparameterization
	+ `
	float D_GGX( const in float alpha, const in float dotNH ) {
		float a2 = pow2( alpha );
		float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0; // avoid alpha = 0 with dotNH = 1
		return RECIPROCAL_PI * a2 / pow2( denom );
	}`

	// GGX Distribution, Schlick Fresnel, GGX-Smith Visibility
	// vec3 BRDF_Specular_GGX( const in IncidentLight incidentLight, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float roughness ) {
	+ `
	vec3 bsdfGGX( const in vec3 incident, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float roughness ) {

		float alpha = pow2( roughness ); // UE4's roughness

		vec3 halfDir = normalize( incident + viewDir );

		float dotNL = saturate( dot( normal, incident ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotLH = saturate( dot( incident, halfDir ) );

		vec3 F = F_Schlick( specularColor, dotLH );

		float G = G_GGX_SmithCorrelated( alpha, dotNL, dotNV );

		float D = D_GGX( alpha, dotNH );

		return F * ( G * D );
	}
`;

// TODO
// https://github.com/selfshadow/ltc_code/
// https://blog.selfshadow.com/ltc/webgl/ltc_quad.html
// https://drive.google.com/file/d/0BzvWIdpUpRx_d09ndGVjNVJzZjA/view
// Rect Area Light
export const lctRect =
// Real-Time Polygonal-Light Shading with Linearly Transformed Cosines
// by Eric Heitz, Jonathan Dupuy, Stephen Hill and David Neubelt
// code: https://github.com/selfshadow/ltc_code/
	`
	vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
		const float LUT_SIZE = 64.0;
		const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
		const float LUT_BIAS = 0.5 / LUT_SIZE;

		float dotNV = saturate( dot( N, V ) );`
		// texture parameterized by sqrt( GGX alpha ) and sqrt( 1 - cos( theta ) )
		+ `
		vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
		uv = uv * LUT_SCALE + LUT_BIAS;
		return uv;
	}

	float LTC_ClippedSphereFormFactor( const in vec3 f ) {`
		// Real-Time Area Lighting: a Journey from Research to Production (p.102)
		// An approximation of the form factor of a horizon-clipped rectangle.
		+ `
		float l = length( f );
		return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
	}

	vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
		float x = dot( v1, v2 );
		float y = abs( x );`
		// rational polynomial approximation to theta / sin( theta ) / 2PI
		+ `
		float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
		float b = 3.4175940 + ( 4.1616724 + y ) * y;
		float v = a / b;
		float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
		return cross( v1, v2 ) * theta_sintheta;
	}

	vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {`
		// bail if point is on back side of plane of light
		// assumes ccw winding order of light vertices
		+ `
		vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
		vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
		vec3 lightNormal = cross( v1, v2 );

		if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );`
		// construct orthonormal basis around N
		+ `
		vec3 T1, T2;
		T1 = normalize( V - N * dot( V, N ) );
		T2 = - cross( N, T1 ); // negated from paper; possibly due to a different handedness of world coordinate system`
		// compute transform
		+ `
		mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );`
		// transform rect
		+ `
		vec3 coords[ 4 ];
		coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
		coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
		coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
		coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );`
		// project rect onto sphere
		+ `
		coords[ 0 ] = normalize( coords[ 0 ] );
		coords[ 1 ] = normalize( coords[ 1 ] );
		coords[ 2 ] = normalize( coords[ 2 ] );
		coords[ 3 ] = normalize( coords[ 3 ] );`
		// calculate vector form factor
		+ `
		vec3 vectorFormFactor = vec3( 0.0 );
		vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
		vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
		vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
		vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] ); `
		// adjust for horizon clipping
		+ `
		float result = LTC_ClippedSphereFormFactor( vectorFormFactor );

		return vec3( result );
	}
`;

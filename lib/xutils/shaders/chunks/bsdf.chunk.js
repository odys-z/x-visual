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

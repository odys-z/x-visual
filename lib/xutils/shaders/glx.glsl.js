import {Vector2, Vector3, Vector4} from '../../../packages/three/three.module-MRTSupport'
import {shadow120} from './chunks/shadow.chunk'
import {toneMapping} from './chunks/tone-mapping.chunk'
import {bsdfGGX} from './chunks/bsdf.chunk'
import {mrt} from './chunks/mrt.chunk'
import {bokehDepth, bokehFilter} from './chunks/bokeh.chunk'
import {xenv} from './chunks/xenv.chunk'
import {tex} from './chunks/tex.chunk'

export const MixMode = {
    /** discard fragment when alpha less than threshold */
	discard: 1 << 0,
    /** defualt normal mix */
	mix: 1 << 1, // default
    /** defualt normal mix */
	multiply: 1 << 2,
    /** adding (clampped) */
	additive: 1 << 3,
    /** color acculating by multiplication */
    product: 1 << 4,
    /** color difference */
    differential: 1 << 5
}

export
/**Glsl sub common configuration.
 * @enum {string} */
const glConfig = {
	/** bloom light energy threshold (color length) */
	thresh0: '(1.2)',

	/** Ambient reflection coefficient, default '0.3' */
	ka: '(0.3)',
	/** Diffuse reflection coefficient, default '1.0' */
	kd: '(1.0)',
	/** Specular reflection coefficient, default '0.8' */
	ks: '(0.8)',

	refractionRatio: '(0.96)',

	/**Weight amplifier for line resterization */
	lineWeight: '(0.01)',

	/** * @deprecated
	* default is parallel light, to change to point light, set as:
	*  normalize(lightpos - worldpos.xyz)
	*/
	dirLight: 'normalize(lightpos)', //

	/**Size of shadow map, x, y, w, h
	 * LDR: low dynamic ragner renderer - low detail enhancement
	 */
	shadow: {
		w: 1024, h: 1024,
		x: 1024, y: 1024,
		LDR: (sname) => {
			return typeof sname === 'string' ? `( 1. - 0.5 * ${sname} )` : '(1.)';
		}
	},

	/** main scene / gbuffer buffer size */
	xbuffer: {
		w: 1024, h: 1024,
		/** If > 0, have findal quad reduce color from xbuffer for e,g. debugging
		 * filters. */
		yeildColor: 0.2,
	},

	/** filter quad buffer size */
	xfilter: {
		w: 1024, h: 1024,
		/** defualt hue, original value = (1.4, 1.2, 1.0) */
		// flareHue: [0.8, 0.7, 0.6],

		/** @deprecated */
		bokehSamples: 4,
		/** @deprecated */
		bokehRings: 3,

		maxBokeh: '8.0',
	},
}

export
/**Glsl sub functions
 * @enum {string} glx */
const glx = {
	/** common part for MRT */
	mrt,

	/** common part for MRT envMap */
	threshold: xenv.threshold(glConfig.thresh0),

	bokehDepth,

	bokehFilter,

	/**<p>uniform float u_alpha</p>
	* Used for keep the name consists.
	*/
	u_alpha: 'uniform float u_alpha;',

	/**<p>uniform float whiteAlpha</p>
	* Used for keep the name consists.
	*/
	u_whiteAlpha: 'uniform float whiteAlpha;',

	/**Is the bit is true?<br>
	* At least better than this:<br>
	* a = ...5, bit = 2 (start at 0), a_rem = a % 2^3 = 5, div = 5 / 4 >= 1
	*
	* Reference: <a href='https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf'>
	* WebGL 1.0 API Quick Reference Card</a>
	*/
	bitTrue: `bool bitTrue(int a, int bit) {
		float a_rem = mod(float(a), exp2(float(bit+1)));
		return a_rem / exp2(float(bit)) >= 1.;
	}`,

	/**<p>Function: </p>
	 * <p>vec3 mixColorT(vec3 cola, vec3 colb, float t) </p>
	 * mix color a &amp; b, interpolated at t (0 ~ 1)<br>
	 * @param {MixMode} mode
	 */
	mixColorT: (mode) => { let m =
		(mode === MixMode.additive ?
		`vec3 mixColorT(vec3 cola, vec3 colb, float t) {
			t = clamp(t, 0.0, 1.0);
			return cola * (1.0 - t) + colb * t;
		}`
		: mode === MixMode.multiply ?
		// multiply, see Three.js/src/renderers/shaders/ShaderChunk/envmap_fragment.glsl.js
		`vec3 mixColorT(vec3 cola, vec3 colb, float t) {
			return mix(cola, cola * colb, t);
		}`
		: // mix or the defualt
		`vec3 mixColorT(vec3 cola, vec3 colb, float t) {
			return mix(cola, colb, t);
		}`);
		return m;
	},

	/**<h6>Fragment Function: Normal Revert</h6>
	 * function
	 * if instancing = false: vec3 transNormal(vec3 objNorm)<br>
	 * if instancing = true: vec3 transNormal(vec3 objNorm, mat4 insatance-matrix)<br>
	 *
	 * <p>Note:</p>
	 * This function use 'normalMatrix' and 'viewMatrix' as global uniform, which
	 * stands for inverse normal transform and view transfromation.
	 *
	 * why: normal will rotated at the strenched point, as in:
	 *
	 * reference: Three.js/src/renderers/shaders/ShaderChunk/defaultnormal_vertex.glsl.js
	 *
	 */
	revertNormal: (flipFace, instancing) => {
		let flp = flipFace ? 'n = -n;' : '';
		if (instancing) return `
			vec3 revertNormal(vec3 n, mat4 instanceMat) {
				mat3 m = mat3( instanceMat );
				n /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
				n = m * n;
				n = normalMatrix * n;
				n = normalize( ( vec4( n, 0.0 ) * viewMatrix ).xyz );
				${flp}
				return n;
			}`;
		else return `
			vec3 revertNormal(vec3 n) {
				n = normalMatrix * n;
				n = normalize( ( vec4( n, 0.0 ) * viewMatrix ).xyz );
				${flp}
				return n;
			}`;
	},

	/** Stolen from three.js/src/renderers/shaders/ShaderChunk/bsdfs.glsl.js
	 * <p>Refernce</p>
	 * An introduction for beginner: <a href='https://www.sciencedirect.com/topics/computer-science/diffuse-surface'>
	 * MATHEMATICS OF LIGHTING AND SHADING</a><br>
	 * A dissertation that's good for first learning: <a href='https://hal.archives-ouvertes.fr/tel-01291974/file/TH2015DupuyJonathan2.pdf'>
	 * Jonathan Dupuy, Photorealistic Surface Rendering with Microfacet Theory</a>
	 */
	bsdfGGX,

	/**Get repeating uv for texture sampling.
	 *
	 * TODO doc: debug notes: uv must be continuous<br>
	 * https://community.khronos.org/t/texture-wrapping-in-shader-mipmapping/53799</br>
	 * https://www.shadertoy.com/view/4t2yRD</br>
	 * https://iquilezles.org/www/articles/tunnel/tunnel.htm</br>
	 */
	fractuv: `
		vec2 fractuv(vec2 uv) {
			vec2 fuv = mod(uv, 2.);
			if (fuv.s <= 1.)
			  fuv.s = fuv.s;
			else
			  fuv.s = 2. - fuv.s;
			if (fuv.t <= 1.)
			  fuv.t = fuv.t;
			else
			  fuv.t = 2. - fuv.t;
			return fuv;
		}`,

	/**<p>Get alpha according to eye and normal angle, can be applied to texture.</p>
	 * function: float fresnelAlpha(vec3 e, vec3 P, vec3 np)<br>
	 * param:<br>
	 * e: eye<br>
	 * P: position<br>
	 * np: normal at P
	 * return:<br>
	 * alpha value like of <a href='https://en.wikipedia.org/wiki/Fresnel_equations'>
	 * fresnel effect</a>.
	 */
	fresnelAlpha: `float fresnelAlpha(vec3 e, vec3 P, vec3 np) {
			vec3 i = normalize(e - P);
			float a = dot( i, normalize(np) );
			return a > 0. ? 1. - a : 0.;
		}`,

	/* <p>Change Colour According Fresnel Effect.</p>
	 * <p>Modified from Three.js's Schlick functions - roughness & specular color dependent on fresnel.</p>
	 * function: vec3 fSchlick(vec3 col, vec3 incident, vec3 viewDir, float rough)<br>
	 * param: <br>
	 * col: colore to be changed<br>
	 * incident: incident reversed (Three.js convention)<br>
	 * viewDir: dir to eye<br>
	 * rough: roughness 0 ~ 1<br>
	 * See also:
	 * <a href='https://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-shading/reflection-refraction-fresnel'>
	 * what a typical fresnel can be</a> and
	 * docs/design-memo/shader/fresnel (error).
	 */
	fSchlick_specular: `vec3 fSchlick_specular( vec3 col, vec3 incident, vec3 viewDir, float rough) {
			incident = normalize(incident) ;
			float dotLH = clamp( dot( incident, normalize(viewDir) ), 0., 1. );

			float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );
			vec3 Fr = max( vec3( 1.0 - rough ), col ) - col;

			return Fr * fresnel + col;
		} `,

	fSchlick: `vec3 fSchlick( vec3 col, vec3 incident, vec3 viewDir, float rough) {
			incident = normalize(incident) ;
			vec3 halfDir = incident + normalize(viewDir);
			float dotLH = 1. - clamp( dot( incident, halfDir ), 0., 1. );

			float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );
			vec3 Fo = max( vec3( 1.0 - rough ), col ) - col;

			return Fo * fresnel + col;
		}`,

	transformDirection: `vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
				return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
			}`,

	equirectUv: `vec2 equirectUv( in vec3 vDir, float reciprocal_pi, float reciprocal_pi2 ) {
				vec3 dir = normalize(vDir);
				float u = atan( dir.z, dir.x ) * reciprocal_pi2 + 0.5;
				float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * reciprocal_pi + 0.5;
				return vec2( u, v );
			}`,

	/**Find distance to ellipsoid */
	sdEllipsoid: `vec2 sdEllipsoid( vec3 eye, vec3 u, float r, vec3 centr, vec3 abc ) {
		// e = o - c, where o = eye, c = center
		vec3 e = eye - centr;
		e = e / abc;

		// delta = (u . e)^2 + r^2 - |e|^2
		u = normalize(u / abc);

		float delta = pow( dot( u, e ), 2. ) + pow( r, 2. ) - dot(e, e);
		if (delta < 0.) return vec2(delta);
		// d = - u.e +/- delta^0.5
		delta = pow( delta, 0.5 );
		return vec2( -dot( u, e ) + delta, -dot( u, e ) - delta );
	}`,

	/** Mix 3 colors of interposition t */
	thermalColor: `vec4 thermalColor(vec3 colrs[3], vec2 t0_1, float t) {
		float midrange = abs(t0_1.y - t0_1.x) / 2.;

		vec3 c0 = colrs[0];
		vec3 c1 = colrs[1];

		if (t > midrange) {
		    c0 = colrs[1]; c1 = colrs[2];
		    t = t - midrange;
		}

		return clamp(vec4(mix(c0, c1, t / abs(t0_1.y - midrange)), 1.), 0., 1.);
	}`,

	/**<h6>Fragment Function.</h6>
	 * @deprecated
	 * Get color on module face, reducing on distance, and is perspective on face,
	 * not used for volumetric rendering.<br>
	 * function: float pointFace( vec3 p, vec3 c )<br>
	 * parameters:<br>
	 * p: varying from vertex position, transformed to world:<pre>
       vec4 v4 =  modelMatrix * vec4(  vec3(-150., 0., -50.), 1.0 );
       P0 = v4.xyz;</pre>
	 * c: the point in world, e.g. varying c<pre>
	 * c = modelMatrix * vec4(0.);</pre>
	 * return {float}: distance
	*/
	pointFace: `float pointFace( vec3 p, vec3 c ) {
			return length(p - c);
			} `,

	/**<h6>Fragment Function.</h6>
	 * 2D round box distance<br>
	 * parameters:<br>
	 * function: float box2(vec2 p, vec2 size, float r)<br>
	 * p {vec2}: varying from vertex poisition, transformed to world<br>
	 * size {vec2}: box size<br>
	 * r {float}: corner radius<br>
	 * return {float}: distance
	 */
	box2: `float box2(vec2 p, vec2 size, float r){
			return length(max(abs(p) - size, 0.0)) - r;
		}`,

	/**<h6>Fragment Function.</h6>
	 * 3D round box distance<br>
	 * parameters:<br>
	 * function: float box2(vec2 p, vec2 size, float r)<br>
	 * p {vec3}: varying from vertex poisition, transformed to world<br>
	 * size {vec3}: box size<br>
	 * r {float}: corner radius<br>
	 * return {float}: distance
	 */
	box3: `float box3(vec3 p, vec3 size, float r){
			return length(max(abs(p) - size, 0.0)) - r;
		} `,

	/**Line Rasterize Function.
	 *  https://math.stackexchange.com/questions/2213165/find-shortest-distance-between-lines-in-3d
	 * 𝐧 = 𝐞1 × 𝐞2 = (−20, −11, −26)
	 * return {float}: distance
	 */
	line: `float line(vec3 e, vec3 P, vec3 p0, vec3 p1, float w) {
			vec3 e2 = p1 - p0;
			vec3 e1 = P - e;
			vec3 n = normalize(cross(e1, e2));
			float dist = dot(n, e - p0);
			dist = 1.0/dist * w * ${glConfig.lineWeight};
			return min(dist * dist, 1.0);
		}`,

	/**Rotate in 2D for angle of radian.
	 * function: vec2 rotate2(float radi, vec2 v)
	 * parameters:<br>
	 * radi {float} angle in radian
	 * v {vec2} vectore to be rotated
	 * return m * v. where
	 * m =  c s
	 *     -s c
	 */
	rotate2: `vec2 rotate2(float radi, vec2 v) {
			float s = sin(radi);
			float c = cos(radi);
			return vec2(
			  c * v.x + s * v.y,
			  -s* v.x + c * v.y );
		}`,

	rotateY: `vec3 rotateY(float radi, vec3 v) {
			float s = sin(radi);
			float c = cos(radi);
			return vec3(
			  c * v.x + s * v.z,
			  v.y,
			  -s* v.x + c * v.z );
		}`,

	/**
	* Ray plane intersection.
	* function: vec4 rayPlaneInsec(vec3 l0, vec3 l, vec3 p0, vec3 n)
	* return vec4 (pos, distance), distance > 0 iff there is one point.
	* Reference: <a href='https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection#Algebraic_form'>
	* wikipedia</a>
	*/
	rayPlaneInsec: `vec4 rayPlaneInsec(vec3 l0, vec3 l, vec3 p0, vec3 n) {
			float d = dot( (p0 - l0), n );
			float l_n = dot(l, n);
			if (l_n == 0.) {
			  if (dot(p0 - l0, n) == 0.)
			    return vec4(l0, 0.); // in plane
			  else return vec4(p0, -1.); // parallel
			}
			d /= l_n;
			vec3 p_ = l0 + normalize(l) * d;
			return vec4(p_, abs(d));
		}`,

	/**Get color weight according to xy, yz, xz box distance.
	 * Thes function depends on glx.rotateY, glx.rayPlaneInsec, glx.box3
	 * return colore weight
	 */
	box3Color: `float box3Color(vec3 e, vec3 i, vec3 c0, vec3 n0, float radi, vec3 size, vec2 tiles, float w) {
			n0 = rotateY(-radi, n0);
			vec4 p0 = rayPlaneInsec( e, i, c0, n0 );

			if (p0.w > 0.) {
			  vec3 p_ = p0.xyz - c0;
			  vec3 p_0 = rotateY(radi, p_);

			  float box = box3( p_0, size * 0.5, 0.5 );
			  box = 1.0/box * w * (1. - va);

			  float tes = 0.02 * (1. - va) * ( 1. - abs( sin(now * 0.0005) ) );
			  return max(box, 0.05) * tes + abs(box) * 0.004;
			}
			else return 0.;
		}`,

	/**Get phong light.<br>
	 * sub function lambershine():<br>
	 * Lambert's cosine law<br>
	 * return: vec2(lambertian, specular)<br>
	 * To use in phong:<pre>
        vColor = vec4(Ka * ambientColor +
	              Kd * lambertian * diffuseColor +
	              Ks * specular * specular, u_alpha);
	</pre>
	 * Code Comments:<br>
	 * lambertian: angle between normal and incident<br>
	 * R: reflect direction<br>
	 * V: vector to viewer<br>
	 *
	 * <h6>External Link</h6>
	 * <a href='file:///home/ody/git/x-visual/docs/design-memo/shaders/phong.html'>
	 * x-visual doc: Morphing Phong Material</a><br>
	 * <a href='http://www.cs.toronto.edu/~jacobson/phong-demo/'>
	 * referencing implementation @ cs.toronto.edu</a><br>
	 * <a href='https://www.rp-photonics.com/lambertian_emitters_and_scatterers.html'>
	 * Lambertian Emitters and Scatters</a>
	 */
	phongLight: `vec2 lambershine(vec3 n, vec3 lightpos, vec3 e, vec3 vertpos, float shininess, float roughness) {
				vec3 L = normalize(lightpos - vertpos);
				vec3 N = normalize(n);
				float lambertian = max(dot(N, L), roughness / (1. + roughness));
				vec3 R = reflect(-L, N);
				float specAngle = max(dot(R, normalize(e - vertpos)), 0.0);
				float specular = pow(specAngle, shininess);
				return vec2(lambertian, specular);
			}
			vec4 phongLight(vec3 n3, vec3 lightpos, vec3 eye, vec3 vertpos,
					vec3 ambient, vec3 diffuse, vec3 specular, float shininess, float rough) {
				float Ka = ${glConfig.ka};
				float Kd = ${glConfig.kd};
				float Ks = ${glConfig.ks};

				vec2 lambshine = lambershine(n3, lightpos, eye, vertpos, shininess, rough);
				return vec4 ( Ka * ambient
							+ Kd * lambshine.s * diffuse
							+ Ks * lambshine.t * specular
							, u_alpha);
		} `,

	/**<h6>Vertex Shader</h6>
	 * Get building wall texture's alpha - used for transparent building like glass
	 * cube, without refrection.
	 */
	buildingAlpha: `float buildingAlpha(vec3 e, vec3 P, vec3 np) {
			vec3 i = normalize(e - P);
			float a = dot( i, normalize(np) );
			return a > 0. ? 1. - a : 0.;
		}`,

	shadow: {
		/** use this in vertex like:<pre>
		uniform mat4 directionalShadowMatrix[ ${n_light} ];
		setShadowCoords(directionalShadowMatrix, worldPosition);</pre>
		* Don't change name of directionalShadowMatrix, it's set by Three.js lights.
		*/
		setShadowCoords: shadow120.v.setShadowCoords,
		frag: [ shadow120.f.uni_varys, shadow120.f.unpackRGBAToDepth,
				shadow120.f.texture2DCompare, shadow120.f.getShadow, shadow120.f.shadow
		].join('\n')
	},

	vPShadow: {
		/** use this in vertex like:<pre>
		uniform mat4 directionalShadowMatrix[ ${n_light} ];
		setShadowCoords(directionalShadowMatrix, worldPosition);</pre>
		* Don't change name of directionalShadowMatrix, it's set by Three.js lights.
		*/
		setVpDirShadowcoord: shadow120.v.setVpDirShadowcoord,
		frag: [ shadow120.f.uni_varys, shadow120.f.unpackRGBAToDepth,
				shadow120.f.texture2DCompare, shadow120.f.getShadowSharp,
				shadow120.f.vPShadow
		].join('\n')
	},

	/** Only Reinhard Tome Mapping currently
	 * <p>function:</p>
	 * <p>vec3 reinhardTone ( vec3 color, float toneMappingExposure ) </p>
	 * example:<pre>
      uniform float exposure;
      toneMapping(color3, exposure);</pre>
	 * */
	reinhardTone: toneMapping.reinhardTone,

	tex
}

/**
 * Error thrown by shader/*.glsl.
 * @param {number} err error message
 * @param {number} [code] error code
 * @class GlxError
 */
export function GlxError(err, code) {
	this.code = code;
	this.message = err;
	this.name = 'GlxError';
}

/** A common functionf for initialize phong uniforms. Supposed to be changed in
 * the future - phong uniforms should not very common for different shader?
 * <p><b>Don't use this directly. This is only a shortcut of certain shaders.</b></p>
 * @param {object=} uniforms if undefined, will create one
 * @param {object} light
 * @param {paras=} paras usually Visual.paras
 * @return {object} uniforms
 * @member xglsl.initPhongUni
 * @function
 */
export function initPhongUni(uniforms = {}, light, paras = {}) {
	uniforms.u_shininess = { value: paras.shininess ||
							 (uniforms.u_shininess ? uniforms.u_shininess.value : 1) };
	uniforms.u_specularColor = { value: paras.shineColor ?
							new Vector3(...paras.shineColor) :
							new Vector3(1., 1., 1.) };

	uniforms.u_ambientColor = { value: new Vector3( ...
							(light.ambient || [0, 0, 0]) ) };

	uniforms.u_lightPos = { value: new Vector3(...(light.position || [1, 1, 1]))};

	uniforms.u_lightIntensity = { value: light.intensity === undefined ?
										1 : light.intensity };

	uniforms.u_color = {value: new Vector4(...light.diffuse)};

	return uniforms;
}

/** A common functionf for undating phong uniforms. Supposed to be changed in the
 * future - phong uniforms should not very common for different shader?
 * <p><b>Don't use this directly. This is only a shortcut of certain shaders.</b></p>
 * @param {object} uniforms uniforms to updated.
 * @param {object=} light
 * @param {paras=} paras usually Visual.paras
 * @return {object} uniforms
 * @member xglsl.updatePhongUni
 * @function
 */
export function updatePhongUni(uniforms, light, paras = {}) {
	if (!uniforms)
		// nothing to bu updated
		return;

	if (typeof paras.shininess === "number") {
		uniforms.u_shininess.value = paras.shininess;
	}
	if (Array.isArray(paras.shineColor) && paras.shineColor.length === 3) {
		uniforms.u_specularColor.value = new Vector3(...paras.shineColor);
	}

	if (light && light.dirty) {
		if (Array.isArray(light.ambient) && light.ambient.length === 3) {
			uniforms.u_ambientColor.value = new Vector3(...light.ambient);
		}
		if (Array.isArray(light.position) && light.position.length === 3) {
			uniforms.u_lightPos.value = new Vector3(...light.position);
		}
		if (typeof light.intensity === "number") {
			uniforms.u_lightIntensity.value = light.intensity;
		}
		if (Array.isArray(light.diffuse) && light.diffuse.length >= 3) {
			uniforms.u_color.value = new Vector4(...light.diffuse, 1);
			// console.log('update u_color', uniforms.u_color);
		}
	}
}

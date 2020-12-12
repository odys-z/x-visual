import { Vector3, Vector4, Vector2, FrontSide, RepeatWrapping, NearestFilter, LinearMipmapLinearFilter
} from '../../packages/three/three.module-MRTSupport';
import * as THREE from '../../packages/three/three.module-MRTSupport'
import { x } from '../xapp/xworld';
import { ShaderFlag, ShaderAlpha, AssetType } from '../component/visual';
import * as xutils from './xcommon';
import { XError } from './xcommon';
import AssetKeepr from './assetkeepr';
import { randomParticl } from './shaders/random-particl.glsl';
import { cubeVoxels, cubeVoxelGeom } from './shaders/cube-voxels.glsl';
import { colorLine } from './shaders/color-line.glsl';
import { phongMorph2 } from './shaders/color-array.glsl';
import { scaleOrb } from './shaders/orb-scale.glsl';
import { orbGroups } from './shaders/orb-groups.glsl';
import { worldOrbs } from './shaders/orb-world.glsl';
import { thermalTile } from './shaders/tile-thermal.glsl';
import { texPrism } from './shaders/texprism.glsl';
import { texEnv } from './shaders/tex-env.glsl';
import { boxLayers, xyzLayer2 } from './shaders/shape-layers.glsl';
import { blinkStar, pointGeom } from './shaders/blink-star.glsl';
import { reflectex } from './shaders/reflectex.glsl';
import { testPoint } from './shaders/testpoint.glsl';
import { fragShape } from './shaders/frag-shape.glsl';
import { glConfig } from './shaders/glx.glsl';

/** Global shadered default texture */
// var _u_tex_;

export default
/**X-visual helper for handling shader material's unforms.
 * @class GlUniform
 */
class GlUniform {
	/** @constructor gluniform */
	constructor (config) {
		this.cfg = Object.assign(glConfig, config);
	}

	/**
	 * Replace function formatUniforms(visual, obj3, light)
	 *
	 * Merge Visual.paras.uniforms, load texture according to Visual.paras.u_tex.
	 *
	 * Scince v0.3.36, this method also modified obj3.lightened = true if the shader
	 * using xlight's parameter. Only material of x-visual extension is possible, any
	 * light effects of THEE.Materials is updated by xlight.hemisphereLight (instance
	 * of DirectionalLight).
	 * @param {Visual} visual Entities Visual component
	 * @param {Obj3} obj3 not used?
	 * @param {object=} ligth (optinal) light options
	 * @param {object=} camear (optinal) camear options
	 * @param {object=} ecs must presented if paras like envMap referencing other entities
	 * @return {object} uniforms for Mesh - properties are in format of name: {value}
	 * @member gluniform.init
	 * @function
	 */
	static init(visual, obj3, light = {}, camera = {}, ecs) {
		var uniforms = {};
		let vparas = visual ? visual.paras || {} : {};

		// common section
		let u_tex = GlUniform.uTex(vparas);
		if (typeof u_tex === 'string') {
			uniforms.u_tex = GlUniform.tex0();
			load(uniforms, 'u_tex', u_tex);
		}
		else if (Array.isArray(u_tex)) {
			for (let i = 0; i < u_tex.length; i++) {
				let ntex = `u_tex${i}`;
				uniforms[ntex] = GlUniform.tex0();
				GlUniform.loadTexAsynch(uniforms, ntex, u_tex[i]);
			}
		}
		else
			uniforms.u_tex = { value: AssetKeepr.cheapixelTex() };

		// u_color
		// Desgin Memo v0.3.33
		// This must been set before uniPhongs() handling, which override u_color = light.skyColor
		if (vparas.color) {
			uniforms.u_color = {value: new Vector4(...vparas.color)};
		}

		uniforms.side = {value: !vparas || vparas.side === undefined
								? FrontSide : vparas.side};
		uniforms.u_alpha = {value: GlUniform.uAlpha(vparas)};

		// setup a default texture, a grey pixel to avoid this error:
		// ERROR :GL_INVALID_OPERATION : glDrawElements: Source and destination textures of the draw are the same.
		// Cause: It is not sufficient to bind the texture to a texture,
		// the index of the texture has to be set to the texture sampler uniform, too.
		// comments on https://stackoverflow.com/questions/50777793/gldrawelements-source-and-destination-textures-of-the-draw-are-the-same
		if (!uniforms.u_tex &&
			(  visual.shader === ShaderFlag.worldOrbs
			|| visual.shader === ShaderFlag.scaleOrb
			|| visual.shader === ShaderFlag.orbGroups
			|| visual.shader === ShaderFlag.tiledOrbs) ) {
			if (visual.asset)
				uniforms.u_tex = { value: AssetKeepr.loadTexure(visual.asset) };
			else
				uniforms.u_tex = { value: AssetKeepr.cheapixelTex() };
		}

		if (vparas.uniforms)
			Object.assign(uniforms, GlUniform.obj2uniforms(vparas.uniforms));

		// switch of shader types
		if (visual.shader === ShaderFlag.colorArray) {
			phongMorph2.initUniform(uniforms, light, vparas);

			if (vparas.colors) {
				// TODO should we use uniform array ?
				for (var i = 0; i < vparas.colors.length; i++)
					uniforms[`u_colors${i}`] = {value: new Vector4(...vparas.colors[i])};
			}
		}
		else if (visual.shader === ShaderFlag.texEnv) {
			texEnv.initUniform(uniforms, light, vparas);

			// if (vparas.colors) {
			// 	// TODO should we use uniform array ?
			// 	for (var i = 0; i < vparas.colors.length; i++)
			// 		uniforms[`u_colors${i}`] = {value: new Vector4(...vparas.colors[i])};
			// }

			if (vparas.u_texNoise)
				uniforms.u_texNoise  = { value: AssetKeepr.loadTexure(vparas.u_texNoise) };
			if (vparas.u_texbump)
				uniforms.u_texbump  = { value: new Vector2(...vparas.u_texbump) };
			else
				uniforms.u_texbump  = { value: new Vector2(0) };
		}
		else if (visual.shader === ShaderFlag.scaleOrb) {
			uniforms.wpos = {value: vparas.wpos ?
							new Vector3(...p) : new Vector3(0, 0, 0)};
			uniforms.r = {value: vparas.orbR === undefined
								 ? 20 : vparas.orbR};
			// uniforms.whiteAlpha = {value: visual.paras.whiteAlpha === undefined
			// 			? 0 : visual.paras.whiteAlpha};
			var os = vparas.orbScale;
			uniforms.orbScale = {value: os === undefined
						? new Vector3(1, 0.2, 0.2)
						: new Vector3(os[0], os[1], os[2])};
		}
		else if (visual.shader === ShaderFlag.orbGroups) {
			// orbs in a group (always have 1 orb)
			var offsets = vparas.offsets || [0];
			var orbs = vparas.offsets ? vparas.offsets.length : 1;
			var rs = [];
			for (var r of vparas.orbR || [10]) {
				rs.push(r);
			}
			var orbColors = [];
			for (var c of vparas.colors) {
				orbColors.push(new Vector3(...c));
			}
			uniforms.orbs = { value: orbs };
			uniforms.offsets = { value: offsets };
			uniforms.orbColors = { value: orbColors };
			uniforms.r = { value: rs };

			// groups
			if ( ! Array.isArray(vparas.follows)
				|| vparas.follows.length <= 0) {
				console.error(visual);
				throw new XError('Paras.follows for orbGroups\'s groups are not correct!');
			}

			uniforms.u_t = { value: 0 };
			uniforms.tmin = { value: vparas.t_range ? vparas.t_range[0] : 0 };
			uniforms.tmax = { value: vparas.t_range ? vparas.t_range[1] : 1 };

			var wpos = [];
			var wtan = [];
			var flws = [];
			for (var follow of vparas.follows) {
				wpos.push(new Vector3(0));
				wtan.push(new Vector3(1, 0, 0));
				flws.push(follow);
			}
			uniforms.wpos = { value: wpos };
			uniforms.wtan = { value: wtan };
			uniforms.follows = { value: flws };

			// uniforms.whiteAlpha = { value: visual.paras.whiteAlpha === undefined
			// 			? 0 : visual.paras.whiteAlpha };
			var os = vparas.orbScale;
			uniforms.orbScale = { value: os === undefined
						? new Vector3(1, 0.2, 0.2)
						: new Vector3(os[0], os[1], os[2]) };
		}
		else if (visual.shader === ShaderFlag.worldOrbs
				|| visual.shader === ShaderFlag.tiledOrbs) {
			var poses = [];
			var orbs = 0;
			if (vparas.offsets === undefined)
				vparas.offsets = [[0, 0, 0]];
			for (var p of vparas.offsets) {
				poses.push(new Vector3(...p));
				orbs++;
			}
			var rs = [];
			var orbRs = typeof vparas.orbR === 'number'
						? [vparas.orbR] : vparas.orbR || [10];
			for (var r of orbRs) {
				rs.push(r);
			}
			var orbColors = [];
			for (var c of vparas.colors) {
				orbColors.push(new Vector3(...c));
			}
			var wpos = vparas.wpos
				? new Vector3(...vparas.wpos) : new Vector3(0, 0, 0);

			uniforms.orbs = { value: orbs };
			uniforms.wpos = { value: wpos };
			uniforms.offsets = { value: poses };
			uniforms.orbColors = { value: orbColors };
			uniforms.r = { value: rs };
			// uniforms.whiteAlpha = { value: visual.paras.whiteAlpha === undefined
			// 			? 0 : visual.paras.whiteAlpha };
			var os = vparas.orbScale;
			uniforms.orbScale = { value: os === undefined
						? new Vector3(1, 0.2, 0.2)
						: new Vector3(os[0], os[1], os[2]) };
			if (visual.shader === ShaderFlag.tiledOrbs) {
				uniforms.now = { value: 0 };
				var groups = vparas.geostyle.groups || 1;
				uniforms.speedVert = { value: new Array(groups).fill(0.01) };
				uniforms.speedFrag = { value: new Array(groups).fill(0.01) };

				var colrs = new Array();
				var pcolrs = vparas.thermalColors || [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
				for (var c of pcolrs)
					colrs.push(new Vector3(...c));
				uniforms.thermalColors = { value: colrs };
				uniforms.maxHeight = { value: vparas.geostyle.maxHeight
							|| vparas.geostyle.height || 1 };
			}
		}
		else if (visual.shader === ShaderFlag.texPrism ||
				visual.shader === ShaderFlag.receiveShadow ||
 				visual.shader === ShaderFlag.boxLayers) {
			if (visual.shader === ShaderFlag.texPrism)
				texPrism.initUniform(uniforms, light, vparas);
			else
				xyzLayer2.initUniform(uniforms, light, vparas);

			// xz, xy, yz layers center
			uniforms.wpos = { value: vparas.wpos ?
				new Vector3(...vparas.wpos) : new Vector3(0, 0, 0) };

			// xz, xy, yz layers offset
			var offsetxyz = [0, 0, 0];
			if (vparas.yztile)
				offsetxyz[0] += vparas.yztile.x0 || 0;
			if (vparas.xztile)
				offsetxyz[1] += vparas.xztile.y0 || 0;
			if (vparas.xytile)
				offsetxyz[2] += vparas.xytile.z0 || 0;
			uniforms.u_offsetxyz = {value: new Vector3(...offsetxyz)};

			uniforms.now = { value: 0 };
			var groups = vparas.geostyle ? vparas.geostyle.groups || 1 : 1;
			uniforms.speedVert = { value: new Array(groups).fill(0.001) };
			uniforms.speedFrag = { value: new Array(groups).fill(0.001) };

			if (vparas.u_tex) {
				uniforms.u_tex = { value: AssetKeepr.loadTexure(vparas.u_tex[0]) };
				uniforms.u_basetex = { value: AssetKeepr.loadTexure(vparas.u_tex[1]) };
			}

			if (vparas.tile && vparas.tile.hue) {
				uniforms.u_hue = { value: new Vector4(...vparas.tile.hue) };
			}
			else
				uniforms.u_hue = { value: new Vector4(0.4, 0.2, 0.8, 1.0) };

			uniforms.u_north = { value: vparas.north || 0 };
		}
		else if (visual.shader === ShaderFlag.reflectex
			|| visual.vtype === AssetType.reflectex) {
				reflectex.initUniform(uniforms, light, vparas);
		}


		if (visual && (visual.shader & ShaderFlag.lightened) === ShaderFlag.lightened )
			obj3.lightened = true;

		// bokeh
		if (visual && (visual.shader & ShaderFlag.depthBokeh) === ShaderFlag.depthBokeh ) {
			uniforms.bokehFar = { value: camera.far || 2000 }
			uniforms.bokehNear = { value: camera.near || 0.1 }
		}


		// whiteAlpha
		if (visual.shader === ShaderFlag.scaleOrb  ||
			visual.shader === ShaderFlag.orbGroups ||
			visual.shader === ShaderFlag.worldOrbs ||
			visual.shader === ShaderFlag.tiledOrbs ) {
			uniforms.whiteAlpha = { value: vparas.whiteAlpha === undefined
						? 0 : vparas.whiteAlpha };
		}

		if ( vparas.envMap ) {
			// in case of raw material
			// FIXME must use the texture if target already loaded.
			uniforms.envMap = { value: AssetKeepr.cheapixelTex() };

			uniforms.u_exposure = { value: vparas.envExposure !== undefined
					? vparas.envExposure : 0.1 };

			uniforms.whiteAlpha = { value: vparas.whiteAlpha === undefined
						? 0 : vparas.whiteAlpha };
			// flip x for cube texture, none for equirectangle
			let eref = ecs.getEntity(vparas.envMap)
			if (!eref) throw new XError('entity not found: ', vparas.envMap);
			uniforms.flipEnvMap = {value: eref.Obj3.datum.flipx !== undefined ?
						eref.Obj3.datum.flipx : -1 };

			uniforms.lod = { value: vparas.lod
						? new Vector2(...vparas.lod) : new Vector2(0, 0) };

		}

		return uniforms;
	}

	static loadTexAsynch(uniforms, ntex, url) {
		AssetKeepr.loadTexure(url,
			function() {
				var _uniforms = uniforms;
				var _ntex = ntex;
				return (texture) => {
					texture.minFilter = NearestFilter;
					texture.magFilter = NearestFilter;
					texture.generateMipmaps = false;
					texture.wrapS = texture.wrapT = RepeatWrapping;
					texture.depthTest = false;

					texture.needsUpdate = true;
					_uniforms[_ntex] = {value: texture};
				}
			}());
	}

	/**Format Visual.paras.u_tex
	 * 1. format para.u_tex, deprecate Visual.asset
	 * @param {object} paras Visual.paras
	 * @return
	 */
	static uTex(paras) {
		if (paras && paras.uniforms && paras.uniforms.u_tex) {
			console.warn ( "GlUniform .init(): ignoring wrong paras: Visual.paras.uniforms.u_tex = ",
							paras.uniforms.u_tex,
						   "Should been used as Visual.paras.u_tex." );
			paras = Object.assign(paras || {}, {u_tex: paras.uniforms.u_tex});
			delete paras.uniforms.u_tex;
		}

		let u_tex = [];
		if (paras && paras.u_tex) {
			if (typeof paras.u_tex === 'string')
				u_tex = [paras.u_tex];
			else if (Array.isArray(paras.u_tex)) {
				// var texs = [];
				u_tex = paras.u_tex;
			}
		}
		else if (paras && paras.uniforms
			&& typeof paras.uniforms.u_tex === 'string') {
			u_tex = [paras.uniforms.u_tex];
			delete paras.uniforms.u_tex;
		}
		return u_tex;
	}

	static uAlpha(vparas) {
		if (vparas !== undefined && vparas.tex_alpha !== undefined) {
			console.error('Visual.paras.tex_alpha is replaced by u_alpha');
			return 1;
		}
		else
			return vparas !== undefined && vparas.u_alpha !== undefined
					? vparas.u_alpha : 1;
	};

	static uShadowSide(vparas) {
		if (vparas && vparas.shadowSide !== undefined)
			return vparas.shadowSide;
		else return null;
	}

	/**
	 * check uniforms exists<br>
	 * update uniforms in light if light.dirty = true;<br>
	 * update paras
	 * @param {object} uniforms
	 * @param {object} vparas paras in the same structure of Visual.paras
	 * @param {object} ligth light options
	 * @param {ShaderFlag=} shader Visual.shader, override vparas.shader
	 * 					({@link GlUniform} doesn't have it)
	 * @return {object} uniforms
	 * @member gluniform.update
	 * @function
	 *
	 * FIXME lagacy: envmap.flipEnvMap
	 * FIXME lagacy: whiteAlpha, LOD
	 */
	static update(uniforms, light, vparas, shader) {
 		if (typeof vparas.paras === "object") {
 			if (vparas.side !== undefined || vparas.tex_alpha !== undefined) {
 				uniforms.side.value = vparas.side;
 			}
 			if (vparas.tex_alpha !== undefined) {
 				uniforms.u_alpha.value = vparas.tex_alpha;
 			}
 		}

		shader = shader || vparas.shader;
 		if (shader !== undefined) {
 			if (shader === ShaderFlag.colorArray) {
 				phongMorph2.updateUniform(uniforms, light, vparas);
 				if (vparas.colors) {
 					// TODO should we use uniform array ?
 					for (let i = 0; i < vparas.colors.length; i++)
 						uniforms[`u_colors${i}`] = {
 							value: new Vector4(...vparas.colors[i])
 						};
 				}
 			}
			else if (shader === ShaderFlag.texEnv) {
				texEnv.updateUniform(uniforms, light, vparas);
				if (vparas.u_texNoise)
					uniforms.u_texNoise  = { value: AssetKeepr.loadTexure(vparas.u_texNoise) };
				if (vparas.u_texbump)
					uniforms.u_texbump  = { value: new Vector2(...vparas.u_texbump) };
				else
					uniforms.u_texbump  = { value: new Vector2(0) };
			}
			else if (shader === ShaderFlag.scaleOrb) {
				// TODO
 			}
			else if (shader === ShaderFlag.orbGroups) {
				// TODO
 			}
 			if (shader === ShaderFlag.tiledOrbs) {
				// TODO
 			}
			else if (shader === ShaderFlag.texPrism ||
				shader === ShaderFlag.receiveShadow ||
 				shader === ShaderFlag.boxLayers) {
 				if (shader === ShaderFlag.texPrism ||
					shader === ShaderFlag.receiveShadow)
 					texPrism.updateUniform(uniforms, light, vparas);
 				else
 					xyzLayer2.updateUniform(uniforms, light, vparas);

 				if (Array.isArray(vparas.wpos) && vparas.wpos.length > 0) {
 					uniforms.wpos = new Vector3(...vparas.wpos);
 				}

 				// xz, xy, yz layers offset
 				let offsetxyz = uniforms.u_offsetxyz.value;
 				if (vparas.yztile !== undefined) {
 					offsetxyz.x = vparas.yztile.x0;
 				}
 				if (vparas.xztile !== undefined) {
 					offsetxyz.y = vparas.xztile.y0;
 				}
 				if (vparas.xytile !== undefined) {
 					offsetxyz.z = vparas.xytile.z0;
 				}

 				if (typeof vparas.geostyle === "object" && vparas.geostyle.groups >= 1) {
 					let groups = vparas.geostyle.groups;
 					uniforms.speedVert.value = new Array(groups).fill(0.001);
 					uniforms.speedFrag.value = new Array(groups).fill(0.001);
 				}

 				if (vparas.u_tex) {
 					uniforms.u_tex = {
 						value: AssetKeepr.loadTexure(vparas.u_tex[0])
 					};
 					uniforms.u_basetex = {
 						value: AssetKeepr.loadTexure(vparas.u_tex[1])
 					};
 				}

 				if (vparas.tile && vparas.tile.hue) {
 					uniforms.u_hue.value = new Vector4(...vparas.tile.hue);
 				}
 				if (vparas.north !== undefined) {
 					uniforms.u_north.value = vparas.north
 				}
 			}
			else if (shader === ShaderFlag.reflectex
				// || visual.vtype === AssetType.reflectex
				) {
					reflectex.updateUniform(uniforms, light, vparas);
			}
 		}
 	}

	/**
	 * Convert object into Mesh.uniforms format (properties are {value} object).<br>
	 * x-visual v.s. Three.js material variable name mapping:<pre>
		three.js -&gt; x-visual shader
		opacity - u_alpha
	 </pre>
	 * @param {object} properties
	 * @param {Uniforms} uniforms
	 * @return {object} uniforms for Mesh - properties are in format of name: {value}
	 * @member GlUniform.obj2uniforms
	 * @function
	 */
	static obj2uniforms(properties, uniforms) {
		var u = new Object();
		for (var p in properties) {
			if (p === 'opacity')
				u.u_alpha = {value: properties[p]};
			else
				u[p] = {value: properties[p]};
		}
		return Object.assign(uniforms || new Object(), u);
	}

	/**Get a default RAM Texture
	 * This texture is not expensive, so we create a new object each time and apply
	 * filters for it.
	 * */
	static tex0(paras= {}) {
		let _u_tex = xutils.ramTexture(2, 2, { alpha: typeof paras.alpha === 'number' ? 0.5 : paras.alpha });
		_u_tex.minFilter = paras.minFilter || THREE.LinearMipmapLinearFilter;
		_u_tex.maxFilter = paras.magFilter || THREE.LinearMipmapLinearFilter;
		_u_tex.format = THREE.RGBFormat;
		// _u_tex.minFilter = paras.minFilter || THREE.NearestFilter;
		// _u_tex.magFilter = paras.magFilter || THREE.NearestFilter;
		return _u_tex;
	}
}

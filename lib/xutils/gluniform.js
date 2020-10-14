import { x } from '../xapp/xworld';
import { ShaderFlag, ShaderAlpha, AssetType } from '../component/visual';
import * as xutils from './xcommon';
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
import { boxLayers, xyzLayer2 } from './shaders/shape-layers.glsl';
import { blinkStar, pointGeom } from './shaders/blink-star.glsl';
import { reflectex } from './shaders/reflectex.glsl';
import { testPoint } from './shaders/testpoint.glsl';
import { fragShape } from './shaders/frag-shape.glsl';
import { glConfig } from './shaders/glx.glsl';

/** Global shadered default texture */
var _u_tex_;

export default
/**X-visual helper for handling shader material's unforms.
 * @class gluniform
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
	 * of THREE.DirectionalLight).
	 * @param {Visual} visual Entities Visual component
	 * @param {Obj3} obj3 not used?
	 * @param {object=} ligth (optinal) light options
	 * @return {object} uniforms for THREE.Mesh - properties are in format of name: {value}
	 * @member gluniform.init
	 * @function
	 */
	static init(visual, obj3, light) {
		var uniforms = new Object();// make sure uniforms are not shared between materials

		// common section
		let u_tex = GlUniform.uTex(visual.paras);
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
		if (visual.paras && visual.paras.color) {
			uniforms.u_color = {value: new THREE.Vector4(...visual.paras.color)};
		}

		uniforms.side = {value: !visual.paras || visual.paras.side === undefined
								? THREE.FrontSide : visual.paras.side};
		uniforms.u_alpha = {value: GlUniform.uAlpha()};

		// setup a default texture, a grey pixel to avoid this error:
		// ERROR :GL_INVALID_OPERATION : glDrawElements: Source and destination textures of the draw are the same.
		// Cause: It is not sufficient to bind the texture to a texture unit,
		// the index of the texture unit has to be set to the texture sampler uniform, too.
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

		// switch of shader types
		if (visual.paras && visual.paras.uniforms)
			Object.assign(uniforms, GlUniform.obj2uniforms(visual.paras.uniforms));

		if (visual.shader === ShaderFlag.colorArray) {
			phongMorph2.initUniform(uniforms, light, visual.paras);

			if (visual.paras && visual.paras.colors) {
				// TODO should we use uniform array ?
				for (var i = 0; i < visual.paras.colors.length; i++)
					uniforms[`u_colors${i}`] = {value: new THREE.Vector4(...visual.paras.colors[i])};
			}
		}
		else if (visual.shader === ShaderFlag.scaleOrb) {
			uniforms.wpos = {value: visual.paras.wpos ?
							new THREE.Vector3(...p) : new THREE.Vector3(0, 0, 0)};
			uniforms.r = {value: visual.paras.orbR === undefined
								 ? 20 : visual.paras.orbR};
			uniforms.whiteAlpha = {value: visual.paras.whiteAlpha === undefined
						? 0 : visual.paras.whiteAlpha};
			var os = visual.paras.orbScale;
			uniforms.orbScale = {value: os === undefined
						? new THREE.Vector3(1, 0.2, 0.2)
						: new THREE.Vector3(os[0], os[1], os[2])};
		}
		else if (visual.shader === ShaderFlag.orbGroups) {
			// orbs in a group (always have 1 orb)
			var offsets = visual.paras.offsets || [0];
			var orbs = visual.paras.offsets ? visual.paras.offsets.length : 1;
			var rs = [];
			for (var r of visual.paras.orbR || [10]) {
				rs.push(r);
			}
			var orbColors = [];
			for (var c of visual.paras.colors) {
				orbColors.push(new THREE.Vector3(...c));
			}
			uniforms.orbs = { value: orbs };
			uniforms.offsets = { value: offsets };
			uniforms.orbColors = { value: orbColors };
			uniforms.r = { value: rs };

			// groups
			if ( ! Array.isArray(visual.paras.follows)
				|| visual.paras.follows.length <= 0) {
				console.error(visual);
				throw new XError('Paras.follows for orbGroups\'s groups are not correct!');
			}

			uniforms.u_t = { value: 0 };
			uniforms.tmin = { value: visual.paras.t_range ? visual.paras.t_range[0] : 0 };
			uniforms.tmax = { value: visual.paras.t_range ? visual.paras.t_range[1] : 1 };

			var wpos = [];
			var wtan = [];
			var flws = [];
			for (var follow of visual.paras.follows) {
				wpos.push(new THREE.Vector3(0));
				wtan.push(new THREE.Vector3(1, 0, 0));
				flws.push(follow);
			}
			uniforms.wpos = { value: wpos };
			uniforms.wtan = { value: wtan };
			uniforms.follows = { value: flws };

			uniforms.whiteAlpha = { value: visual.paras.whiteAlpha === undefined
						? 0 : visual.paras.whiteAlpha };
			var os = visual.paras.orbScale;
			uniforms.orbScale = { value: os === undefined
						? new THREE.Vector3(1, 0.2, 0.2)
						: new THREE.Vector3(os[0], os[1], os[2]) };
		}
		else if (visual.shader === ShaderFlag.worldOrbs
				|| visual.shader === ShaderFlag.tiledOrbs) {
			var poses = [];
			var orbs = 0;
			if (visual.paras.offsets === undefined)
				visual.paras.offsets = [[0, 0, 0]];
			for (var p of visual.paras.offsets) {
				poses.push(new THREE.Vector3(...p));
				orbs++;
			}
			var rs = [];
			var orbRs = typeof visual.paras.orbR === 'number'
						? [visual.paras.orbR] : visual.paras.orbR || [10];
			for (var r of orbRs) {
				rs.push(r);
			}
			var orbColors = [];
			for (var c of visual.paras.colors) {
				orbColors.push(new THREE.Vector3(...c));
			}
			var wpos = visual.paras.wpos
				? new THREE.Vector3(...visual.paras.wpos) : new THREE.Vector3(0, 0, 0);

			uniforms.orbs = { value: orbs };
			uniforms.wpos = { value: wpos };
			uniforms.offsets = { value: poses };
			uniforms.orbColors = { value: orbColors };
			uniforms.r = { value: rs };
			uniforms.whiteAlpha = { value: visual.paras.whiteAlpha === undefined
						? 0 : visual.paras.whiteAlpha };
			var os = visual.paras.orbScale;
			uniforms.orbScale = { value: os === undefined
						? new THREE.Vector3(1, 0.2, 0.2)
						: new THREE.Vector3(os[0], os[1], os[2]) };
			if (visual.shader === ShaderFlag.tiledOrbs) {
				uniforms.now = { value: 0 };
				var groups = visual.paras.geostyle.groups || 1;
				uniforms.speedVert = { value: new Array(groups).fill(0.01) };
				uniforms.speedFrag = { value: new Array(groups).fill(0.01) };

				var colrs = new Array();
				var pcolrs = visual.paras.thermalColors || [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
				for (var c of pcolrs)
					colrs.push(new THREE.Vector3(...c));
				uniforms.thermalColors = { value: colrs };
				uniforms.maxHeight = { value: visual.paras.geostyle.maxHeight
							|| visual.paras.geostyle.height || 1 };
			}
		}
		else if (visual.shader === ShaderFlag.texPrism
				|| visual.shader === ShaderFlag.boxLayers) {

			if (visual.shader === ShaderFlag.texPrism)
				texPrism.initUniform(uniforms, light, visual.paras);
			else
				xyzLayer2.initUniform(uniforms, light, visual.paras);

			// xz, xy, yz layers center
			uniforms.wpos = { value: visual.paras.wpos ?
				new THREE.Vector3(...visual.paras.wpos) : new THREE.Vector3(0, 0, 0) };

			// xz, xy, yz layers offset
			var offsetxyz = [0, 0, 0];
			if (visual.paras.yztile)
				offsetxyz[0] += visual.paras.yztile.x0 || 0;
			if (visual.paras.xztile)
				offsetxyz[1] += visual.paras.xztile.y0 || 0;
			if (visual.paras.xytile)
				offsetxyz[2] += visual.paras.xytile.z0 || 0;
			uniforms.u_offsetxyz = {value: new THREE.Vector3(...offsetxyz)};

			uniforms.now = { value: 0 };
			var groups = visual.paras.geostyle ? visual.paras.geostyle.groups || 1 : 1;
			uniforms.speedVert = { value: new Array(groups).fill(0.001) };
			uniforms.speedFrag = { value: new Array(groups).fill(0.001) };

			if (visual.paras.u_tex) {
				uniforms.u_tex = { value: AssetKeepr.loadTexure(visual.paras.u_tex[0]) };
				uniforms.u_basetex = { value: AssetKeepr.loadTexure(visual.paras.u_tex[1]) };
			}

			if (visual.paras.tile && visual.paras.tile.hue) {
				uniforms.u_hue = { value: new THREE.Vector4(...visual.paras.tile.hue) };
			}
			else
				uniforms.u_hue = { value: new THREE.Vector4(0.4, 0.2, 0.8, 1.0) };

			uniforms.u_north = { value: visual.paras.north || 0 };
		}
		else if (visual.shader === ShaderFlag.reflectex
			|| visual.vtype === AssetType.reflectex) {
				reflectex.initUniform(uniforms, light, visual.paras);
		}


		if (visual && (visual.shader & ShaderFlag.lightened) === ShaderFlag.lightened )
			obj3.lightened = true;

		return uniforms;

	}

	static loadTexAsynch(uniforms, ntex, url) {
		AssetKeepr.loadTexure(url,
			function() {
				var _uniforms = uniforms;
				var _ntex = ntex;
				return (texture) => {
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
		return vparas !== undefined && vparas.tex_alpha !== undefined
				 ? vparas.tex_alpha : 1;
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
 							value: new THREE.Vector4(...vparas.colors[i])
 						};
 				}
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
 				shader === ShaderFlag.boxLayers) {
 				if (shader === ShaderFlag.texPrism)
 					texPrism.updateUniform(uniforms, light, vparas);
 				else
 					xyzLayer2.updateUniform(uniforms, light, vparas);

 				if (Array.isArray(vparas.wpos) && vparas.wpos.length > 0) {
 					uniforms.wpos = new THREE.Vector3(...vparas.wpos);
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
 					uniforms.u_hue.value = new THREE.Vector4(...vparas.tile.hue);
 				}
 				if (vparas.north !== undefined) {
 					uniforms.u_north.value = vparas.north
 				}
 			}
			else if (shader === ShaderFlag.reflectex
				|| vtype === AssetType.reflectex) {
					reflectex.updateUniform(uniforms, light, vparas);
			}
 		}
 	}

	/**
	 * Convert object into THREE.Mesh.uniforms format (properties are {value} object).<br>
	 * x-visual v.s. Three.js material variable name mapping:<pre>
		three.js -&gt; x-visual shader
		opacity - u_alpha
	 </pre>
	 * @param {object} properties
	 * @param {THREE.Uniforms} uniforms
	 * @return {object} uniforms for THREE.Mesh - properties are in format of name: {value}
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

	/**Get a default RAM Texture */
	static tex0() {
		if (!_u_tex_)
			_u_tex_ = xutils.ramTexture(3, 2, {alpha: 0.5});
		return _u_tex_;
	}
}

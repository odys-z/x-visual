import * as ECS from '../../packages/ecs-js/index';
import {Color} from '../../packages/three/three.module-r120';

import {AssetType} from '../component/visual'
import {Obj3Type} from '../component/obj3'
import {XError, ramTexture, cssColor} from '../xutils/xcommon';
import GlUniform from '../xutils/gluniform';
import Thrender from './thrender'

const anyObj3 = {any: ['Obj3']};
/**
 * System for managing object's materials, affected by xlight. A system that
 * managing object's material, plus environment effect, not material itself.
 * @class XMaterials
 */
export default class XMaterials extends ECS.System {
	/**
	 * @constructor XMaterials
	 */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
		this.camera = x.xcam.XCamera.cam;
		// this.xview = x.xview;

		this.buff = {};
		this.dirty = false;
		this.light = x.light;
	}

	/**Dispatch x.light parameters to lightened objects (Obj3.lightened == true).
	 * @param {int} tick
	 * @param {array<Entity>} entities
	 * @member XMaterials#update
	 * @function
	 */
	update(tick, entities) {
		if (this.dirty) {
			this.dirty = false;

			for (var e of entities) {
				if (e.Obj3.lightened && e.Obj3.mesh
					&& e.Obj3.mesh.material && e.Visual) {
					GlUniform.update(e.Obj3.mesh.material.uniforms,
									this.light, this.buff, e.Visual.shader);
					e.Obj3.mesh.material.uniformsNeedsUpdate = true;
				}
			}
		}
	}

	/**<p id='change-light'>Set scene light parameters.</p>
	 * @param {object} p light parameters
	 * @param {array} p.ambient: ambient color - TODO better way handling css/number/array color<br>
	 * @param {array} p.diffuse: diffuse color<br>
	 * @param {array} p.position: change light position<br>
	 * @param {array} p.intensity: light intensity<br>
	 * @param {array} p.specular: specular color - will change all object's specular color<br>
	 * @return {XMaterials} this
	 * @member XMaterials#changeLight
	 * @function
	 */
	changeLight(p) {
		if (p) {
			var hemisphere = this.light.hemisphere || {};
			// light
			if (p.ambient) {
				this.light.ambient = cssColor(p.ambient);
				hemisphere.groundColor = new Color(eval(p.ambient));
				this.light.dirty = true;
			}
			if (p.diffuse) {
				this.light.diffuse = cssColor(p.diffuse);
				hemisphere.color = new Color(eval(p.diffuse));
				this.light.dirty = true;
			}
			var pos = eval(p.position);
			if (typeof pos === 'array') {
				this.light.position = pos;
				hemisphere.position = pos;
				this.light.dirty = true;
			}
			var intensity = eval(p.intensity);
			if (typeof intensity === 'number') {
				this.light.intensity = intensity;
				hemisphere.intensity = intensity;
				this.light.dirty = true;
			}

			// object
			// TODO move
			if (p.specular) {
				this.buff.specular = cssColor(p.specular);
			}
			var shininess = eval(p.shininess);
			if (typeof shininess === 'number') {
				this.buff.shininess = shininess;
			}

			this.dirty = true;
		}
		return this;
	}

	/**<p>Update mesh material uniforms</p>
	 * @param {Entity} e entity's material to be changed. e must has an Obj3.
	 * @param {object} vparas paras in the same structure of Visual.paras
	 * @return {XMaterials} this
	 * @member XMaterials#change
	 * @function
	 */
	change(e, vparas) {
		if(e && vparas) {
			let mesh = e.Obj3.mesh;
			if( mesh && mesh.material ) {
				let mat = mesh.material;
				GlUniform.update(mat.uniforms, {}, vparas,
								 e.Visual ? e.Visual.shader : undefined);
				mat.uniformsNeedsUpdate = true;
			}
		}
		return this;
	}
}

XMaterials.query = anyObj3;

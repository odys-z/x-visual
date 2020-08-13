import * as ECS from '../../packages/ecs-js/index';
import {Color} from 'three'

import {AssetType} from '../component/visual'
import {Obj3Type} from '../component/obj3'
import {XError, ramTexture, cssColor} from '../xutils/xcommon';
import GlUniform from '../xutils/gluniform';
import Thrender from './thrender'

const anyObj3 = {any: ['Obj3']};
/**
 * Push light parameters into any objects affected by xscene.light.
 * @class Lighting
 */
export default class Lighting extends ECS.System {
	/**
	 * @constructor Lighting
	 */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
		this.camera = x.xcam.XCamera.cam;
		// this.xview = x.xview;

		this.buff = {dirty: false};
		this.light = x.light;
	}

	/**Dispatch x.light parameters to lightened objects (Obj3.lightened == true).
	 * @param {int} tick
	 * @param {array<Entity>} entities
	 * @member Lighting#update
	 * @function
	 */
	update(tick, entities) {
		if (this.buff.dirty) {
			this.buff.dirty = false;

			for (var e of entities) {
				// if (e.Obj3.lightened && e.Obj3.mesh
				// 	&& e.Obj3.mesh.material && e.Obj3.mesh.material.uniforms) {
				// 	uniPhongs(this.light, e.Obj3.mesh.material.uniforms, this.buff);
				// 	e.Obj3.mesh.material.uniformsNeedsUpdate = true;
				// }

				if (e.Obj3.lightened && e.Obj3.mesh
					&& e.Obj3.mesh.material) {
					// glUniform usage
					GlUniform.update(e.Obj3.mesh.material.uniforms,
									this.light, this.buff);
					// e.Obj3.mesh.material.uniformsNeedsUpdate = true;
				}
			}
		}
	}

	/**Set scene light parameters.
	 * @param {object} p
	 * p.ambient: ambient color<br>
	 * p.diffuse: diffuse color<br>
	 * p.position: change light position<br>
	 * p.intensity: light intensity<br>
	 * p.specular: specular color - will change all object's specular color<br>
	 * @member Lighting#set
	 * @function
	 */
	set(p) {
		if (p) {
			var hemisphere = this.light.hemisphere || {};
			if (p.ambient) {
				// this.buff.ambient = cssColor(p.ambient);
				this.light.ambient = cssColor(p.ambient);
				hemisphere.groundColor = new Color(eval(p.ambient));
				this.buff.dirty = true;
			}
			if (p.diffuse) {
				// this.buff.diffuse = cssColor(p.diffuse);
				this.light.diffuse = cssColor(p.diffuse);
				hemisphere.color = new Color(eval(p.diffuse));
				this.buff.dirty = true;
			}

			if (p.specular) {
				this.buff.specular = cssColor(p.specular);
				// hemisphere.specular = new Color(eval(p.specular));
				this.buff.dirty = true;
			}
			var shininess = eval(p.shininess);
			if (typeof shininess === 'number') {
				this.buff.shininess = shininess;
				this.buff.dirty = true;
			}
			var pos = eval(p.position);
			if (typeof pos === 'array') {
				this.buff.pos = pos;
				this.light.pos = pos;
				hemisphere.position = pos;
				this.buff.dirty = true;
			}
			var intensity = eval(p.intensity);
			if (typeof intensity === 'number') {
				this.buff.intensity = intensity;
				this.light.intensity = intensity;
				hemisphere.intensity = intensity;
				this.buff.dirty = true;
			}
		}
	}
}

Lighting.query = anyObj3;

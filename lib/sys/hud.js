import * as ECS from '../../packages/ecs-js/index';
import * as THREE from '../../packages/three/three.module-MRTSupport';
import {XError, ramTexture} from '../xutils/xcommon';
import {AssetType} from '../component/visual'
import {Obj3Type} from '../component/obj3'
import Thrender from './thrender'

const anyHud = ['HudGroup', 'HudChild'];
/**
 * Displaying HUD {@link Layers}.
 * @class Hud
 */
export default class Hud extends ECS.System {

	/**
	 * @constructor Hud
	 */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
		this.camera = x.xcam.XCamera.cam;
		this.xview = x.xview;

		var hudgrps = ecs.queryEntities({any: anyHud});

		if (!x.renderer && !x.test) {
			throw new XError("Hud.constructor: internal", 0);
		}
		this.renderer = x.renderer;

		for (const hud of hudgrps) {
			if (hud.HudGroup) {
				var scene = new THREE.Scene();
				scene.layers.enableAll();
				var light = Thrender.createLight(hud.HudGroup.light);
				scene.add(light);

				// if (!this.huds)
				// 	this.huds = [];
				// this.huds.push(scene);
				var camopt = Object.assign( {fov: 30, ratio: 2.0, near: 1, far: 5000},
											hud.frustum );
				if (hud.HudGroup.camera) {
					Object.assign(camopt, hud.HudGroup.camera);
				}
				hud.camera = new THREE.PerspectiveCamera(
								camopt.fov, camopt.ratio,
								camopt.near, camopt.far );
				hud.camera.position.z = 200;

				hud.Obj3.geom = Obj3Type.PLANE;
				hud.Visual.vtype = AssetType.mesh;

				let hudEnts = ecs.queryEntities({any: ['HudGroup', 'HudChild']});
				Thrender.createObj3s(ecs, scene, x.light, [hud], hudEnts);
				hud.scene = scene;
			}
			if (hud.HudChild) {
				const g = ecs.getEntity(hud.HudChild.hud);

				let hudEnts = ecs.queryEntities({any: ['HudGroup', 'HudChild']});
				Thrender.createObj3s(ecs, g.scene, x.light, [hud], hudEnts);

				// sometimes like gltf loading, the mesh won't be ready
				if (hud.Obj3.mesh)
					g.Obj3.mesh.add(hud.Obj3.mesh);
			}
		}
	}

	// deprecated
	static addMesh(e, uniforms) {
		var alp = e.Visual.paras !== undefined
				&& e.Visual.paras.tex_alpha !== undefined ?
				e.Visual.paras.tex_alpha : 1;

		var tex, mat;
		if (e.Visual.asset)
			tex = new THREE.TextureLoader().load( `assets/${e.Visual.asset}` );
		else // test and default
			tex = new ramTexture(3, 4, {alpha: alp});

		var def = { map: tex,
					opacity: alp,
					transparent: true,
					side: THREE.DoubleSide,
					depthWrite: false,
					depthTest: true
				};// - for transparent

		if (e.Visual.paras && e.Visual.paras.color)
			Object.assign (def, {color: e.Visual.paras.color});

		mat = e.Visual.material || new THREE.MeshPhongMaterial(def);
		Object.assign(mat, uniforms);

		var m = Thrender.createObj3mesh(e.Obj3, e.Obj3.geom, mat);
		return m;
	}

	/**
	 * @param {int} tick
	 * @param {array<Entity>} entities
	 * @member Hud#update
	 * @function
	 */
	update(tick, entities) {
		if (this.renderer) {
			this.renderer.autoClear = false;
			for (const hud of entities) {
				this.renderer.render(hud.scene, hud.camera);
			}
			this.renderer.autoClear = true;
		}
		// else testing?
	}
}

Hud.query = {any: ['HudGroup']};

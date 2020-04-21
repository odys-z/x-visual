import * as ECS from '../../packages/ecs-js/index';
import * as THREE from 'three';
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


		if (!x.renderer)
			throw new XError("internal", 0);
		this.renderer = x.renderer;

		for (const hud of hudgrps) {
			if (hud.HudGroup) {
				var scene = new THREE.Scene();
				scene.layers.enableAll();
				var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1.2 );
				light.layers.enableAll();
				scene.add(light);

				// if (!this.huds)
				// 	this.huds = [];
				// this.huds.push(scene);
				var camopt = Object.assign( {fov: 30, ratio: 2.0, near: 1, far: 5000},
											hud.frustum );
				if (hud.camera) {
					Object.assign(camopt, hud.camera);
				}
				hud.camera = new THREE.PerspectiveCamera(
								camopt.fov, camopt.ratio,
								camopt.near, camopt.far );
				hud.camera.position.z = 200;

				hud.Obj3.geom = Obj3Type.PLANE;
				hud.Visual.vtype = AssetType.mesh;
				var uniforms = Object.assign({}, hud.Obj3.uniforms);
					uniforms = Object.assign(uniforms, hud.Visual.uniforms);
				var m = Hud.addMesh(hud, uniforms);
				m.material.dipthTest = true;
				scene.add(m);
				hud.scene = scene;
			}
			if (hud.HudChild) {
				const g = ecs.getEntity(hud.HudChild.hud);

				var uniforms = Object.assign({}, hud.Obj3.uniforms);
					uniforms = Object.assign(uniforms, hud.Visual.uniforms);
				var m = Hud.addMesh(hud, uniforms);
				m.material.dipthTest = true;

				g.Obj3.mesh.add(hud.Obj3.mesh);
			}
		}
	}

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
					depthWrite: true,
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
		this.renderer.autoClear = false;
		for (const hud of entities) {
			this.renderer.render(hud.scene, hud.camera);
		}
		this.renderer.autoClear = true;
	}
}

Hud.query = {any: ['HudGroup']};

/** Reference
https://jsfiddle.net/mmalex/sqg0d8vx/

var scene1 = new THREE.Scene();
var scene2 = new THREE.Scene();

var width = 900;
var height = 900;
var camera1 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0.5, 0.5, 0.95), 1);
document.body.appendChild(renderer.domElement);

//add objects to scene1
var geometry = new THREE.BoxGeometry(1, 0.1, 0.1);
var material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});
var cube1 = new THREE.Mesh(geometry, material);
scene1.add(cube1);

//add objects to scene2
var geometry = new THREE.BoxGeometry(0.15, 0.15, 1.5);
var material = new THREE.MeshBasicMaterial({
  color: 0xff0000,
	transparent: true,
	opacity: 0.75
});
var cube2 = new THREE.Mesh(geometry, material);
scene2.add(cube2);
//scene2.add(camera2);

camera1.position.z = 2;
camera2.position.z = 2;

var animate = function() {
    requestAnimationFrame(animate);
	  camera1.rotation.x += 0.01;

    renderer.render(scene1, camera1);

	//don't let renderer eraase canvas
	renderer.autoClear = false;

    renderer.render(scene2, camera2);
	//let renderer clean next time
	renderer.autoClear = true;
};

animate();
*/

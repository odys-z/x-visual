import * as ECS from '../../packages/ecs-js/index';
import * as THREE from 'three';

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
	}

	/**
	 * @param {int} tick
	 * @param {array<Entity>} entities
	 * @member Hud#update
	 * @function
	 */
	update(tick, entities) {
		if (this.xview.flag > 0)
			for (const hud of entities) {
				if (hud.HudGroup) {
					var m = hud.Obj3.mesh;
					m.position.copy(this.camera.position);
					m.position.z -= 100;
					m.quaternion.copy(this.camera.quaternion);
					m.updateMatrix();
				}
			}
	}
}

Hud.query = {any: ['HudGroup', 'HudWedget']};

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

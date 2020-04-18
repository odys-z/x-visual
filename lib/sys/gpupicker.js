import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index';
import {x} from '../xapp/xworld';
import {ramTexture} from '../xutils/xcommon';

const iffall = ['Obj3', 'GpuPickable'];

/**Uuid for picking object's id
 * @class pickuuid */
const pickuuid = {
	uuid: 1,
	/**
	 * Get an increase pickable's uuid.
	 * @property inc
	 */
	inc: function () {
		return pickuuid.uuid++;
	},
}

/**Helper for picking scene object.
 * For example, see <a href='https://threejsfundamentals.org/threejs/lessons/threejs-picking.html'>
 * Three.js Tutorial</a>
 * Can only work with Obj3.mesh.
 * @class GpuPicker
 */
export default class GpuPicker extends ECS.System {
	/** If any entity has a GpuPickable component, add it to my picking scene.
	 * @constructor GpuPicker
	 */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
		// create a 1x1 pixel render target
		this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
		this.pixelBuffer = new Uint8Array(4);
		this.pickedObject = undefined;
		this.pickedObjectSavedColor = 0;

		this.scene = new THREE.Scene();
		// this.scene = x.scene;
		this.scene.background = new THREE.Color(0);

		this.camera = x.xcam.XCamera.cam;
		this.renderer = x.renderer;
		if (this.renderer === undefined) {
			if (x.log >= 5)
				console.warn("[log 5] GpuPicker: Can't find a THREE.renderer. Testing?");
		}

		this.initMyPickings(x.ecs, this.scene);
	}

	/** If any entity has a GpuPickable component, add it to my picking scene.
	 * @param {ECS.ECS} ecs
	 * @param {ECS.Scene} scene
	 * @member GpuPicker#initMyPickings
	 * @function
	 */
	initMyPickings(ecs, scene) {
		// var scn = scene; // picking scene
		this.idToObject = {0: undefined};

		// create meshes
		var pickables = ecs.queryEntities({iffall});
		if (pickables) {
			var ids = this.idToObject;
			pickables.forEach( function(p, ix) {
				if (!p.Obj3 || !p.Obj3.mesh || !p.Obj3.mesh.geometry)
					return; // such as THREE.ArrowHelper

				const pickable = p.GpuPickable;
				pickable.pickid = pickuuid.inc();

				var tex;
				if (p.Visual && p.Visual.asset || pickable.tex)
					tex = new THREE.TextureLoader().load(
						`assets/${p.Visual && p.Visual.asset ?
						p.Visual.asset : pickable.tex}`);
				// else tex = new ramTexture(1, 1, 1);
				else
					tex = new THREE.TextureLoader().load(
						// 1x1 grey png
						'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AQSDjsH5tmdcQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAMSURBVAjXY2hoaAAAAwQBgZrwzU8AAAAASUVORK5CYII='
					);

				// TODO: simplify
				pickable.material = new THREE.MeshPhongMaterial({
					emissive: new THREE.Color(pickable.pickid),
					color: new THREE.Color(0, 0, 0),
					specular: new THREE.Color(0, 0, 0),
					// map: p.Obj3.mesh.map,
					// map: new THREE.TextureLoader().load('assets/tex/gpupick-debug.png'),
					// map: new THREE.TextureLoader().load('assets/tex/ruler256.png'),
					map: tex,
					transparent: true,
					side: THREE.DoubleSide,
					alphaTest: 0.5,
					blending: THREE.NoBlending,
				});

				pickable.mesh = new THREE.Mesh(p.Obj3.mesh.geometry.clone(),
								pickable.material);
				pickable.mesh.matrix = p.Obj3.mesh.matrix;
				pickable.mesh.matrixWorld = p.Obj3.mesh.matrixWorld;
				pickable.mesh.matrixAutoUpdate = false;

				scene.add(pickable.mesh);
				ids[pickable.pickid] = p;
			});
		}
	}

	/** If mouse moved, try pick the object
	 * @param {number} tick
	 * @param {array<Entity>} entities
	 * @member GpuPicker#update
	 * @function
	 */
	update(tick, entities) {
		var flag = false;

		if (x.xview.flag === 0 || entities.size === 0)
			return;

		// find mouse position (in xview.cmds)
		var clientxy;
		var v = x.xview;
		if (v.cmds) {
			for (var cx = v.cmds.length - 1; cx >= 0; cx--) {
				var c = v.cmds[cx];
				if (c && c.code === 'mouse' && c.e.type === 'mousemove') {
					clientxy = c.client;
					break;
				}
			}
		}

		if (clientxy) {
			var e = this.pickTest(clientxy, this.camera);
			if (e && e.GpuPickable) {
				e.GpuPickable.picktick = tick;
				e.GpuPickable.picked = true;
				// this.pickedEnt = e;
				x.xview.picked = e;
			}
			// else if(this.pickedEnt)
			// 	this.pickedEnt.GpuPickable.picked = false;
			else if (x.xview.picked) {
				x.xview.picked.GpuPickable.picked = false;
				x.xview.picked = undefined;
			}
		}
	}

	/**Picking test, check is the randered object?
	 * @param {object} canvPos canvas position, in pixel
	 * @param {THREE.Camera} camera
	 * @member GpuPicker#pickTest
	 * @function
	 */
	pickTest(canvPos, camera) {
		const {scene, pickingTexture, pixelBuffer} = this;

		// reset picked
		if (this.pickedObject) {
			this.pickedObject.GpuPickable.picked = false;
			this.pickedObject = undefined;
			this.pickedId = undefined;
		}

		// set the view offset to represent just a single pixel under the mouse
		var renderer = this.renderer;
        var ctx = renderer.getContext();
		const pixelRatio = renderer.getPixelRatio();
		const aspRatio = camera.aspect;
		camera.setViewOffset(
			ctx.drawingBufferWidth,         // full width
			ctx.drawingBufferHeight,        // full top
			canvPos[0] * pixelRatio | 0,    // rect x
			canvPos[1] * pixelRatio | 0,    // rect y
			1, 1                            // w, h
		);
		// render the scene
		renderer.setRenderTarget(pickingTexture);
		renderer.render(scene, camera);
		renderer.setRenderTarget(null);

		// clear the view offset so rendering returns to normal
		camera.clearViewOffset();
		camera.aspect = aspRatio;

		//read the pixel
		renderer.readRenderTargetPixels(
					pickingTexture,
					0, 0, 1, 1,   // x y width height
					pixelBuffer);
		const id =  (pixelBuffer[0] << 16) |
					(pixelBuffer[1] <<  8) |
					(pixelBuffer[2]      );

		if (x.log >= 6) console.log(`[6] pickid ${id}`);
		this.pickedId = id;

		const intersectedObject = this.idToObject[id];
		if (intersectedObject) {
			// pick the first object. It's the closest one
			this.pickedObject = intersectedObject;
		}

		return this.idToObject[id];
	}
}

GpuPicker.query = {iffall};

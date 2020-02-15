/** @module xv.ecs.sys */

import * as THREE from 'three';
import * as ECS from '../../packages/ecs-js/index';
import {x} from '../xapp/xworld';

const qCmd = ['CmdFlag', 'UserCmd'];

// const idToObject = {};
// var _pickr;

/**Helper for picking scene object.
 * For example, see <a href='https://threejsfundamentals.org/threejs/lessons/threejs-picking.html'>
 * Three.js Tutorial</a>
 * Can only work with Obj3.mesh.
 */
export default class GpuPicker extends ECS.System {
	/** If any entity has a GpuPickable component, add it to my picking scene.
	 */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;
		// create a 1x1 pixel render target
		this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
		this.pixelBuffer = new Uint8Array(4);
		this.pickedObject = null;
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

	initMyPickings(ecs, scene) {
		// var scn = scene; // picking scene
		this.idToObject = {0: undefined};

		// create meshes
		var pickables = ecs.queryEntities({iffall: ['Obj3', 'GpuPickable']});
		if (pickables) {
			var ids = this.idToObject;
			pickables.forEach( function(p, ix) {
				const pickable = p.GpuPickable;
				// TODO: simplify
				pickable.material = new THREE.MeshPhongMaterial({
					emissive: new THREE.Color(pickable.pickid),
					color: new THREE.Color(0, 0, 0),
					specular: new THREE.Color(0, 0, 0),
					// map: p.Obj3.mesh.map,
					// map: new THREE.TextureLoader().load('assets/tex/gpupick-debug.png'),
					map: new THREE.TextureLoader().load('assets/tex/ruler256.png'),
					transparent: true,
					side: THREE.DoubleSide,
					alphaTest: 0.5,
					// blending: THREE.NoBlending,
				});

				pickable.mesh = new THREE.Mesh(p.Obj3.mesh.geometry.clone(),
								pickable.material);
				scene.add(pickable.mesh);
				ids[pickable.pickid] = p;
			});
		}
	}

	update(tick, entities) {
		var flag = false;
		var clientxy;
		for (var e of entities) {
			if (e.CmdFlag.flag === 0)
				return;

			// find mouse position (in UserCmd)
			if (e.UserCmd && e.UserCmd.cmds) {
				for (var cx = e.UserCmd.cmds.length - 1; cx >= 0; cx--) {
					var c = e.UserCmd.cmds[cx];
					if (c && c.code === 'mouse' && c.e.type === 'mousemove') {
				// 		console.log(c.e.name, c.e);
						clientxy = c.client;
						break;
					}
				}
			}

			// move pickable modules
			if (e.GpuPickable) {
				var m3 = e.Obj3.mesh;
				var picking = e.GpuPickabl.mesh;
				// set tick = 0, this pickable won't been tested anymore
				// Note: this means there can has only 1 picking system
				picking.picktick = 0;
				picking.matrix.copy(m3.matrix);
				picking.matrixWorld.copy(m3.matrixWorld);
				picking.matrixAutoUpdate = false;
				// picking.position.copy(m3.pos);
				// picking.rotation.copy(m3.rot);
				// picking.scale.copy(m3.scl);

				// e.GpuPickable.mesh.geometry.verticesNeedUpdate = true;
				// e.GpuPickable.mesh.geometry.elementsNeedUpdate = true;
				// e.GpuPickable.mesh.geometry.uvsNeedUpdate = true;
				// e.GpuPickable.mesh.geometry.colorsNeedUpdate = true;
				// e.GpuPickable.mat0 = e.GpuPickable.mesh.map;
				// e.GpuPickable.mesh.map = e.GpuPickable.material;
			}
		}

		if (clientxy) {
			var e = this.pickTest(clientxy, this.camera);
			if (e && e.GpuPickable)
				e.GpuPickable.picktick = tick;
		}
	}

	pickTest(canvPos, camera) {
		const {scene, pickingTexture, pixelBuffer} = this;

		// reset picked
		if (this.pickedObject) {
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

			// e.GpuPickable.mesh.geometry.verticesNeedUpdate = true;
			// e.GpuPickable.mesh.geometry.elementsNeedUpdate = true;
			// e.GpuPickable.mesh.geometry.uvsNeedUpdate = true;
			// e.GpuPickable.mesh.geometry.colorsNeedUpdate = true;
			// e.GpuPickable.mesh.map = e.GpuPickable.mat0;

		//read the pixel
		renderer.readRenderTargetPixels(
					pickingTexture,
					0, 0, 1, 1,   // x y width height
					pixelBuffer);
		if (x.log >= 6) console.log("[6]", pixelBuffer);
		const id =  (pixelBuffer[0] << 16) |
					(pixelBuffer[1] <<  8) |
					(pixelBuffer[2]      );

		this.pickedId = id;

		const intersectedObject = this.idToObject[id];
		if (intersectedObject) {
			// pick the first object. It's the closest one
			this.pickedObject = this.intersectedObject;
		}

		return this.idToObject[id];
	}
}

GpuPicker.query = {iffall: qCmd};

/*
function initPicker(tag, opts) {
  const canvas = document.querySelector('#' + tag);
  const renderer = new THREE.WebGLRenderer({canvas});

  const fov = opts.fov ? opts.fov : 60;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = opts.far ? opts.far : 200;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 30;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('white');
  const pickingScene = new THREE.Scene();
  pickingScene.background = new THREE.Color(0);

  // put the camera on a pole (parent it to an object)
  // so we can spin the pole to move the camera around the scene
  const cameraPole = new THREE.Object3D();
  scene.add(cameraPole);
  cameraPole.add(camera);

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    camera.add(light);
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  function rand(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + (max - min) * Math.random();
  }

  function randomColor() {
    return `hsl(${rand(360) | 0}, ${rand(50, 100) | 0}%, 50%)`;
  }

  const loader = new THREE.TextureLoader();
  const texture = loader.load('https://threejsfundamentals.org/threejs/resources/images/frame.png');

  const idToObject = {};
  const numObjects = 100;
  for (let i = 0; i < numObjects; ++i) {
    const id = i + 1;
    const material = new THREE.MeshPhongMaterial({
      color: randomColor(),
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    idToObject[id] = cube;

    cube.position.set(rand(-20, 20), rand(-20, 20), rand(-20, 20));
    cube.rotation.set(rand(Math.PI), rand(Math.PI), 0);
    cube.scale.set(rand(3, 6), rand(3, 6), rand(3, 6));

    const pickingMaterial = new THREE.MeshPhongMaterial({
      emissive: new THREE.Color(id),
      color: new THREE.Color(0, 0, 0),
      specular: new THREE.Color(0, 0, 0),
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
      blending: THREE.NoBlending,
    });
    const pickingCube = new THREE.Mesh(geometry, pickingMaterial);
    pickingScene.add(pickingCube);
    pickingCube.position.copy(cube.position);
    pickingCube.rotation.copy(cube.rotation);
    pickingCube.scale.copy(cube.scale);
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  class GPUPickHelper {
    constructor() {
      // create a 1x1 pixel render target
      this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
      this.pixelBuffer = new Uint8Array(4);
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(cssPosition, scene, camera, time) {
      const {pickingTexture, pixelBuffer} = this;

      // restore the color if there is a picked object
      if (this.pickedObject) {
        this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
        this.pickedObject = undefined;
      }

      // set the view offset to represent just a single pixel under the mouse
      const pixelRatio = renderer.getPixelRatio();
      camera.setViewOffset(
          renderer.context.drawingBufferWidth,   // full width
          renderer.context.drawingBufferHeight,  // full top
          cssPosition.x * pixelRatio | 0,        // rect x
          cssPosition.y * pixelRatio | 0,        // rect y
          1,                                     // rect width
          1,                                     // rect height
      );
      // render the scene
      renderer.setRenderTarget(pickingTexture);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      // clear the view offset so rendering returns to normal
      camera.clearViewOffset();
      //read the pixel
      renderer.readRenderTargetPixels(
          pickingTexture,
          0, 0, 1, 1,   // x y width height
          pixelBuffer);

      const id = (pixelBuffer[0] << 16) |
				 (pixelBuffer[1] <<  8) |
				 (pixelBuffer[2]      );

      const intersectedObject = idToObject[id];
      if (intersectedObject) {
        // pick the first object. It's the closest one
        this.pickedObject = intersectedObject;
        // save its color
        this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
        // set its emissive color to flashing red/yellow
        this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
      }
    }
  }

  const pickPosition = {x: 0, y: 0};
  const pickHelper = new GPUPickHelper();
  clearPickPosition();

  function render(time) {
    time *= 0.001;  // convert to seconds;

    if (resizeRendererToDisplaySize(renderer)) {
		const canvas = renderer.domElement;
		camera.aspect = canvas.clientWidth / canvas.clientHeight;
		camera.updateProjectionMatrix();
    }

    cameraPole.rotation.y = time * .1;

    pickHelper.pick(pickPosition, pickingScene, camera, time);

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  function setPickPosition(event) {
	pickPosition.x = event.clientX;
	pickPosition.y = event.clientY;
  }

  function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = -100000;
    pickPosition.y = -100000;
  }

  window.addEventListener('mousemove', setPickPosition);
  window.addEventListener('mouseout', clearPickPosition);
  window.addEventListener('mouseleave', clearPickPosition);

  window.addEventListener('touchstart', (event) => {
    // prevent the window from scrolling
    event.preventDefault();
    setPickPosition(event.touches[0]);
  }, {passive: false});

  window.addEventListener('touchmove', (event) => {
    setPickPosition(event.touches[0]);
  });

  window.addEventListener('touchend', clearPickPosition);
}
*/

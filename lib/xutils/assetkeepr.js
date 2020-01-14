/**
 * @module xv.xutils
 */
import * as THREE from 'three';
// For why using source instead of npm package, see packages/three/README.md
import {GLTFLoader} from '../../packages/three/GLTFLoader';
import html2canvas from '../../packages/misc/html2canvas.esm.js';

/**
 * Note it's keepr, not keeper. x-visual sometimes is deliberately misspellings
 * to avoid name confliction.
 * @class
 */
export default class AssetKeepr {
    /**load gltf module
     * see
	 * https://threejs.org/docs/#examples/en/loaders/GLTFLoader
	 * https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
	 * @param {THREE.Scene} scene
	 * @param {stirng} url A string containing the path/URL of the .gltf or .glb file.
	 * see <a href='https://threejs.org/docs/index.html#examples/en/loaders/GLTFLoader'>
	 * THREE.GltfLoader</a>
	 */
	static loadGltf(scene, url) {
		if (this.gltfLoader === undefined)
			this.gltfLoader = new GLTFLoader();
		this.gltfLoader.load(url, function(gltf) {
			if (scene) {
				scene.add( gltf.scene );
			}
			else console.warn(
				'AssertKeepr.loadGltf(): Loaded gltf assets without scene instance: ',
				gltf.scene);
		},
		function ( xhr ) {
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		// called when loading has errors
		function ( error ) {
			console.error( 'AssertKeepr.loadGltf(): ', error );
		});
	}

	/**
	 * Initialize a Canvas component with a THREE.CanvasTexture from canvas, which
	 * is not initialized when return. The component will be updated when ready
	 * @param {Canvas} canvas Canvas component
	 * @return {Canvas} the Canvas component referencing object:
	 * tex: THREE.CanvasTexture when html canvas is initialized. But before this is undefined.
	 * canvas: HTML canvas when html canvas is initialized. But before this is undefined.
	 * ctx2d: HTML canvas 2d context when html canvas is initialized. But before this is undefined.
	 */
	static initCanvtex(cmpCanv) {
		const h5 = document.getElementById(cmpCanv.domId);
		var opts = Object.assign({width: 256, height: 256},
								 cmpCanv.options);

		html2canvas(h5, opts).then( function(canvas) {
			var drawingContext = canvas.getContext( '2d' );

			cmpCanv.canvas = drawingContext.canvas;
			cmpCanv.tex = new THREE.CanvasTexture(drawingContext.canvas);
			cmpCanv.ctx2d = drawingContext;
			cmpCanv.dirty = true;

			// document.body.appendChild(canvas);
		});
		return cmpCanv;
	}
}

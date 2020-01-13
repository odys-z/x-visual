/**
 * @module xv.xutils
 */
import * as THREE from 'three';

// For why using source instead of npm package, see packages/three/README.md
// import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {GLTFLoader} from '../../packages/three/GLTFLoader';
import * as h2canv from '../../packages/misc/html2canvas.esm.js';

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
	 * Initialize a THREE.CanvasTexture from canvas
	 * @param {string} canvas html canvas id
	 * @return {object} a function referencing object:
	 * tex: THREE.CanvasTexture when html canvas is initialized. But before this is undefined.
	 * canv: HTML canvas when html canvas is initialized. But before this is undefined.
	 * ctx2d: HTML canvas 2d context when html canvas is initialized. But before this is undefined.
	 */
	static initCanvtex(canvas) {
		const h5 = document.getElementById(canvas);

		// not thread safe
		var scope = new Object();
		// scope.canv = undefined;

		h2canv(h5).then( function(canvas) {
			scope.canv = canvas;
			var drawingContext = drawingCanvas.getContext( '2d' );
			scope.tex = new THREE.CanvasTexture(canvas);
			scope.ctx2d = drawingContext;
		});

		return function () {
			if (scope && scope.tex)
				return {tex: scope.tex, canv: scope.canv, ctx2d: scope.ctx2d};
			else return undefined;
		}
	}
}

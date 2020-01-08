/**
 * @module xv.xutils
 */
import * as THREE from 'three';

// see packages/three/README.md
// import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {GLTFLoader} from '../../packages/three/GLTFLoader';

/**
 * Note it's keepr, not keeper. x-visual sometimes is deliberately misspellings
 * to avoid name confliction.
 * @class
 */
export default class AssetKeepr {
    /**
     * see
	 * https://threejs.org/docs/#examples/en/loaders/GLTFLoader
	 * https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html
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
}

/**
 * @module xv.xutils
 */
import * as THREE from 'three';
// For why using source instead of npm package, see packages/three/README.md
import {GLTFLoader} from '../../packages/three/GLTFLoader';
import html2canvas from '../../packages/misc/html2canvas.esm.js';

const assets = {
	lastamp: -Infinity,
	canvs: {}	// {THREE.CanavsTexture}
}

/**
 * Note it's keepr, not keeper. x-visual sometimes is deliberately misspellings
 * to avoid name confliction.
 * @class
 */
export default class AssetKeepr {
	static stamp(tick) {
		assets.lastamp = tick;
	}

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
	 * @param {xv.XCompnent.Canvas} canvas Canvas component
	 * @return {xv.XCompnent.Canvas} the Canvas component referencing object:
	 * tex: THREE.CanvasTexture when html canvas is initialized. But before this is undefined.
	 * canvas: HTML canvas when html canvas is initialized. But before this is undefined.
	 * ctx2d: HTML canvas 2d context when html canvas is initialized. But before this is undefined.
	 * @param {number} stamp if stamp is less or equal to last stamp, ignore the request
	 *
	 * DESIGN-MEMO
	 * -----------
	 * 1. This function maintance dirty with tick flag. Referencing cavase won't
	 * updated if the component's stamp less than the asset's stamp
	 * 2. This should be function of AssetKeepr because texture is a shared asset.
	 *
	 * Reference
	 * ---------
	 * https://stackoverflow.com/questions/3768565/drawing-an-svg-file-on-a-html5-canvas
	 * https://jsfiddle.net/Wijmo5/h2L3gw88/
	 * https://bl.ocks.org/mbostock/1276463
	 * threejs example: https://threejs.org/examples/?q=canvas#webgl_materials_texture_canvas
	 * example source: https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_texture_canvas.html
	 * threejs doc CanvasTexture: https://threejs.org/docs/index.html#api/en/textures/CanvasTexture
	 *
	 * TODO make texture sharable
	 */
	static initCanvtex(cmpCanv, stamp) {
		if (stamp === undefined)
			stamp = assets.lastamp;
		// if stamp handled, no more update
		if (stamp < assets.lastamp)
			return cmpCanv;

		var h5 = assets.canvs[cmpCanv.domId];
		if (!h5) {
			h5 = {domId: cmpCanv.domId,
				  stamp: assets.lastamp};
			assets.canvs[cmpCanv.domId] = h5;
		}
		if (h5.stamp >= assets.stamp) {
			if (typeof document !== 'object')
				;	// testing ?
			else {
				var dom = document.getElementById(cmpCanv.domId);
				var opts = Object.assign({width: 256, height: 256},
										 cmpCanv.options);

				html2canvas(dom, opts).then( function(canvas) {
					var drawingContext = canvas.getContext( '2d' );

					cmpCanv.canvas = drawingContext.canvas;
					cmpCanv.tex = new THREE.CanvasTexture(drawingContext.canvas);
					cmpCanv.ctx2d = drawingContext;
					// set dirty flag now to avoid updating by renderer before this texture is ready
					cmpCanv.dirty = true;
				});
			}
		}
		/* backup
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
		*/
		return cmpCanv;
	}
}

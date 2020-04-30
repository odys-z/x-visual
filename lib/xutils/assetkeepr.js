import * as THREE from 'three';

// For why using source instead of npm package, see packages/three/README.md
import {GLTFLoader} from '../../packages/three/GLTFLoader'
import {SVGLoader} from '../../packages/three/SVGLoader'
import html2canvas from '../../packages/misc/html2canvas.esm.js'

import {x} from '../xapp/xworld'
import {mat4} from '../xmath/vec'

/**Static assets buffer for global resource management
 * @memberof AssetKeepr
 */
const assets = {
	loaders: {},
	/**@property {Object} canvas - {domId: Canvas} map of Canvas components.
	 * @member assets#canvs
	 * @memberof AssetKeepr
	 */
	canvs: {},	// {domId: Components.Canvas} map of Canvas components.
	/**Light weight dynamic text canvase pool.
	 * @property {Object} dynatex - {domId: Dynatex} map of Dynatex components.
	 * @member assets#dynatex
	 * @memberof AssetKeepr
	 */
	dynatex: {}
}

/**Assets Manager
 *
 * Note it's spelled "keepr", not "keeper".
 * @class AssetKeepr
 */
export default class AssetKeepr {
	/**Initialize
	 * @param {object} x singleton
	 * @member AssetKeepr.init
	 * @function */
	static init(x) {
		x.assetKeepr = this;
		x.assets = assets;
		assets.xref = x;
	}

	/**@member AssetKeepr#canvs
	 * @property {THREE.Container} canvs - get container canvas */
	static get canvs() { return assets.canvs; }

	/**@member AssetKeepr#assets
	 * @property {object} assets - get global assets map */
	static get assets() { return assets; }

	/**@member AssetKeepr#log
	 * @property {number} log - get log level */
	static get log() { return assets.log; }

	/**@member AssetKeepr#dynatex
	 * @property {number} dynatex - get dynamic canvas texture */
	static get dynatex() { return assets.dynatex; }


	/**Get a spark texture, in 'data:image/png;base64'.
	 * @return {THREE.Texture}
	 * @member AssetKeepr.defaultex
	 * @function */
	static defaultex() {
		if (!assets.sparktex) {
			debugger
			assets.sparktex = new THREE.TextureLoader().load(
				// https://onlinepngtools.com/convert-png-to-base64
				// 16x16 version of spark1.png
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AIKBwk6Rv00TgAAAaVJREFUOMvVkk9rE1EUxc99b0ycpFJqwAgNARFc6a7gNhs/UbbDhDBhCPk8LlvIJi7diFrEKS5iikrQaekkzrx3jytDUv9uXHi2l/Pj3HMv8N9LfjXo9/uo1+sGgDjndDKZMIoijEajPwPiOA5U9QBAS1Ubxpgrkp9I5mma+t8CoigKRORQVY9E5AGAGoA1gNcAnnvvFyR1PB4DAIJtc5qmKIritqo+FpEnInJfRG6q6gLAXQA3RORERHIA/AFQVZUFcCgiD40xj8IwPGq1Wna1WhXL5fJEVT+LyEvv/cV3gLkGEJL7APaCIDhot9u22+2i0+k0rLUdAPsAboVhuPHsAEQEAEoATlUvarUarLXI8xze+5WIlCLinHOb7nZWsNYqyQ8AFt770yzL9ubz+Z31en1O8i3J9wA+JkmyuYTdBkynU/Z6va8APMkGyS9lWWYkM5JvADyrqupsNpv5nyYYDAaw1hZVVb1Q1UtjzD0AIclCVc+ste+azWa17dnpYDgcwjmHJEkuAbwyxhyTfGqMOTbGnCZJcuW951/9eBzHuJ7un+gbY1HV8WP17N0AAAAASUVORK5CYII=	'
			);
		}
		return assets.sparktex;
	}

    /**load gltf module<br>
	 * If obj3 is provided, then after loaded, set the scene transform according
	 * to obj3.transfrom, set obj3.mesh = gltf.scene.<br>
     * @see {@link https://threejs.org/docs/#examples/en/loaders/GLTFLoader|Three.js example - GLTFLoader}
	 * @see {@link https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html|Three.js tuturial}
	 * @param {THREE.Scene} [scene] if provided, add the loaded gltf.scene to it.
	 * @param {Obj3} [obj3] [in out] after loaded, set the scene transform according
	 * to obj3.transfrom, set obj3.mesh = gltf.scene
	 * @param {stirng} url A string containing the path/URL of the .gltf or .glb file.
	 * @param {function} onload callback on assets loaded
	 * see <a href='https://threejs.org/docs/index.html#examples/en/loaders/GLTFLoader'>
	 * THREE.GltfLoader</a>
	 * @member AssetKeepr.loadGltf
	 * @function */
	static loadGltf(scene, obj3, url, onload) {
		if (assets.loaders[url] === undefined)
			assets.loaders[url] = new GLTFLoader();
			assets.loaders[url].load(url, function(gltf, nodeMap) {
				if (typeof onload === 'function')
					onload(gltf, nodeMap);

				if (obj3 && obj3.transform) {
					var m4 = new mat4();
					for (var trs of obj3.transform)
						m4.appAffine(trs);

					gltf.scene.matrixAutoUpdate = false;
					m4.put2js(gltf.scene.matrix);
					obj3.mesh = gltf.scene;
				}

				if (scene) {
					scene.add( gltf.scene );
				}

				if (!scene && !onload)
					console.warn(
						'AssetKeepr.loadGltf(): Loaded gltf assets without THREE.Scene instance: ',
						gltf.scene);
		},
		function ( xhr ) {
			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
		},
		// called when loading has errors
		function ( error ) {
			console.error( 'AssetKeepr.loadGltf(): ', error );
		});
	}

	// deprecated?
	static loadGltfNode(url, nname, onParsed) {
		AssetKeepr.loadGltf(undefined, url, function(gltf, nodeMap) {
			var nix;
			if (typeof nname === 'number')
			 	nix = nname;
			else nix = nodeMap[nname];
			if (nix)
				onParsed( gltf.nedes[nix] );
			else onParsed( undefined );
		});
	}

	/**
	 * @param {string} url
	 * @param {array<string>} nnames
	 * @param {function} onParsed
	 * @member AssetKeepr.loadGltfNodes
	 * @function */
	static loadGltfNodes(url, nnames, onParsed) {
		if (!nnames) onParsed(undefined);
		else {
			AssetKeepr.loadGltf(undefined, url, function(gltf, nodeMap) {
				var nods = [];
				for (var nname of nnames) {
					var nix;
					if (typeof nname === 'number')
					 	nix = nname;
					else nix = nodeMap[nname];
					if (nix)
						nods.push(gltf.nodes[nix]);
				}
				onParsed( nods );
			});
		}
	}

	/**
	 * Initialize a Canvas component with a THREE.CanvasTexture from canvas, which
	 * is not initialized when return.
	 *
	 * The component will be updated when it's ready
	 *
	 * **DESIGN-MEMO**
	 *
	 * 1. This function maintance dirty with tick flag. Referenced canvase won't
	 * been updated if the component's stamp less than the asset's stamp
	 * 2. Texture canvas are sharable.
	 *
	 * *Reference*
	 *
	 * https://stackoverflow.com/questions/3768565/drawing-an-svg-file-on-a-html5-canvas<br>
	 * https://jsfiddle.net/Wijmo5/h2L3gw88/<br>
	 * https://bl.ocks.org/mbostock/1276463<br>
	 * threejs example: https://threejs.org/examples/?q=canvas#webgl_materials_texture_canvas<br>
	 * example source: https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_texture_canvas.html<br>
	 * threejs doc CanvasTexture: https://threejs.org/docs/index.html#api/en/textures/CanvasTexture
	 *
	 * @param {Canvas} cmpCanv Canvas component
	 * @param {number} stamp optional, if stamp is less than x.lastUpdate, ignore
	 * the request; if undefined, always update. So set this carefully for performance
	 * optimization - updating canvas is a heavy work load.
	 * @param {function} onUpdate optional, callback when html canvas texture updated.
	 * parameter: canvas {HTML.Canvas}, texture {THREE.CanvasTexture}
	 * @return {Canvas} the Canvas component referencing object:<br>
	 * where<br>
	 * **tex**: THREE.CanvasTexture when html canvas is initialized. But before this is undefined.<br>
	 * **canvas**: HTML canvas when html canvas is initialized. But before this is undefined.<br>
	 * **ctx2d**: HTML canvas 2d context when html canvas is initialized.<br>
	 * But before this its is undefined - can not been used for sampling before onUpdate called.
	 * @member AssetKeepr.loadCanvtex
	 * @function
	 */
	static loadCanvtex(cmpCanv, stamp, onUpdate) {
		const x = assets.xref;
		if (stamp === undefined)
			stamp = x.lastUpdate;
		// if stamp handled, no more update
		if (stamp < x.lastUpdate)
			return cmpCanv;

		var h5 = assets.canvs[cmpCanv.domId];
		if (!h5) {
			h5 = {domId: cmpCanv.domId,
				  stamp: assets.xref.lastUpdate};
			assets.canvs[cmpCanv.domId] = h5;
		}
		if (h5.stamp <= x.lastUpdate) {
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
					// Memo:
					// reference entity.Obje in wrong way, but this method is to be deprecated
					cmpCanv.entity.Obj3.mesh.visible = true;

					if (typeof onUpdate === 'function')
						onUpdate(canvas, cmpCanv.tex);
				});
			}
		}
		return cmpCanv;
	}

	static loadCanvtex2(cmpCanv, options, obj3, onUpdate) {
		var width = options && options.width ? options.width : 256;
		var height = options && options.heigth ? options.heigth : 256;
		var opts = Object.assign({
				width, height,
				// https://github.com/niklasvh/html2canvas/issues/1164
				allowTaint: true,
				useCORS: true,
				backgroundColor: "rgba(0,0,0,0)",
				removeContainer: true,
				x: 0, y: 0
			}, options);
		var dom = document.getElementById(cmpCanv.domId);

		html2canvas(dom, opts).then( function(canvas) {
			var drawingContext = canvas.getContext( '2d' );

			cmpCanv.canvas = drawingContext.canvas;
			cmpCanv.tex = new THREE.CanvasTexture(drawingContext.canvas);
			cmpCanv.ctx2d = drawingContext;
			cmpCanv.dirty = true;

			if (typeof onUpdate === 'function')
				onUpdate(canvas, cmpCanv.tex);
		});
		return cmpCanv;
	}

	/**
	 * Load svg
	 *
	 * @param {string} url string
	 * @member AssetKeepr.loadSVG
	 * @function
	 */
	static loadSVG( url, opts, onload ) {
		// scene = new THREE.Scene();
		// scene.background = new THREE.Color( 0xb0b0b0 );
		//
		// //
		// var helper = new THREE.GridHelper( 160, 10 );
		// helper.rotation.x = Math.PI / 2;
		// scene.add( helper );

		//
		if (assets.loaders[url] === undefined)
			assets.loaders[url] = new SVGLoader();
		assets.loaders[url] = new SVGLoader();
		var loader = assets.loaders[url];
		loader.load( url, function ( data ) {
			var paths = data.paths;
			var group = new THREE.Group();
			group.scale.multiplyScalar( 0.25 );
			group.position.x = - 70;
			group.position.y = 70;
			group.scale.y *= - 1;

			for ( var i = 0; i < paths.length; i ++ ) {
				var path = paths[ i ];
				var fillColor = path.userData.style.fill;
				if ( opts.drawFillShapes && fillColor !== undefined && fillColor !== 'none' ) {
					var material = new THREE.MeshBasicMaterial( {
						color: new THREE.Color().setStyle( fillColor ),
						opacity: path.userData.style.fillOpacity,
						transparent: path.userData.style.fillOpacity < 1,
						side: THREE.DoubleSide,
						depthWrite: false,
						wireframe: opts.wireframe
					} );

					var shapes = path.toShapes( true );

					for ( var j = 0; j < shapes.length; j ++ ) {
						var shape = shapes[ j ];
						var geometry = new THREE.ShapeBufferGeometry( shape );
						var mesh = new THREE.Mesh( geometry, material );
						group.add( mesh );
					}
				}

				var strokeColor = path.userData.style.stroke;

				if ( opts.stroke && strokeColor !== undefined && strokeColor !== 'none' ) {
					var material = new THREE.MeshBasicMaterial( {
						color: new THREE.Color().setStyle( strokeColor ),
						opacity: path.userData.style.strokeOpacity,
						transparent: path.userData.style.strokeOpacity < 1,
						side: THREE.DoubleSide,
						depthWrite: false,
						wireframe: opts.wireframe
					} );

					for ( var j = 0, jl = path.subPaths.length; j < jl; j ++ ) {
						var subPath = path.subPaths[ j ];
						var geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );
						if ( geometry ) {
							var mesh = new THREE.Mesh( geometry, material );
							group.add( mesh );
						}
					}
				}
			}

			onload( group );
		} );
	}

	/**
	 * draw text
	 *
	 * @param {Dynatex} cmp - options
	 * @param  {String} cmp.text - the text to display
	 * @param  {Number|undefined} cmp.xywh.x - if provided, it is the x where to draw, if not, the text is centered
	 * @param  {Number} y - the y where to draw the text
	 * @param  {String} [fillStyle] - the fillStyle to clear with, if not provided, fallback on .clearRect
	 * @param  {String} [contextFont] - the font to use
	 * @return {THREE.CanvasTextrue}
	 * @member AssetKeepr.drawText
	 * @function
	 */
	static drawText (cmp) {
	// static drawText (text, x, y, fillStyle, contextFont) {
		var {text, xywh, style, font} = cmp
		if (!assets.dynatex[text]) {
			// set font if needed
			var canvas = document.createElement( 'canvas' )
			canvas.width = cmp.xywh.w || 128;
			canvas.height = cmp.xywh.h || 128;
			var ctx = canvas.getContext( '2d' )
			if( font !== undefined )
				ctx.font = font;

			// if x isnt provided
			// if( x === undefined || x === null ){
			// 	var textSize = ctx.measureText(text);
			// 	x = (canvas.width - textSize.width) / 2;
			// }

			// actually draw the text
			ctx.fillStyle = style;
			ctx.fillText(text, xywh.x || 0, xywh.y || 0);

			var texture = new THREE.CanvasTexture(ctx.canvas);
			// https://threejsfundamentals.org/threejs/lessons/threejs-textures.html
			texture.minFilter = THREE.NearestFilter;
			assets.dynatex[text] = {
					context: ctx,
					texture};

		}
		// this.texture.needsUpdate = true;
		return assets.dynatex[text].texture;
	};

}

/**Splashing screean helper.
 * <br>See <a href='https://stackoverflow.com/questions/647440/showing-a-splash-screen-during-script-execution'>AnthonyWJones' Answer @ stackoverflow</a>
 * @example
 * splash("mySplashDiv", longRunner)
 * function longRunner() {
 *    //This may take a while
 * }
 * @param {string} splashImgId
 * @param {function} xworker the long rounner
 * @param {string} src image
 *
 * @memberof xutils
 * @function
 */
export function splash(splashImgId, xworker, src) {
    var splashImg = document.getElementById(splashImgId)
    splashImg.style.display = "block";
	if (src)
		splashImg.src = src;
	else
		splashImg.src = 'assets/splash.gif';
    setTimeout(function() {
       xworker()
       splashImg.style.display = "none";
    }, 100);
}

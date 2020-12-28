import * as THREE from '../../packages/three/three.module-MRTSupport';
import * as oboe from 'oboe';

// For why using source instead of npm package, see packages/three/README.md
import { GLTFLoader } from '../../packages/three/GLTFLoader'
import { SVGLoader } from '../../packages/three/SVGLoader'
import html2canvas from '../../packages/misc/html2canvas.js'
import { XError, ramTexture } from './xcommon'

import { x } from '../xapp/xworld'
import { vec3, mat4 } from '../xmath/vec'
import xgeom from '../xmath/geom'

/**Static assets buffer for global resource management
 * @memberof AssetKeepr
 */
const assets = {
	/**@property {Object} loaders - gltf / svg loaders
	 * @member assets#loaders
	 * @memberof AssetKeepr
	 */
	loaders: {},
	/**@property {Object} canvas - {domId: Canvas} map of Canvas components.
	 * @member assets#canvs
	 * @memberof AssetKeepr
	 */
	canvs: {}, // {domId: Components.Canvas} map of Canvas components.
	/**Light weight dynamic text canvase pool.
	 * @property {Object} dynatex - {domId: Dynatex} map of Dynatex components.
	 * @member assets#dynatex
	 * @memberof AssetKeepr
	 */
	dynatex: {},
	/**Svg Assets {key: url, value: [paths]}
	 * @property {object} svg - {key: url, value: object} map of Dynatex components.
	 * @member assets#svg
	 * @memberof AssetKeepr
	 */
	svg: {}
}

// test
const svgloader = new SVGLoader();

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
	static get canvs() {
		return assets.canvs;
	}

	/**@member AssetKeepr#assets
	 * @property {object} assets - get global assets map */
	static get assets() {
		return assets;
	}

	/**@member AssetKeepr#log
	 * @property {number} log - get log level */
	static get log() {
		return assets.log;
	}

	/**@member AssetKeepr#dynatex
	 * @property {number} dynatex - get dynamic canvas texture */
	static get dynatex() {
		return assets.dynatex;
	}

	static get greyPixel() {
		return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AQSDjsH5tmdcQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAMSURBVAjXY2hoaAAAAwQBgZrwzU8AAAAASUVORK5CYII=';
	}

	static isExr(str) {
		if (AssetKeepr.regExr === undefined)
			AssetKeepr.regExr = new RegExp(/.*\.exr\s*$/i);

		return AssetKeepr.regExr.test(str);
	}

	/**Get a spark texture, in 'data:image/png;base64'.
	 * @return {THREE.Texture}
	 * @member AssetKeepr.defaultex
	 * @function */
	static defaultex() {
		if(!assets.sparktex) {
			debugger
			assets.sparktex = new THREE.TextureLoader().load(
				// https://onlinepngtools.com/convert-png-to-base64
				// 16x16 version of spark1.png
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AIKBwk6Rv00TgAAAaVJREFUOMvVkk9rE1EUxc99b0ycpFJqwAgNARFc6a7gNhs/UbbDhDBhCPk8LlvIJi7diFrEKS5iikrQaekkzrx3jytDUv9uXHi2l/Pj3HMv8N9LfjXo9/uo1+sGgDjndDKZMIoijEajPwPiOA5U9QBAS1Ubxpgrkp9I5mma+t8CoigKRORQVY9E5AGAGoA1gNcAnnvvFyR1PB4DAIJtc5qmKIritqo+FpEnInJfRG6q6gLAXQA3RORERHIA/AFQVZUFcCgiD40xj8IwPGq1Wna1WhXL5fJEVT+LyEvv/cV3gLkGEJL7APaCIDhot9u22+2i0+k0rLUdAPsAboVhuPHsAEQEAEoATlUvarUarLXI8xze+5WIlCLinHOb7nZWsNYqyQ8AFt770yzL9ubz+Z31en1O8i3J9wA+JkmyuYTdBkynU/Z6va8APMkGyS9lWWYkM5JvADyrqupsNpv5nyYYDAaw1hZVVb1Q1UtjzD0AIclCVc+ste+azWa17dnpYDgcwjmHJEkuAbwyxhyTfGqMOTbGnCZJcuW951/9eBzHuJ7un+gbY1HV8WP17N0AAAAASUVORK5CYII=	'
			);
		}
		return assets.sparktex;
	}

	/**
	 * @return {THREE.Texture} color pixel: data:application/x-visual+img,gray-pixel
	 */
	static cheapixelTex() {
		return AssetKeepr.loadTexure('data:application/x-visual+img,gray-pixel');
	}

	/**Load texture - include "data:application/x-visual+img".
	 * @param {string|url} url
	 * @param {function} onload
	 * @return {THREE.Texture} loaded by THREE.TextureLoader().load()
	 */
	static loadTexure(url, onload) {
		// Debug Notes:
		// npm parse-data-url can't handling svg tags: https://github.com/killmenot/parse-data-url
		// var data = parseDataUrl(url);
		var tex;
		if (!url)
			return tex;
		else if (Array.isArray(url)) {
			tex = [];
			for (var ul of url) {
				tex.push(AssetKeepr.loadTexure(ul, onload));
			}
		}
		else if (url.startsWith('data:application/x-visual+img')) {
			if (url.substr(30, 10) === 'gray-pixel' ||
				url.substr(30, 10) === 'grey-pixel')
				tex = new THREE.TextureLoader().load( AssetKeepr.greyPixel,
						onload, undefined, // onProgress
						(err) => {
							debugger;
							console.error(err);
						} );
			else if (url.substr(30, 4) === 'stub')
				// no onload callback to stop replacing any ready texture
				tex = new THREE.TextureLoader().load(AssetKeepr.greyPixel);
			else if (url.substr(30, 11) === 'color-pixel') {
				var color = eval(url.substr(42));
				if(Array.isArray(color)) {
					var data = new Uint8Array(4);
					data[0] = color[0] * 255;
					data[1] = color[1] * 255;
					data[2] = color[2] * 255;
					data[3] = color.length > 3 ? color[3] * 255 : 255;
					tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);

					if(typeof onload === 'function')
						onload(tex);
				}
			}
			else throw new XError('TODO Unknow data url: ', url);
		}
		else if (url.startsWith('data:')) {
			tex = new THREE.TextureLoader().load(url, onload);
		}
		else {
			var tex = new THREE.TextureLoader().load('assets/' + url, onload);
		}

		// if(typeof onload === 'function')
		// 	onload(tex);

		// should work in asynchronous
		return tex;
	}

	/**Load path of 3857 - not geojson, but json data are supposed the same format,
	 * except coordinates' values.
	 * @param {url} url
	 * @param {object} options
	 * @param {function} onLoad callback on assets loaded.
	 * @param {function} [onError] callback on oboe failed.
	 * @return {array} a 3d array of a fake path: [[[0, 0], [1, 0]]]
	 * @member AssetKeepr.geojsonPaths
	 * @function */
	static geojsonPaths(url, options, onLoad,
		onError = (args) => {
			console.error(args);
		}) {
		var op = Object.assign(new Object(), {
			start: 0,
			end: -1,
			count: -1,
			paths: new Array()
		});
		op = Object.assign(op, options);

		oboe(url)
			.node('features.*', (feature) => {
				op.count++;
				if(op.start >= op.count && (op.end < 0 || op.end > op.count)) {
					var elem = feature.geometry.coordinates;
					op.paths.push(elem);
				}
				if(op.end >= 0 && op.end >= op.count)
					this.abort();
			})
			.done((args) => {
				// console.log(args);
				onLoad(op.paths, op.count)
			})
			.fail(onError);

		return [ [ [0, 0], [1, 0] ] ]; // stub for creating mesh / path line
	}

	/**Load hexatile from points in 3857 - not geojson, but json data are supposed
	 * the as same format of geojson, except coordinates' values.
	 * @param {url} url
	 * @param {object} options
	 * @param {function} onload callback on assets loaded.
	 * arguments:
	 * BufferGeometry, each vertices has 'position', 'a_h', 'a_tan', 'uv' & 'normal' attributes
	 * @param {function} [onError] callback on oboe failed.
	 * @return {array} a 3d array of a fake cell vertices
	 * @member AssetKeepr.geoHexaprismAsync
	 * @function */
	static geoHexaprismAsync(url, options, onload,
		onError = (args) => {
			console.error(args);
		}) {

		var heightName = options.heightName || 'height';
		var verts = options.count * (14 + 12);
		var ctx = new Object();
		ctx.features = 0;
		ctx.vx = 0; // starting vert index for each feature. (26 vert / feature)
		ctx.r = options.radius >= 0 ? options.radius : 1;
		ctx.pos = new Float32Array(verts * 3);
		ctx.loc = new Float32Array(verts * 3);
		ctx.uvs = new Float32Array(verts * 2);
		ctx.normals = new Float32Array(verts * 3);
		ctx.dirs = new Float32Array(verts * 3);
		ctx.index = [];

		const tile0 = xgeom.hexatile(ctx.r);
		const hs = options.height;

		var hex = new THREE.PlaneBufferGeometry(100, 100, 0);
		oboe(url)
			.node('features.*', (feature) => {
				if(ctx.features >= options.count)
					return;

				ctx.features++;
				var h = feature.properties[heightName] || feature.geometry[heightName] || 1;
				var coord = feature.geometry.coordinates;
				var tuple = xgeom.hexaprism3857({
					coord,
					height: h * hs,
					geoScale: options.geoScale || 1,
					group: options.onGroup ? options.onGroup(fx, f) : 1
				}, options.geoCentre, tile0, ctx);

				// if(ctx.features >= options.count)
					// this.abort();
			})
			.done((args) => {
				var geom = new THREE.BufferGeometry();
				geom.setAttribute("position", new THREE.BufferAttribute(ctx.pos, 3));
				geom.setAttribute("a_tan", new THREE.BufferAttribute(ctx.dirs, 3));
				geom.setAttribute("a_loc", new THREE.BufferAttribute(ctx.loc, 3));
				geom.setAttribute('normal', new THREE.BufferAttribute(ctx.normals, 3));
				geom.setAttribute('uv', new THREE.BufferAttribute(ctx.uvs, 2));
				geom.setIndex(ctx.index);
				onload(geom, ctx.pos, ctx.vx);
			})
			.fail(onError);

		return { geom: hex };
	}

	/**Load hexatile from points in 3857 - not geojson, but json data are supposed
	 * the as same format of geojson, except coordinates' values.
	 * @param {array.<GeoFeature>} featrues
	 * @param {object} options
	 * @return {array} a 3d array of a fake cell vertices
	 * @member AssetKeepr.geoHexaprism
	 * @function */
	static geoHexaprism(features, options) {
		if(!features) return;

		var heightName = options.heightName || 'height';
		var verts = (features.length || 0) * (14 + 12);
		var ctx = new Object();
		ctx.vx = 0; // starting vert index for each feature. (26 vert / feature)
		ctx.r = options.radius >= 0 ? options.radius : 1;
		ctx.pos = new Float32Array(verts * 3);
		ctx.loc = new Float32Array(verts * 3);
		ctx.uvs = new Float32Array(verts * 2);
		ctx.normals = new Float32Array(verts * 3);
		ctx.dirs = new Float32Array(verts * 3);
		ctx.index = [];

		const tile0 = xgeom.hexatile(ctx.r);
		const hs = options.height;

		var fx = 0;
		for(var f of features) {
			var h = f.properties[heightName] || f.geometry[heightName] || 1;
			var coord = f.geometry.coordinates;
			xgeom.hexaprism3857({
				coord,
				height: h * hs,
				geoScale: options.geoScale || 1,
				group: options.onGroup ? options.onGroup(fx, f) : 1
			}, options.geoCentre, tile0, ctx);
			fx++;
		}

		var geom = new THREE.BufferGeometry();
		geom.setAttribute("position", new THREE.BufferAttribute(ctx.pos, 3));
		geom.setAttribute("a_tan", new THREE.BufferAttribute(ctx.dirs, 3));
		geom.setAttribute("a_loc", new THREE.BufferAttribute(ctx.loc, 3));
		geom.setAttribute('normal', new THREE.BufferAttribute(ctx.normals, 3));
		geom.setAttribute('uv', new THREE.BufferAttribute(ctx.uvs, 2));
		geom.setIndex(ctx.index);
		return {
			geom,
			points: ctx.pos
		};
	}

	/**Load hexatile from points in 3857 - not geojson, but json data are supposed
	 * the as same format of geojson, except coordinates' values.
	 * This should only used for real buildings with textures. For vitual buildings,
	 * use @{@link AssetKeepr.geoPrismBoxes}
	 * @param {array.<GeoFeature>} featrues
	 * @param {object} options
	 * @return {array} a 3d array of a fake cell vertices
	 * @member AssetKeepr.geoTexturePrism
	 * @function */
	static geoTexturePrism(features, options) {
		if(!features) return;

		var verts = options.maxVerts || 2048; // it's user's responsibility to find how many vertices is
		var ctx = new Object();
			ctx.features = 0;
			ctx.vx = 0; // starting vert index for each feature.
			ctx.pos = new Float32Array(verts * 3);
			ctx.loc = new Float32Array(verts * 3);
			ctx.atiles = new Float32Array(verts * 3);
			ctx.uvs = new Float32Array(verts * 2);
			ctx.normals = new Float32Array(verts * 3);
			ctx.box = new Float32Array(verts * 3);
			ctx.index = [];

		var fx = 0;
		for(var f of features) {
			// if (options.filter && f.properties
			// 	&& f.properties.area !== options.filter)
			if ( options.filter && (
				 !f.properties
				|| f.properties.area !== options.filter ))
				continue;
			AssetKeepr.feature2Prism(ctx, f, options);
		}

		var geom = new THREE.BufferGeometry();
			geom.setAttribute("position", new THREE.BufferAttribute(ctx.pos, 3));
			geom.setAttribute("a_box", new THREE.BufferAttribute(ctx.box, 3));// box.y = groupidx
			geom.setAttribute("a_tiles", new THREE.BufferAttribute(ctx.atiles, 3));
			geom.setAttribute("a_loc", new THREE.BufferAttribute(ctx.loc, 3));
			geom.setAttribute('normal', new THREE.BufferAttribute(ctx.normals, 3));
			geom.setAttribute('uv', new THREE.BufferAttribute(ctx.uvs, 2));
			geom.setIndex(ctx.index);
		return {
			geom,
			points: ctx.pos
		};
	}

	static feature2Prism(ctx, f, options) {
		const heightName = options.heightName || 'height';
		const hs = options.height;

		if (!f.geometry || !Array.isArray(f.geometry.coordinates)) {
			console.error('Incorrect data found to generate geoprism: ', f);
			return;
		}

		var h = f.properties ?
				f.properties[heightName] || f.geometry[heightName] || 1
				: 1;

		for (var points of f.geometry.coordinates) {
			// var points = f.geometry.coordinates;
			// var {xzwh, loc} = xgeom.xzBox(f.geometry.coordinates);
			var {xzwh, loc} = xgeom.xzBox(points);

			if (Array.isArray(f.geometry.center))
				loc = f.geometry.center;

			var boxSize = options.box || [xzwh.w, hs * h, xzwh.h];

			var tile = options.tiles ||
						[4, options.tile ? options.tile.layers || 1 : 1, 3];

			xgeom.texPrism3857( {
				points,
				boxSize, xzwh, tile,
				height: h * hs,
				prismCentre: loc,
				geoScale: options.geoScale || 1,
				group: options.onGroup ? options.onGroup(ctx.features, f) : 1
			}, options.geoCentre, ctx );
		}

		ctx.features++;
	}

	// prism with boxes
	static geoPrismAsync(url, options, onload,
		onError = (args) => {
			console.error(args);
		}) {

		var verts = options.verts || 4096 * (6*4 + 6); // 4k hexagon (FIXME)
		// context
		var ctx = new Object();
			ctx.features = 0;
			ctx.vx = 0; // starting vert index for each feature.
			ctx.pos = new Float32Array(verts * 3);
			ctx.loc = new Float32Array(verts * 3);
			ctx.atiles = new Float32Array(verts * 3);
			ctx.uvs = new Float32Array(verts * 2);
			ctx.normals = new Float32Array(verts * 3);
			ctx.box = new Float32Array(verts * 3);
			ctx.index = [];

		oboe(url)
		.node('features.*', (f) => {
			// FIXME is it safe using "options" like this?
			if(ctx.features > options.count)
				return; // FIXME why can't like this: this.abort();

			if ( options.filter && (
				 !f.properties
				|| f.properties.area !== options.filter ))
				return;

			AssetKeepr.feature2Prism(ctx, f, options);

			if (typeof options.onFeature === 'function')
				options.onFeature( ctx, f, options );
		})
		.done((args) => {
			var geom = new THREE.BufferGeometry();
			geom.setAttribute("position", new THREE.BufferAttribute(ctx.pos, 3));
			geom.setAttribute("a_box", new THREE.BufferAttribute(ctx.box, 3));// box.y = groupidx
			geom.setAttribute("a_tiles", new THREE.BufferAttribute(ctx.atiles, 3));
			geom.setAttribute("a_loc", new THREE.BufferAttribute(ctx.loc, 3));
			geom.setAttribute('normal', new THREE.BufferAttribute(ctx.normals, 3));
			geom.setAttribute('uv', new THREE.BufferAttribute(ctx.uvs, 2));
			geom.setIndex(ctx.index);
			onload(geom, ctx.pos, ctx.vx, options);
		})
		.fail(onError);

		return { geom: new THREE.PlaneBufferGeometry(100, 10, 0) };
	}

	/**load gltf model<br>
	 * If obj3 is provided, then after loaded, set the scene transform according
	 * to obj3.transfrom, set obj3.mesh = gltf.scene.<br>
	 * For details, see reference: GLTF format from x-visual docs.<br>
	 * Also see <a href='https://threejs.org/docs/#examples/en/loaders/GLTFLoader'>
	 * Three.js example - GLTFLoader</a>
	 * and <a href='https://threejsfundamentals.org/threejs/lessons/threejs-load-gltf.html'>
	 * Three.js tuturial of gltf loader</a>
	 * @param {THREE.Scene} [scene] if provided, add the loaded gltf.scene to it.
	 * @param {Obj3} [obj3] [in out] after loaded, set the scene transform according
	 * to obj3.transfrom, set obj3.mesh = gltf.scene
	 * @param {stirng} url A string containing the path/URL of the .gltf or .glb file.
	 * @param {function} onload callback on assets loaded.<br>
	 * If not provided, load entire gltf scene as child of main scene (the argument)<br>
	 * @member AssetKeepr.loadGltf
	 * @function */
	static loadGltf(scene, obj3, url, onload) {
		if(assets.loaders[url] === undefined)
			assets.loaders[url] = new GLTFLoader();
		assets.loaders[url].load(url, function(gltf, nodeMap) {
				if(typeof onload === 'function')
					onload(gltf, nodeMap);

				else {
					// default onload handling, load entire gltf scene as child of main scene (the argument)
					if(obj3) {
						var m4 = new mat4();
						if(obj3.transform) {
							for(var trs of obj3.transform)
								m4.appAffine(trs);
						}

						gltf.scene.matrixAutoUpdate = false;
						m4.put2js(gltf.scene.matrix);
						obj3.mesh = gltf.scene;

						//fix  refrence AffineCombiner3 initCombined  	e.Obj3.m0.decompose(e.Obj3.mesh.matrix);
						//set mesh matrix origin value
						if(obj3.m0){
							obj3.m0.decompose(obj3.mesh.matrix);
						}

					}

					if(scene) {
						scene.add(gltf.scene);
					} else console.warn(
						'AssetKeepr.loadGltf(): Loaded gltf assets without THREE.Scene instance: ',
						gltf.scene);
				}
			},
			function(xhr) {
				if(x.log >= 5) console.log(`[5] ${xhr.loaded / xhr.total * 100}% loaded`);
			},
			// called when loading has errors
			function(error) {
				console.error('AssetKeepr.loadGltf(): ', error);
			});
	}

	/**
	 * @param {Obj3} obj3
	 * @param {string} url
	 * @param {array<string>} nnames
	 * @param {function} onParsed
	 * @member AssetKeepr.loadGltfNodes
	 * @function */
	static loadGltfNodes(obj3, url, nnames, onParsed) {
		if(!nnames) onParsed(undefined);
		else {
			AssetKeepr.loadGltf(undefined, obj3, url, function(gltf, nodeMap) {
				var nods = [];
				for(var nname of nnames) {
					var nix;
					if(typeof nname === 'number')
						nix = nname;
					// Debug Notes;
					// 2020.05.18 node's names have been sanitized
					// see debug notes in docs/reference/gltf.html#the-x-visual-loader
					// also see packages/three/GLTFLoader.loadNode.then():
					// ... node.name = PropertyBinding.sanitizeNodeName( nodeDef.name );
					else nix = nodeMap[THREE.PropertyBinding.sanitizeNodeName(nname)];
					if(nix >= 0)
						nods.push(gltf.nodes[nix]);
				}
				onParsed(nods);
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
		if(stamp === undefined)
			stamp = x.lastUpdate;
		// if stamp handled, no more update
		if(stamp < x.lastUpdate)
			return cmpCanv;

		var h5 = assets.canvs[cmpCanv.domId];
		if(!h5) {
			h5 = {
				domId: cmpCanv.domId,
				stamp: assets.xref.lastUpdate
			};
			assets.canvs[cmpCanv.domId] = h5;
		}
		if(h5.stamp <= x.lastUpdate) {
			if(typeof document !== 'object')
			; // testing ?
			else {
				var dom = document.getElementById(cmpCanv.domId);
				var opts = Object.assign({
						width: 256,
						height: 256
					},
					cmpCanv.options);

				html2canvas(dom, opts).then(function(canvas) {
					var drawingContext = canvas.getContext('2d');

					cmpCanv.canvas = drawingContext.canvas;
					cmpCanv.tex = new THREE.CanvasTexture(drawingContext.canvas);
					cmpCanv.ctx2d = drawingContext;
					// set dirty flag now to avoid updating by renderer before this texture is ready
					cmpCanv.dirty = true;
					// Memo:
					// reference entity.Obje in wrong way, but this method is to be deprecated
					cmpCanv.entity.Obj3.mesh.visible = true;

					if(typeof onUpdate === 'function')
						onUpdate(canvas, cmpCanv.tex);
				});
			}
		}
		return cmpCanv;
	}

	static loadCanvtex2(cmpCanv, options = {}, obj3, onUpdate) {
		var width = options && options.width ? options.width : 256;
		var height = options && options.heigth ? options.heigth : 256;
		var opts = Object.assign({
			width,
			height,
			// https://github.com/niklasvh/html2canvas/issues/1164
			allowTaint: true,
			useCORS: true,
			backgroundColor: "rgba(0,0,0,0)",
			removeContainer: true,
			x: 0,
			// y: options.y === undefined ? 0 : options.y
			y: 0,
			// y: 30.5
		}, options);
		var dom = document.getElementById(cmpCanv.domId);

		html2canvas(dom, opts).then(function(canvas) {
			var drawingContext = canvas.getContext('2d');

			cmpCanv.canvas = drawingContext.canvas;
			cmpCanv.tex = new THREE.CanvasTexture(drawingContext.canvas);
			cmpCanv.ctx2d = drawingContext;
			cmpCanv.dirty = true;

			if(typeof onUpdate === 'function')
				onUpdate(canvas, cmpCanv.tex);
		});
		return cmpCanv;
	}

	static loadSvgPath(url, nodes, onload) {
		if(assets.loaders[url] && assets.svg[url].paths) {
			return getPaths(assets.svg[url].paths, nodes, onload);
		}

		function getPaths(mapath, nodes, onload) {
			var paths = [];
			for(var n of nodes) {
				paths.push(mapath[n]);
			}
			onload(paths);
		}

		AssetKeepr.loadSVG(url, {}, (group, paths) => {
			if(!assets.svg[url])
				assets.svg[url] = {
					paths: {}
				};
			for(var p of paths) {
				assets.svg[url].paths[p.pathId] = p;
			}
			return getPaths(assets.svg[url].paths, nodes, onload);
		});
	}

	/**
	 * Load svg - don't use this to load pathes
	 *
	 * @param {string} url string
	 * @param {object} opts
	 * opts.withMesh: bool - convert fill to mesh ( z = 0 )<br>
	 * opts.withStroke: bool - convert stroke to polygon ( z = 0 )<br>
	 * {drawFillShapes: bool, wireframe: THREE.material.wireframe, stroke: bool}
	 * @param {function} onload function(group: THREE.Group)
	 * @member AssetKeepr.loadSVG
	 * @function
	 */
	static loadSVG(url, opts, onload) {
		if(assets.loaders[url] === undefined)
			assets.loaders[url] = new SVGLoader();

		var loader = assets.loaders[url];
		loader.load(url, function(data) {
			var paths = data.paths;
			var group = new THREE.Group();

			if(opts.withMesh || opts.withStroke) {
				for(var i = 0; i < paths.length; i++) {
					var path = paths[i];
					if(opts.withMesh) {
						var fillColor = path.userData.style.fill;
						if(opts.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {
							var material = new THREE.MeshBasicMaterial({
								color: new THREE.Color().setStyle(fillColor),
								opacity: path.userData.style.fillOpacity,
								transparent: path.userData.style.fillOpacity < 1,
								side: THREE.DoubleSide,
								depthWrite: false,
								wireframe: opts.wireframe
							});

							var shapes = path.toShapes(true);

							for(var j = 0; j < shapes.length; j++) {
								var shape = shapes[j];
								var geometry = new THREE.ShapeBufferGeometry(shape);
								var mesh = new THREE.Mesh(geometry, material);
								group.add(mesh);
							}
						}
					}

					if(opts.withStroke) {
						var strokeColor = path.userData.style.stroke;

						if(opts.stroke && strokeColor !== undefined && strokeColor !== 'none') {
							var material = new THREE.MeshBasicMaterial({
								color: new THREE.Color().setStyle(strokeColor),
								opacity: path.userData.style.strokeOpacity,
								transparent: path.userData.style.strokeOpacity < 1,
								side: THREE.DoubleSide,
								depthWrite: false,
								wireframe: opts.wireframe
							});

							for(var j = 0, jl = path.subPaths.length; j < jl; j++) {
								var subPath = path.subPaths[j];
								var geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style);
								if(geometry) {
									var mesh = new THREE.Mesh(geometry, material);
									group.add(mesh);
								}
							}
						}
					}
				}
			}

			onload(group, paths);
		});
	}

	static parseSVG(strSVG) {
		return svgloader.parse(strSVG);
	}

	/**
	 * <p>draw text - synchrodous</p>
	 * v0.3.21 change log: try scaling plane to adapt more or less words than
	 * paras defined canvas can hold, via only scaling texture;
	 *
	 * Test: test/html/dynatex.html
	 *
	 *see <a href='odys-z.github.io/x-visual/design-memo/renderer.html?highlight=dynatex'>docs/Dynamic Text</a>
	 *
	 * Reference:
	 * // https://threejsfundamentals.org/threejs/lessons/threejs-textures.html
	 * // https://threejsfundamentals.org/threejs/lessons/threejs-canvas-textures.html
	 *
	 * @param {Dynatex} cmp - options
	 * @param {string} cmp.text - the text to display
	 * @param {object} cmp.xywh see <a href='odys-z.github.io/x-visual/design-memo/renderer.html?highlight=dynatex'>docs/Dynamic Text</a>
	 * @param {string} [fillStyle] - the fillStyle to clear with, if not provided, fallback on .clearRect
	 * @param {string} [contextFont] - the font to use
	 * @return {THREE.CanvasTextrue}
	 * @member AssetKeepr.drawText
	 * @function
	 */
	static drawText(cmp) {
		var {text, xywh, style, font} = cmp;
		if(!assets.dynatex[text]) {
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');

			// fnt must set before measure text width
			var fnt;
			if(font !== undefined)
				// fnt = `${xywh.size}px bold sans-serif`;
				fnt = `${xywh.size}px ${font}`;
			else if(xywh.size)
				fnt = `${xywh.size}px Arial`;
			else fnt = "32px Arial";
			ctx.font = fnt;

			// https://threejsfundamentals.org/threejs/lessons/threejs-canvas-textures.html
			var margin = xywh.margin || 0;
			const doubleBorderSize = margin * 2;
			const width = ctx.measureText(text).width + doubleBorderSize;
			var height = (xywh.h || xywh.size) + doubleBorderSize;
			var hscale = 1;
			// scale plane? this is scale texture
			if (xywh.w > 0 && width > 0 && width > xywh.w) {
				hscale *= width/xywh.w;
				canvas.width = xywh.w*hscale;
				canvas.height = (xywh.h || xywh.size)*hscale;
			}
			else {
				canvas.width = xywh.w;
				canvas.height = xywh.h || xywh.size;
			}
			// debug notes: it's critical to set font after setting size
			ctx.font = fnt;
			ctx.textBaseline = 'top';

			// actually draw the text
			if(cmp['bg-color']) {
				ctx.fillStyle = cmp['bg-color'];
				ctx.fillRect(0, 0, ctx.canvas.width,ctx.canvas.height );
			}
			else {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
			ctx.fillStyle = style;
			ctx.fillText(text, (xywh.x || 0) + margin, (xywh.y || 0) + margin);

			//
			// https://threejsfundamentals.org/threejs/lessons/threejs-textures.html
			// https://threejsfundamentals.org/threejs/lessons/threejs-canvas-textures.html
			var texture = new THREE.CanvasTexture(canvas);
			texture.minFilter = THREE.LinearFilter;
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;

			assets.dynatex[text] = {
				context: ctx,
				texture: texture
				};
		}
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
	if(src)
		splashImg.src = src;
	else
		splashImg.src = 'assets/splash.gif';
	setTimeout(function() {
		xworker()
		splashImg.style.display = "none";
	}, 100);
}

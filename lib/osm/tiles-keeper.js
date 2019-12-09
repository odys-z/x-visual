/** @module xv.osm3.tiles */
import {OsmUtils, Vec3, R} from './utils.js'
import {OSM3} from './osm3.js'

// import TileWorker from 'worker-loader!./tiles-worker.js'
import workjs from 'raw-loader!./tiles-worker.js'

class TilesKeeper {

	/**
	 * @param {object} osm OSM3, provid function addTile(mesh), center()
	 * and addTileMesh()
	 * @param {string} path workder js path O3_workerPath = "tiles-keeper.js",
	 * use webpack.config?
	 */
	constructor (osm, path) {
		this.osm = osm;
		this.tiles = {};

		if (path) {
			this.workers = new Array(1);
			var num = 2; // threads
			for (let i = 0; i < num; i++) {
				// var blob = new Blob([path]);
				var blob = new Blob([workjs]);
				var url = window.URL.createObjectURL(blob);
				var w = new Worker(url);

				// var w = new Worker(path);
				// var w = new TileWorker();

				w.addEventListener('message', this.onOsmReady, false);
				w.addEventListener('error', this.onErr, false);
				this.workers[i] = w;
			}
		}
		else {
			console.warn('Worker js is undefined. Testing?');
		}
	}

	/**Asynchronously start an OSM tile loading - post message to worker.
	 * This function always use the first worker.
	 * @param {int[]} xyz [x,y,z]
	 */
	loasOsmAsync (xyz) {
		this.workers[0].postMessage({cmd: 'osm', xyz: [xyz]});
	}

	/** on tile loaded
	 */
	onOsmReady (e) {
		if (this.verbose >= 5)
			console.log(e);
		if (e.data.code === 'tile') {
			console.log(e.data);
			{	var blob = new Blob( [ e.data.img ], { type: "image/jpeg" } );
				var imageUrl = window.URL.createObjectURL( blob );
				var img = document.querySelector( "#tile" );
				if (img) {
					img.src = imageUrl;
				}
			}
			// tileKeeper.postMessage({cmd: 'set-ground', xyz: e.data.xyz}, e.data.bytes);

			this.setOsmTexture(e.data.xyz, imageUrl);
		}
	}

	onErr (e) { console.error(e); }

	/**Set loaded osm texture to the ground tile geometry
	 * For three.js texture loader, see
	 * https://threejs.org/docs/index.html#api/en/loaders/TextureLoader
	 * TODO put into work?
	 * @param {object} xyz osm {x, y, z}
	 * @param {Blob} blobUrl should be a blob url - ready for building texture
	 */
	setOsmTexture (xyz, blobUrl) {
		// instantiate a loader
		var loader = new THREE.TextureLoader();

		// load a resource
		loader.load( blobUrl, // resource URL
			// onLoad callback
			function ( texture ) {
				// in this example we create the material when the texture is loaded
				var material = new THREE.MeshBasicMaterial( {
					map: texture
				 } );

				// groundMeshes.material = material;
				// groundMeshes.material.map.needsUpdate = true;
				var tile = tilesKeeper.getile({x: xyz[0], y: xyz[1], z: xyz[2]});
				if (tile) {
					tile.mesh.material = material;
					tile.mesh.material.map.needsUpdate = true;
				}
				else {
					console.error('No tile for texture?', xyz);
				}
			},

			// onProgress callback currently not supported
			undefined,

			// onError callback
			function ( err ) {
				console.error( 'An error happened loading image' );
			}
		);
	}

	destroy () {
		this.workers.forEach( w => w.destroy());
		this.workers = [];
	}

	ping (ix) {
		var msg = {name: 'function loadingOsm'};
		this.workers[ix].postMessage({cmd: 'ping', msg: msg}); // Start worker
	}

	getile (xyz) {
		if (Array.isArray(xyz)) {
			return tilesKeeper.tiles[xyz[2]][xyz[0]][xyz[1]]
		}
		else {
			var ztiles = tilesKeeper.tiles[xyz.z];
			if (ztiles) {
				if (ztiles[xyz.x]) {
					return ztiles[xyz.x][xyz.y];
				}
			}
		}
	}

	setile (xyz, tile) {
		// collectOsmTiles (tiles, dir, c0, a) {
		if (this.tiles === undefined)
			this.tiles = {};

		var tiles = this.tiles;

		if (tiles[xyz.z] === undefined) {
			tiles[xyz.z] = {};
		}
		if (tiles[xyz.z][xyz.x] === undefined) {
			tiles[xyz.z][xyz.x] = {};
		}
		if (tiles[xyz.z][xyz.x][xyz.y] === undefined) {
			tiles[xyz.z][xyz.x][xyz.y] = {};
		}
		Object.assign(tiles[xyz.z][xyz.x][xyz.y],
			// { lon: longlat.long, lat: longlat.lat });
			tile);
		return this;
	}

	/*
	forEachTile (fun) {
		var tz = this.tiles; // for short
		if (tz) {
			for (var z in tz)
				for (var x in tz[z])
					for (var y in tz[z][x])
						fun(tz[z][x][y], [x, y, z]);
		}
	}
	*/

	/**Find osm tiles according to camera position.
	 * @param {object} osmTiles osm tile collection {z: {x: {y: tileInf}}}<br>
	 * tileInf: lon, lat, mesh, world
	 * @param {object} camWorld:<br>
	 *     target: lookAt, {lat, lon, h = 0}<br>
	 *     position: eye position, {lat, lon, h}<br>
	 *     z: osm z
	 * @param {THREE.Camera} camera
	 * @param {THREE.Matrix4} castMatrix
		 * @return {object} tiles {z: {x: {y: {tileInf}}}}
	 */
	findTiles (camWorld, camera, castMatrix) {
		var m = camWorld.worldMat4;
		if (camWorld && camWorld.castMatrix) {
			m.multiply(camWorld.castMatrix);
		}

		var eye = OsmUtils.rad2cart(camWorld.position.lon,
							camWorld.position.lat, R + camWorld.position.h);
		eye = [eye.x, eye.y, eye.z];

		var lookAt = OsmUtils.rad2cart(camWorld.target.lon, camWorld.target.lat,
							camWorld.target.h === undefined ? R : R + camWorld.target.h);
		lookAt= [lookAt.x, lookAt.y, lookAt.z];

		// var dir = Vec3.minus(Vec3.add([x, y, z], lookAt), eye);
		if (this.dirs === undefined) {
			this.dirs = ThreeWrapper.getRayDirs(camera, {w: 4, h: 3});
		}
		else {
			console.error('TODO')
		}

		for ( var ix = 0; ix < this.dirs.count; ix++ ) {
			var x = this.dirs.getX(ix);
			var y = this.dirs.getY(ix);
			var z = this.dirs.getZ(ix);

			// find tile by ray casting from eye to dir [x, y, z]
			// var dir = Vec3.minus(Vec3.add([x, y, z], lookAt), eye);
			var looks = [x, y, z];
			TilesKeeper.collectOsmTiles(this, looks, eye);
		}

		if (this.verbose >= 5) {
			console.log('osmTiles', this.tiles);
		}

		return this;
	}

	update (center) {
		if (center.lon && center.lat) {
			this.geoCenter = ceneter;
		}
		else {
			console.error("expecting center = {lon, lat, h(optinal)}, but get ",
							center)
			return
		}

		/*
		this.forEachTile((t, xyz) => {
			if (t.mesh === undefined) {
				t.mesh = new THREE.Mesh(t.geom(), blankMaterial);
				t.mesh.name = `${xyz[2]}-${xyz[0]}-${xyz[1]}`
				s3.scene.add(t.mesh);
				// this.tileskeepr.postMessage({cmd: 'osm', xyz: [xyz]});
				this.loasOsmAsync(xyz);
			}
		});
		*/
		this.loadOsmTilesAsync()
		// TODO purge
	}

	loadOsmTilesAsync () {
		var tz = this.tiles; // for short
		for (var z in tz)
			for (var x in tz[z])
				for (var t in tz[z][x]) {
					// fun(tz[z][x][y], [x, y, z]);
					if (t.mesh === undefined) {
						/*
						t.mesh = new THREE.Mesh(t.geom(), blankMaterial);
						t.mesh.name = `${xyz[2]}-${xyz[0]}-${xyz[1]}`
						s3.scene.add(t.mesh);
						// this.tileskeepr.postMessage({cmd: 'osm', xyz: [xyz]});
						this.loasOsmAsync(xyz);
						*/
						t.mesh = ThreeWrapper.createMesh(this.osm.center(), t, xyz)
						// s3.scene.add(t.mesh);
						this.osm.addTileMesh(t.mesh, xyz); // xyz here for test
					}
				}
	}

	/**If xyz is not in tiles, add new xyz to tiles.
	 * @param {tilesKeeper} tkeeper
	 * {z: {x0: {y00: world00, ...}, {x1: {y10: world10, ...}, ...}}}
	 * @param {vec3} dir [x, y, z] dir
	 * @param {vec3} c0 [x, y, z] center / eye
	 * @param {float} a radius
	 * @return {object} tiles
	 */
	static collectOsmTiles (tkeeper, dir, c0) {
		// dir = this.normalize(dir, [c0.x, c0.y, c0.z]);
		// dir = this.normalize(dir, c0);
		var p = OsmUtils.castPosition (c0, dir);
		if (p) {
			var longlat = OsmUtils.cart2rad(p);
			longlat.lon *= 180 / Math.PI;
			longlat.lat *= 180 / Math.PI;
			var osmz = OsmUtils.stepz(p.w, a);
			var xyz = {
				x: OsmUtils.long2tile(longlat.lon, osmz),
				y: OsmUtils.lat2tile(longlat.lat, osmz),
				z: osmz };

			if (OsmUtils.verbose >= 5) {
				console.log('dir, p, long-lat, xyz', dir, p, longlat, xyz);
			}

			tkeeper.setile(xyz, { lon: longlat.lon, lat: longlat.lat });
		}
		return tkeeper;
	}
}

export {TilesKeeper}

/**<h3>JS lib for showing, projecting osm tiles into 3D scene.</3>
 * <p> For OSM tiles, see <a href='https://wiki.openstreetmap.org/wiki/Zoom_levels'>
 * OSM XYZ</a></p>
 * <p> For Mercator Projection, see
 * <a href='https://en.wikipedia.org/wiki/Mercator_projection#Cylindrical_projections'>
 * wikipedia: Mercator Projection</a></p>
 *
 */

import * as THREE from 'three';

import {OsmUtils, Vec3, R} from './utils.js'
import {TilesKeeper} from './tiles-keeper.js'
import {XOrbitControls} from '../../packages/three/orbit-controls'

export const XMapControls = function ( object, domElement ) {
	OrbitControls.call( this, object, domElement );
	this.mouseButtons.LEFT = THREE.MOUSE.PAN;
	this.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;

	this.touches.ONE = THREE.TOUCH.PAN;
	this.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
};

XMapControls.prototype = Object.create( THREE.EventDispatcher.prototype );
XMapControls.prototype.constructor = XMapControls;

/**Api to manage tiles and 3d geojson objects.
 * @param {canvas} canvas dom element created by THREE.WebGLRenderer()
 * @param {object} options<br>
 * options.position {lon, lat} map center
 * options.lookat {lon, lat, h},
 * options.campos {lon, lat, h}
 * @class
 */
export class OSM3 {
	/**This will create OSM3.s3, manage camera, controls, gis-center.
	 * @param {object} options (optional)<br>
	 * options.lookAt {lon, lat, h},
	 * options.campos {lon, lat, h},
	 * options.cavas {canvas} [optional] <a href='https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas'>html5 cavas</a>
	 * options.verbose {int} [optional] verbose levle
	 */
	constructor(options) {
		options = Object.assign({}, options);
		this.verbose = options.verbose || 5;
		this.opts = {
			divId: 'map',
			control: undefined, //new THREE.MapControls(),
			// position: Object.assign({lon: 104.09856, lat: 30.6765, h: 20}, options.campos),
			// lookAt: Object.assign({lon: 104.09856, lat: 30.6865, h: 0}, options.position),
			position: {lon: 104.09856, lat: 30.6765},	// center
			// camera pos {lon, lat, h}, default is position wiht h = 30
			lookAt: new THREE.Vector3(),
			camera: {fov: 50, near: 0.1, far: 50000},
			uniforms: {
				iTime: { value: 0 },
				iResolution:  { value: new THREE.Vector3() },
				iMouse: {value: new THREE.Vector2()},
			},
			pointMaterial: new THREE.PointsMaterial( { color: 0xffffff, size: 10 } )
		};
		this.opts.position = Object.assign(this.opts.position, options.position);

		var p = Object.assign(this.opts.lookAt,
							options.position);
		var lookAt = OsmUtils.rad2cart(p.lon, p.lat, R);
		this.opts.lookAt = new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z);
		var camp = Object.assign({h: 30}, options.campos);

		if (options) {
			Object.assign(this.opts.uniforms, options.uniforms);
		}

		var campos = OsmUtils.rad2cart(camp.lon, camp.lat, R + camp.h);
		this.s3 = {campos};

		var scene = new THREE.Scene();
		scene.background = new THREE.Color( 0x000104 );
		var camera = new THREE.PerspectiveCamera( this.opts.camera.fov,
							window.innerWidth / window.innerHeight,
							this.opts.camera.near, this.opts.camera.far );
		camera.position.set( campos.x, campos.y, campos.z );
		camera.lookAt( this.opts.lookAt );

		var renderer = new THREE.WebGLRenderer( {
								antialias: true,
							 	canvas: options.canvas} );
		var container = renderer.domElement;
		this.s3.container = container;
		document.body.appendChild( container );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );

		// call this only in static scenes (i.e., if there is no animation loop)
		var controls = new XMapControls( camera, renderer.domElement );
		{
			controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
			controls.dampingFactor = 0.05;
			controls.screenSpacePanning = false;
			controls.minDistance = 100;
			controls.maxDistance = 500;
			controls.maxPolarAngle = Math.PI / 2;

			this.s3.scene = scene;
			this.s3.camera = camera;
			this.s3.renderer = renderer;
			this.s3.controls = controls;
			this.s3.render = function(s3, opts, time) {
			    time *= 0.001;  // convert to seconds
				opts.uniforms.iTime.value = time;
				s3.controls.update();
				// only required if controls.enableDamping = true, or if controls.autoRotate = true
				s3.renderer.render( s3.scene, s3.camera );
			}
		}

		window.addEventListener( 'resize', (e) => this.onResize(this.s3), false );

		// testOsm(osm);
		this.tileskeepr = this.startOsm(this.s3, this.opts);

		// random buildings
		// addRandomesh(scene, 20, this.tileskeepr.viewCenter);

		// lights
		var light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( 100, 100, 100 );
		scene.add( light );
		var light = new THREE.DirectionalLight( 0x002288 );
		light.position.set( -100, -100, -100 );
		scene.add( light );
		var light = new THREE.AmbientLight( 0x222222 );
		scene.add( light );
	}

	/**Convert geojson path to world mesh.
	 * @param {array} jsonMesh mesh (path?) from geojson, in lon-lat tuple.
	 * @param {boolean} wireframe using wireframe material?
	 * @return {THREE.Mesh} segment mash or wireframe mesh
	 */
	geoMesh (jsonMesh, wireframe) {
		// https://threejs.org/docs/#api/en/extras/core/Shape
		var shape = new THREE.Shape();

		jsonMesh[0].forEach(function(p, ix) {
			xy = worldxy(p);
			if (ix === 0) {
				shape.moveTo( xy[0], xy[1] );
			}
			else {
				shape.lineTo( xy[0], xy[1] );
			}
		});

		var extrudeSettings = { depth: .1, curveSegments: 1, bevelEnabled: false };
		var geop = new THREE.ExtrudeGeometry( shape, extrudeSettings );
		geop.translate(0, 0, 15.);
		extrudeSettings = { depth: 15, curveSegments: 1, bevelEnabled: false };
		var geom = new THREE.ExtrudeGeometry( shape, extrudeSettings );

		geom.computeBoundingSphere();

		var mesh;

		var geo = new THREE.EdgesGeometry( geop ); // or WireframeGeometry
		var mat = new THREE.LineBasicMaterial( { color: 0x003f00, linewidth: 1 } );

		if (wireframe) {
			var wire = new THREE.Mesh( geom,
				new THREE.MeshBasicMaterial( {
					color: 0x222080,
					wireframe: true,
					opacity: 0.2 } ));

			var vertexNormalsHelper = new THREE.VertexNormalsHelper( wire, 1 );
			wire.add( vertexNormalsHelper );

			mesh = wire;
		}
		else {
			var material = new THREE.ShaderMaterial( {
				fragmentShader,
				vertexShader,
				uniforms: opts.uniforms,
				opacity: 0.7 } );
			material.transparent = true;

			var m = new THREE.Mesh( geom, material );
			mesh = m;
		}

		mesh.add( new THREE.LineSegments( geo, mat ));

		return mesh;
	}

	onResize (s3) {
		// var container = document.querySelector( '#' + opts.divId );
		var container = s3.renderer.domElement;
		var w = window.clientWidth;
		var h = window.clientHeight;

		s3.camera.aspect = w / h;
		s3.camera.updateProjectionMatrix();
		// camera.lookAt( scene.position );
		s3.renderer.setSize( w, h );
	}

	render (time) {
		osm3.s3.render(osm3.s3, osm3.opts, time);
	 	requestAnimationFrame( osm3.render );
	}

	startOsm (s3, opts) {
		if (this.tileskeepr === undefined) {
			this.tileskeepr = new TilesKeeper(s3, "../lib/osm/tiles-worker.js"); // O3_workerPath
		}

		// start tileskeepr.worker
		this.tileskeepr.ping(0);

		// error: findTiles should been method of osm3
		this.tileskeepr.findTiles({
					target: opts.position,
					position: { lat: opts.position.lat - 0.2,
								lon: opts.position.lon, h: 10 },
					z: 16 },
				s3.camera,
				opts.castMatrix )
			// loading osm tile texture asynchronously
			.update();

		if (OSM3.verbose >= 5) console.log(this.tileskeepr.tiles);

		return this.tileskeepr;
	}
}

export * from 'three-orbitcontrols'

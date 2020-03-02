/** @module xv.ecs.sys.ext */

import * as THREE from 'three'

import * as ECS from '../../../packages/ecs-js/index'
import {XSys} from '../xsys'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {UnrealBloomPass} from  '../../../packages/three/postprocessing/UnrealBloomPass'
import { LayerFilter, FlowingPath, GlowingEdge, Filming } from '../../component/ext/effects'

/**
 * @class
 */
export default class OccludePass extends XSys {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;

		if (x.options.background instanceof THREE.Material)
			occludingMat.background = options.background;
		else if (x.options.background)
			console.warn(`Before ${x.ver} OccludePass background can only support parameter of Material.`);

		this.layers = [];
		this.effects(x);
	}

	update(tick, entities) {
		scene.traverse( darkenNonBloomed );
		// bloomComposer.render();
		this.composer.render(); // FIXME x.lastUpdate ?
		scene.traverse( restoreMaterial );
	}

	effects(x) {
		var camera = x.xcam.XCamera.cam;
		// var wh = x.options.canvasize;
		var composer = new EffectComposer( x.renderer );

		var renderPass = new RenderPass( x.scene, camera );
		composer.addPass( renderPass );

		// check through queried entities,add some Effect Pass here
		// outlinePass = new OutlinePass( new THREE.Vector2( wh[0], wh[1] ), scene, camera );
		// composer.addPass( outlinePass );

		// FIXME any idea of orthogonal effects?
		var flowings = ecs.queryEntities({any: ['FlowingPath']});
		if (flowings.length > 0) {
			var bloomPass = new UnrealBloomPass( new THREE.Vector2(wh[0], wh[1]), 1.5, 0.4, 0.85 );
			bloomPass.threshold = 0.0;
			bloomPass.strength = 10;
			bloomPass.radius = 0.5;
			composer.addPass(bloomPass);
			this.layers.push(LayerFilter.FLOWING_PATH);

			// x.world.registerComponents(ecs, {FlowingPath});

			for (var e of flowings) {
				// mesh.layers?
				e.Obj3.layer |= 1 << LayerFilter.FLOWING_PATH;
			}
		}

		var filmings = ecs.queryEntities( {any: ['Filming']} );
		if (filmings.length > 0) {
			const filmPass = new FilmPass(
				0.35,   // noise intensity
				0.025,  // scanline intensity
				200,    // scanline count
				false); // grayscale
			// x.world.registerComponents(ecs, {FlowingPath});
			// filmPass.renderToScreen = true;
			composer.addPass(filmPass);
			for (var e of flowings) {
				e.Obj3.layer |= 1 << LayerFilter.FILMING;
			}
		}

		this.composer = composer;
	}
}

OccludePass.query = {any: ['FlowingPath', 'GlowingEdge', 'Filming']};

const occludingMat = {
	background: new THREE.MeshBasicMaterial( { color: "black" } ),
};

const occludeMaterials = new Set();

function darkenNonBloomed( obj ) {
	if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
		occludeMaterials[ obj.uuid ] = obj.material;
		obj.material = occludingMat.background;
	}
}

function restoreMaterial( obj ) {
	if ( occludeMaterials[ obj.uuid ] ) {
		obj.material = occludeMaterials.delete( obj.uuid );
		// delete materials[ obj.uuid ];
	}
}

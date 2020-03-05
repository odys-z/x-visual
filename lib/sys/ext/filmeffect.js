/** @module xv.ecs.sys.ext */

import * as ECS from '../../../packages/ecs-js/index'
import XSys from '../xsys'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {UnrealBloomPass} from  '../../../packages/three/postprocessing/UnrealBloomPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'
import { LayerFilter, FlowingPath, GlowingEdge, Filming } from '../../component/ext/effects'

/**
 * @class
 */
export default class FilmEffect extends OrthoPass {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;

		if (x.options.background instanceof THREE.Material)
			occludingMat.background = options.background;
		else if (x.options.background)
			console.warn(`Before ${x.ver} OccludePass background can only support parameter of Material.`);

		this.layers = [];
		this.scene = x.scene;
		this.effects(x);
	}

	// update(tick, entities) {
	// 	this.scene.traverse( darkenOccluded );
	// 	this.composer.render();
	// }

	effects(x) {
		var camera = x.xcam.XCamera.cam;
		var composer = x.composer || new EffectComposer( x.renderer );
		var renderPass = new RenderPass( x.scene, camera );
		composer.addPass( renderPass );

		const filmPass = new FilmPass(
			1.35,   // noise intensity
			0.725,  // scanline intensity
			400,    // scanline count
			false); // grayscale
		composer.addPass(filmPass);
		for (var e of flowings) {
			e.Obj3.layer |= 1 << LayerFilter.FILMING;
		}
	}
}

OccludePass.query = {any: ['Filming']};

// const occludingMat = {
// 	background: new THREE.MeshBasicMaterial( { color: "black" } ),
// };
//
// const occludeMaterials = new Set();
// const passLayers = new THREE.Layers();
//
// function darkenOccluded( obj ) {
// 	if ( obj.isMesh && passLayers.test( obj.layers ) === false ) {
// 		occludeMaterials[ obj.uuid ] = obj.material;
// 		obj.material = occludingMat.background;
// 	}
// }
//
// function restoreMaterial( obj ) {
// 	if ( occludeMaterials[ obj.uuid ] ) {
// 		obj.material = occludeMaterials.delete( obj.uuid );
// 		// delete materials[ obj.uuid ];
// 	}
// }

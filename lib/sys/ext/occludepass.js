/** @module xv.ecs.sys.ext */

import * as THREE from 'three'

import * as ECS from '../../../packages/ecs-js/index'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {UnrealBloomPass} from  '../../../packages/three/postprocessing/UnrealBloomPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'
import { LayerFilter, FlowingPath, GlowingEdge, Filming } from '../../component/ext/effects'

import XSys from '../xsys'
import OrthoPass from './orthopass'

/**
 * @class
 */
export default class OccludePass extends OrthoPass {
	constructor(ecs, x) {
		super(ecs, x);
		this.ecs = ecs;

		if (x.options.background instanceof THREE.Material)
			occludingMat.background = options.background;
		else if (x.options.background)
			console.warn(`Before ${x.ver} OccludePass background can only support parameter of Material.`);

		// this.layers = [];
		// this.scene = x.scene;
		// this.effects(x);
	}

	// update(tick, entities) {
	// 	super.beginUpdate(tick, entities);
	// 	// this.scene.traverse( darkenOccluded );
	// 	// bloomComposer.render();
	// 	this.composer.render();
	// 	// this.scene.traverse( restoreMaterial );
	// 	super.endUpdate(tick, entities);
	// }

	getEffectPass(ecs, x) {
		// var camera = x.xcam.XCamera.cam;
		// var composer = x.composer || new EffectComposer( x.renderer );
		// var renderPass = new RenderPass( x.scene, camera );
		// composer.addPass( renderPass );

		// create an orthogonal effects?
		let bloomPass, filmPass;
		var flowings = ecs.queryEntities({any: ['FlowingPath']});
		if (flowings.size > 0) {
			var wh = x.options.canvasize;
			bloomPass = new UnrealBloomPass( new THREE.Vector2(wh[0], wh[1]), 1.5, 0.4, 0.85 );
			bloomPass.threshold = 0.0;
			bloomPass.strength = 10;
			bloomPass.radius = 0.25;
			// composer.addPass(bloomPass);
			// passLayers.set(LayerFilter.FLOWING_PATH);

			for (var e of flowings) {
				// mesh.layers?
				// e.Obj3.layer |= 1 << LayerFilter.FLOWING_PATH;
			}
		}

		var filmings = ecs.queryEntities( {any: ['Filming']} );
		if (filmings.size > 0) {
			filmPass = new FilmPass(
				1.35,   // noise intensity
				0.725,  // scanline intensity
				400,    // scanline count
				false); // grayscale
			// composer.addPass(filmPass);
			for (var e of flowings) {
				// e.Obj3.layer |= 1 << LayerFilter.FILMING;
			}
		}

		// this.composer = composer;
		// x.composer = composer;
		return [bloomPass, filmPass];
	}

}

OccludePass.query = {any: ['FlowingPath', 'GlowingEdge', 'Filming']};

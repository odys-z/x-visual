/** @module xv.ecs.sys.ext */

import * as ECS from '../../../packages/ecs-js/index'
import XSys from '../xsys'
import { EffectComposer } from  '../../../packages/three/postprocessing/EffectComposer'
import { RenderPass } from  '../../../packages/three/postprocessing/RenderPass'
import { UnrealBloomPass } from  '../../../packages/three/postprocessing/UnrealBloomPass'
import { FilmPass } from  '../../../packages/three/postprocessing/FilmPass'

import { FlowingPath, Glow, Filming } from '../../component/ext/effects'
import { LayerChannel, Layers } from '../../xmath/layer'
import Orthocclude from './orthocclude'

/**
 * @class
 */
export default class FilmEffect extends Orthocclude {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;

		this.layers = [];
		this.scene = x.scene;
		this.effects(x);
	}

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
			e.Obj3.layer |= 1 << LayerChannel.FILMING;
		}
	}
}

FilmEffect.query = {any: ['Filming']};

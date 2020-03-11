/** @namespace xv.ecs.sys.ext */

import * as ECS from '../../../packages/ecs-js/index'
import { EffectComposer } from  '../../../packages/three/postprocessing/EffectComposer'
import { RenderPass } from  '../../../packages/three/postprocessing/RenderPass'
import { UnrealBloomPass } from  '../../../packages/three/postprocessing/UnrealBloomPass'

import XSys from '../xsys'
import Orthocclude from './orthocclude'
import { FilmPass } from  '../../../packages/three/postprocessing/FilmPass'
import { FlowingPath, Glow, Filming } from '../../component/ext/effects'
import { LayerChannel, Layers } from '../../xmath/layer'

/**
 * @class
 */
export default class GlowEffect extends Orthocclude {
	constructor(ecs, x) {
		super(ecs, x);
		this.ecs = ecs;
	}

	getEffectPass(ecs, x) {
		var camera = x.xcam.XCamera.cam;
		var composer = x.composer || new EffectComposer( x.renderer );
		var renderPass = new RenderPass( x.scene, camera );
		composer.addPass( renderPass );

		const glowPass = new GlowPass(
			1.35,   // noise intensity
			0.725,  // scanline intensity
			400,    // scanline count
			false); // grayscale
		composer.addPass(glowPass);
		for (var e of flowings) {
			e.Obj3.layers |= 1 << LayerChannel.GLOW;
		}
	}
}

GlowEffect.query = {any: ['Glow']};

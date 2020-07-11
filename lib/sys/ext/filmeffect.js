
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
 * @class FilmEffect
 */
export default class FilmEffect extends Orthocclude {
	constructor(ecs, x) {
		super(ecs, x);
		this.ecs = ecs;
	}

	getEffectPass(ecs, x) {
		var filmings = ecs.queryEntities( {any: ['Filming', 'Occluder']} );
		if (filmings.size > 0) {
			var camera = x.xcam.XCamera.cam;
			// var composer = x.composer || new EffectComposer( x.renderer );
			var renderPass = new RenderPass( x.scene, camera );
			// composer.addPass( renderPass );

			const filmPass = new FilmPass(
				1.35,   // noise intensity
				3.125,  // scanline intensity
				100,    // scanline count
				false); // grayscale
			// composer.addPass(filmPass);
			filmPass.renderToScreen = false;

			var layers = new Layers();
			layers.enable( LayerChannel.FILMING );

			for (var e of filmings) {
				e.Obj3.layers |= 1 << LayerChannel.FILMING;
			}
			var effects = [renderPass, filmPass];
			return {effects, layers};
		}
		else return {};
	}
}

FilmEffect.query = {any: ['Filming']};

import * as ECS from '../../../packages/ecs-js/index'
import {Material, Vector2} from 'three'
import { EffectComposer } from  '../../../packages/three/postprocessing/EffectComposer'
import { RenderPass } from  '../../../packages/three/postprocessing/RenderPass'
import { UnrealBloomPass } from  '../../../packages/three/postprocessing/UnrealBloomPass'

import XSys from '../xsys'
import Orthocclude from './orthocclude'
import { FlowingPath, Glow, Filming } from '../../component/ext/effects'
import { LayerChannel, Layers } from '../../xmath/layer'

/**
 * @class GlowEffect
 */
export default class GlowEffect extends Orthocclude {
	constructor(ecs, x) {
		super(ecs, x);
		this.ecs = ecs;
	}

	getEffectPass(ecs, x) {
		var glowings = ecs.queryEntities( {any: ['Glow', 'Occluder']} );
		if (glowings.size > 0) {
			var camera = x.xcam.XCamera.cam;
			// var composer = x.composer || new EffectComposer( x.renderer );
			var renderPass = new RenderPass( x.scene, camera );

			var layers = new Layers();
			layers.enable(LayerChannel.GLOW);

			var wh = x.options.canvasize || [800, 400];

			var {threshold, strength, radius} = Object.assign(
								{threshold: .1, strength: 2, radius: 0.25},
								x.options.Glow);
			var bloomPass = new UnrealBloomPass( new Vector2(wh[0], wh[1]),
								// 1.5, 0.4, 0.85 );
								strength, radius, threshold);
				// bloomPass.threshold = 0.0;
				// bloomPass.strength = 4;
				// bloomPass.radius = 0.25;
				bloomPass.renderToScreen = false;

			for (var e of glowings) {
				e.Obj3.layers |= 1 << LayerChannel.GLOW;
			}
			var effects = [renderPass, bloomPass];
			return {effects, layers};
		}
		else return {};
	}
}

GlowEffect.query = {any: ['Glow']};

import * as ECS from '../../../packages/ecs-js/index'
import {Material, Vector2} from 'three'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'

import {LayerChannel, Layers} from '../../xmath/layer'
import {XError, ramTexture} from '../../xutils/xcommon'
import XSys from '../xsys'
import {UnrealBloomPass} from  '../../../packages/three/postprocessing/UnrealBloomPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'
import {FlowingPath, Glow, Filming} from '../../component/ext/effects'
import Orthocclude from './orthocclude'

/**
 * Channel: {@link LayerChannel}.FLOWING_PATH.
 * @class PathEffect
 */
export default class PathEffect extends Orthocclude {
	constructor(ecs, x) {
		super(ecs, x);
		this.ecs = ecs;

		// if (x.options.background instanceof Material)
		// 	occludingMat.background = x.options.background;
		// else if (x.options.background)
		// 	console.warn(`Before ${x.ver} PathEffect background can only be THREE.Material.`);
		// else occludingMat.background = new THREE.MeshBasicMaterial({
		// 			opacity: 1.0,
		// 			// map: new THREE.CanvasTexture(document.getElementById(e.Canvas.domId)),
		// 			map: ramTexture(1, 1, {color: 0x000000ff}),
		// 			transparent: true,
		// 			side: THREE.DoubleSide,
		// 		});
	}

	/**Get effect passes. Called by super class {@link Orthocclude}
	 * @param {ECS} ecs
	 * @param {object} x TODO options<br>
	 * options.glow: glow parameters<br>
	 * options.bloom: bloom parameters.<br>
	 * See <a href='https://threejs.org/examples/?q=postprocessing#webgl_postprocessing_unreal_bloom'>Glow Example</a>.<br>
	 * options.film: filem parameters
	 * @return {object} {effects, layers}, where<br>
	 * effects: [renderPass, bloomPass, filmPass]<br>
	 * layers: {@link Layers} visible through channel {@link LayerChannel}.FLOWING_PATH.
	 */
	getEffectPass(ecs, x) {
		// create an orthogonal effect
		var flowings = ecs.queryEntities({any: ['FlowingPath', 'Occluder']});
		if (flowings.size > 0) {
			var layers = new Layers();
			layers.enable(LayerChannel.FLOWING_PATH);

			var bloomPass, filmPass;
			var wh = x.options.canvasize || [800, 400];
			bloomPass = new UnrealBloomPass( new Vector2(wh[0], wh[1]), 1.5, 0.4, 0.85 );
				bloomPass.threshold = 0.0;
				bloomPass.strength = 6;
				bloomPass.radius = 0.25;
				bloomPass.renderToScreen = false;

			filmPass = new FilmPass(
				1.35,   // noise intensity
				0.125,  // scanline intensity
				800,    // scanline count
				false); // grayscale
			filmPass.renderToScreen = false;

			for (var e of flowings) {
				if (e.Occluder && e.Occluder.FlowingPath)
					e.Obj3.occluding |= 1 << LayerChannel.FLOWING_PATH ;
				//	e.Obj3.layers |= 1 << LayerChannel.FLOWING_PATH ;
				e.Obj3.layers |= 1 << LayerChannel.FLOWING_PATH ;

				// e.Obj3.mesh.layers.enable(LayerChannel.FLOWING_PATH);
			}

			var renderPass = new RenderPass( x.scene, x.xcam.XCamera.cam );
			var effects = [renderPass, bloomPass, filmPass];
			return {effects, layers};
		}
		else return {};
	}
}

PathEffect.query = {any: ['FlowingPath', 'Glow', 'Occluder']};

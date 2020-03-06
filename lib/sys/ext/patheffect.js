/** @module xv.ecs.sys.ext */

import * as ECS from '../../../packages/ecs-js/index'
import {Material, Vector2} from 'three'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {UnrealBloomPass} from  '../../../packages/three/postprocessing/UnrealBloomPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'
import {FlowingPath, GlowingEdge, Filming} from '../../component/ext/effects'

import {LayerFilter, Layers} from '../../xmath/layer'
import XSys from '../xsys'
import Orthocclude from './orthocclude'

/**
 * @class
 */
export default class PathEffect extends Orthocclude {
	constructor(ecs, x) {
		super(ecs, x);
		this.ecs = ecs;

		if (x.options.background instanceof Material)
			occludingMat.background = options.background;
		else if (x.options.background)
			console.warn(`Before ${x.ver} PathEffect background can only be THREE.Material.`);

		// this.layers = [];
		// this.scene = x.scene;
		// this.effects(x);
	}

	getEffectPass(ecs, x, layers) {
		// create an orthogonal effect
		let bloomPass, filmPass;
		var flowings = ecs.queryEntities({any: ['FlowingPath']});
		if (flowings.size > 0) {
			layers.enable(LayerFilter.FLOWING_PATH);
			var wh = x.options.canvasize;
			bloomPass = new UnrealBloomPass( new Vector2(wh[0], wh[1]), 1.5, 0.4, 0.85 );
			bloomPass.threshold = 0.0;
			bloomPass.strength = 10;
			bloomPass.radius = 0.25;
			// passLayers.set(LayerFilter.FLOWING_PATH);

			for (var e of flowings) {
				// mesh.layers?
				e.Obj3.layers |= 1 << LayerFilter.FLOWING_PATH;
			}
		}

		var filmings = ecs.queryEntities( {any: ['Filming']} );
		if (filmings.size > 0) {
			layers.enable(LayerFilter.FLOWING_PATH);
			filmPass = new FilmPass(
				1.35,   // noise intensity
				0.725,  // scanline intensity
				400,    // scanline count
				false); // grayscale
			for (var e of flowings) {
				e.Obj3.layers |= 1 << LayerFilter.FILMING;
			}
		}
		return [bloomPass, filmPass];
	}
}

PathEffect.query = {any: ['FlowingPath', 'GlowingEdge']};

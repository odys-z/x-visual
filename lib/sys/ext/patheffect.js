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

	getEffectPass(ecs, x) {
		// create an orthogonal effect
		let bloomPass, filmPass;
		var layers = new Layers();
		var flowings = ecs.queryEntities({any: ['FlowingPath', 'Occluder']});
		if (flowings.size > 0) {
			layers.enable(LayerFilter.FLOWING_PATH);
			var wh = x.options.canvasize;
			bloomPass = new UnrealBloomPass( new Vector2(wh[0], wh[1]), 1.5, 0.4, 0.85 );
			bloomPass.threshold = 0.0;
			bloomPass.strength = 10;
			bloomPass.radius = 0.25;
			bloomPass.renderToScreen = false;
			// passLayers.set(LayerFilter.FLOWING_PATH);

			for (var e of flowings) {
				if (e.Occluder && e.Occluder.occlude && e.Occluder.occlude.FlowingPath)
					e.Obj3.occluding |= 1 << LayerFilter.FLOWING_PATH ;
				else
					e.Obj3.layers |= 1 << LayerFilter.FLOWING_PATH ;

				e.Obj3.mesh.layers.enable(LayerFilter.FLOWING_PATH);
			}
		}

		var filmings = ecs.queryEntities( {any: ['Filming', 'Occluder']} );
		if (filmings.size > 0) {
			layers.enable(LayerFilter.FLOWING_PATH);
			filmPass = new FilmPass(
				1.35,   // noise intensity
				0.725,  // scanline intensity
				200,    // scanline count
				false); // grayscale
			filmPass.renderToScreen = false;
			for (var e of flowings) {
				if (e.Occluder && e.Occluder.occlude && e.Occluder.occlude.Filming)
					e.Obj3.occluding |= 1 << LayerFilter.FILMING;
				else
					e.Obj3.layers |= 1 << LayerFilter.FILMING;

				e.Obj3.mesh.layers.enable(LayerFilter.FILMING);
			}
		}

		if (bloomPass || filmPass) {
			var renderPass = new RenderPass( x.scene, x.xcam.XCamera.cam );
			var effects = bloomPass ? [renderPass, bloomPass, filmPass] : [renderPass, filmPass];
			return {effects, layers};
		}
		else return [];
	}
}

PathEffect.query = {any: ['FlowingPath', 'GlowingEdge', 'Occluder']};

/** @module xv.ecs.sys.ext */

// import * as THREE from 'three'
import {Material, MeshBasicMaterial} from 'three'

import * as ECS from '../../../packages/ecs-js/index'
import {LayerFilter, Layers} from '../../xmath/layer'
import XSys from '../xsys'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {UnrealBloomPass} from  '../../../packages/three/postprocessing/UnrealBloomPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'
import {FlowingPath, GlowingEdge, Filming} from '../../component/ext/effects'

/**
 * Base class or orthogonal effects, occluding objects with Obj3.layers.
 * @class abstract
 */
export default class Orthocclude extends XSys {
	constructor(ecs, x) {
		super(ecs, x);
		this.ecs = ecs;

		// https://stackoverflow.com/questions/29480569/does-ecmascript-6-have-a-convention-for-abstract-classes/30560792
		if (new.target === Orthocclude) {
			throw new TypeError("Cannot construct abstract instances of OthroPass directly.");
		}
		if (typeof this.getEffectPass !== "function") {
			throw new TypeError("Subclass of Orthocclude must override method getEffectPass()");
		}

		if (x.options.background instanceof Material)
			occludingMat.background = options.background;
		else if (x.options.background)
			console.warn(`Before ${x.ver} occluding background can only be a Material object.`);
		else
			this.occludeMaterials = new Set();

		this.passLayers = new Layers();
		this.layers = [];
		this.scene = x.scene;

		var camera = x.xcam.XCamera.cam;
		var composer = x.composer || new EffectComposer( x.renderer );
		var effects = this.getEffectPass(ecs, x, this.passLayers);
		if (effects) {
			for (var ef of effects)
				composer.addPass( ef );
		}
		this.composer = composer;
		x.composer = composer; // FinalComposer needs this

		this.darkens = [];
	}

	update (tick, entities) {
		// occlude
		for (var e of entities) {
			if ( !this.passLayers.visible( e.Obj3.layers )) {
				this.occludeMaterials[ e.id ] = e.Obj3.mesh.map;
				e.Obj3.mesh.map = occludingMat.background;
			}
			this.darkens.push(e);
		}

		this.composer.render();

		// restore
		for (var e of this.darkens) {
			e.Obj3.mesh.map = this.occludeMaterials.delete( e.id );
		}
		this.darkens.splice(0, this.darkens.length);
	}
}

const occludingMat = {
	background: new MeshBasicMaterial( { color: "black" } ),
};

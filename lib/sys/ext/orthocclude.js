/** @namespace xv.ecs.sys.ext */

// import * as THREE from 'three'
import {Material, MeshBasicMaterial} from 'three'

import * as ECS from '../../../packages/ecs-js/index'
import {LayerChannel, Layers} from '../../xmath/layer'
import XSys from '../xsys'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {UnrealBloomPass} from  '../../../packages/three/postprocessing/UnrealBloomPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'
import {FlowingPath, Glow, Filming} from '../../component/ext/effects'

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

		this.scene = x.scene;

		var {effects, layers} = this.getEffectPass(ecs, x);
		if (x.renderer) {
			var composer = new EffectComposer( x.renderer );
			if (effects) {
				for (var ef of effects)
					composer.addPass( ef );
			}
			composer.renderToScreen = false; // via final composer

			if (x.composer)
				x.composer.push(composer);
			else x.composer = [composer];

			this.composer = composer;
		}
		// else testing?
		this.passLayers = layers !== undefined ? layers : LayerChannel.ALL;
		this.darkens = [];
		this.visibles = [];
		this.camera = x.xcam.XCamera.cam;
	}

	update (tick, entities) {
		// occlude
		for (var e of entities) {
			if ( this.passLayers.occlude( e.Obj3.occluding )) {
				this.occludeMaterials[ e.id ] = e.Obj3.mesh.map;
				e.Obj3.mesh.map = occludingMat.background;
				e.Obj3.mesh.layers.push( e.Obj3.occluding );

				this.darkens.push(e);
			}
			else if (this.passLayers.visible( e.Obj3.layers )) {
				e.Obj3.mesh.layers.push( e.Obj3.layers );
				this.visibles.push(e);
			}
		}

		this.camera.layers.push(this.passLayers.mask);
		if (this.composer) // in case of testing
			this.composer.render();
		this.camera.layers.pop();

		// restore
		for (var e of this.darkens) {
			e.Obj3.mesh.map = this.occludeMaterials.delete( e.id );
			e.Obj3.mesh.layers.pop();
		}
		this.darkens.splice(0, this.darkens.length);

		for (var e of this.visibles) {
			e.Obj3.mesh.layers.pop();
		}
		this.visibles.splice(0, this.darkens.length);
	}
}

const occludingMat = {
	background: new MeshBasicMaterial( { color: "black" } ),
};

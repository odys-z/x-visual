/** @module xv.ecs.sys.ext */

import * as THREE from 'three'

import * as ECS from '../../../packages/ecs-js/index'
import XSys from '../xsys'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {UnrealBloomPass} from  '../../../packages/three/postprocessing/UnrealBloomPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'
import { LayerFilter, FlowingPath, GlowingEdge, Filming } from '../../component/ext/effects'

/**
 * abstract class
 * https://stackoverflow.com/questions/29480569/does-ecmascript-6-have-a-convention-for-abstract-classes/30560792
 * @class
 */
export default class OrthoPass extends XSys {
	constructor(ecs, x) {
		super(ecs, x);
		this.ecs = ecs;

		if (new.target === OrthoPass) {
			throw new TypeError("Cannot construct Abstract instances of OthroPass directly.");
		}
		if (typeof this.getEffectPass !== "function") {
			throw new TypeError("Must override method getEffectPass()");
		}
		// if (typeof this.update !== "function") {
		// 	throw new TypeError("Must override method update()");
		// }

		if (x.options.background instanceof THREE.Material)
			occludingMat.background = options.background;
		else if (x.options.background)
			console.warn(`Before ${x.ver} occluding background can only be a Material object.`);
		else
			this.occludeMaterials = new Set();

		this.restoreMaterial = function (him) {
			var occludeMaterials = him.occludeMaterials;
			return (obj) => {
				if ( occludeMaterials[ obj.uuid ] ) {
					obj.material = occludeMaterials.delete( obj.uuid );
				}
			};
		}(this);

		this.darkenOccluded = function (him) {
			var occludeMaterials = him.occludeMaterials;
			return (obj) => {
				if ( obj.isMesh && passLayers.test( obj.layers ) === false ) {
					occludeMaterials[ obj.uuid ] = obj.material;
					obj.material = occludingMat.background;
				}
			}
		}(this);

		// this.passLayers = new THREE.Layers();
		this.layers = [];
		this.scene = x.scene;

		var camera = x.xcam.XCamera.cam;
		var composer = x.composer || new EffectComposer( x.renderer );
		var renderPass = new RenderPass( x.scene, camera );
		composer.addPass( renderPass );
		var effects = this.getEffectPass(ecs, x);
		if (effects) {
			for (var ef of effects)
				composer.addPass( ef );
		}
		this.composer = composer;
		x.composer = composer; // FinalComposer needs this

	}

	render (tick, entities) {
		this.scene.traverse( this.darkenOccluded );
		this.composer.render();
		this.scene.traverse( this.restoreMaterial );
	}

	// darkenOccluded( obj ) {
	// 	if ( obj.isMesh && passLayers.test( obj.layers ) === false ) {
	// 		this.occludeMaterials[ obj.uuid ] = obj.material;
	// 		obj.material = occludingMat.background;
	// 	}
	// }

	// restoreMaterial( obj ) {
	// 	if ( this.occludeMaterials[ obj.uuid ] ) {
	// 		obj.material = this.occludeMaterials.delete( obj.uuid );
	// 	}
	// }
}

const occludingMat = {
	background: new THREE.MeshBasicMaterial( { color: "black" } ),
};

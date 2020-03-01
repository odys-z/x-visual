/** @module xv.ecs.sys.ext */

import * as ECS from '../../../packages/ecs-js/index';
import {UnrealPassPass} from  '../../packages/three/postprocessing/UnrealPassPass';

/**
 * @class
 */
export default class OccludePass extends ECS.System {
	// get composer() {
	// 	return this._composer;
	// }

	constructor(ecs, x, options) {
		super(ecs);
		this.ecs = ecs;

		this.layers = [];
		if (options.outline)
			this.effects(x.xscene, x.XCamera.cam, x.renderer, x.options.canvasize);
	}

	update(tick, entities) {
		scene.traverse( darkenNonBloomed );
		bloomComposer.render();
		scene.traverse( restoreMaterial );
	}

	effects(scene, camera, renderer, wh) {
		var composer = new EffectComposer( renderer );

		var renderPass = new RenderPass( scene, camera );
		composer.addPass( renderPass );

		// check through queried entities,add some Effect Pass here
		// outlinePass = new OutlinePass( new THREE.Vector2( wh[0], wh[1] ), scene, camera );
		// composer.addPass( outlinePass );

		// FIXME any idea of orthogonal effects?
		var flowings = ecs.queryEntities({any: ['FlowingPath']});
		if (flowings.length > 0) {
			var bloomPass = new UnrealBloomPass( new THREE.Vector2(wh[0], wh[1]), 1.5, 0.4, 0.85 );
			bloomPass.threshold = 0.0;
			bloomPass.strength = 10;
			bloomPass.radius = 0.5;
			composer.addPass(bloomPass);
			this.layers.push(LayerFilter.FLOWING_PATH);
		}

		for (var e of flowings) {
			// mesh.layers?
			e.Obj3.layer |= 1 << LayerFilter.FLOWING_PATH;
		}

		this.composer = composer;
	}
}

OccludePass.query = {any: ['FlowingPath', 'GlowingEdge', 'Filming']};

const occludeMaterials = new Set();

function darkenNonBloomed( obj ) {
	if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
		occludeMaterials[ obj.uuid ] = obj.material;
		obj.material = occludingMaterial;
	}
}

function restoreMaterial( obj ) {
	if ( occludeMaterials[ obj.uuid ] ) {
		obj.material = occludeMaterials.delete( obj.uuid );
		// delete materials[ obj.uuid ];
	}
}

const occludingMaterial = new THREE.MeshBasicMaterial( { color: "black" } );

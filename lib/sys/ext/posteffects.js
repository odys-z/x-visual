// /** @module xv.ecs.sys */
//
// import * as ECS from '../../packages/ecs-js/index';
//
// /**
//  * @class
//  */
// export default class PostEffects extends ECS.System {
// 	constructor(ecs, x, options) {
// 		super(ecs);
// 		this.ecs = ecs;
//
// 		if (options.outline)
// 			this.outlinePass(x.xscene, x.XCamera.cam, x.renderer);
// 	}
//
// 	update(tick, entities) {
// 	}
//
// 	outlinePass(scene, camera, renderer) {
// 		var composer = new EffectComposer( renderer );
//
// 		var renderPass = new RenderPass( scene, camera );
// 		composer.addPass( renderPass );
//
// 		outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
// 		composer.addPass( outlinePass );
// 	}
// }
//
// PostEffects.query = {any: ['GpuPickable', 'RayCastee']};

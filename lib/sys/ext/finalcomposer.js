/** @module xv.ecs.sys.ext */

import * as ECS from '../../../packages/ecs-js/index';

/**
 * @class
 */
export default class FinalComposer extends ECS.System {
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
		var composer = x.composer;
		var pass = new ShaderPass( scene, camera );
		composer.addPass( pass );
        this.composer = composer;
        this.pass = pass;
    }

}

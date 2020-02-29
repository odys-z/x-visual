/** @module xv.ecs.sys */


/**FIXME should final composer be a part of thrender?
 * @class
 */
export default class FinalComposer extends ECS.System {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;

		if (typeof container === 'object') {
			var finalPass = new ShaderPass(
				new THREE.ShaderMaterial( {
					uniforms: {
						baseTexture: { value: null },
						bloomTexture: { value: bloomComposer.renderTarget2.texture }
					},
					vertexShader: document.getElementById( 'vertexshader' ).textContent,
					fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
					defines: {} } ),
				"baseTexture" );	// textureId like tDiffuse
			finalPass.needsSwap = true;

			this.finalComposer = new EffectComposer( renderer );
			this.finalComposer.addPass( renderScene );
			this.finalComposer.addPass( finalPass );
		}
		else {
			if (x.log >= 5)
				console.warn('[5] Sys.finalComposer: container canvas is incorrect. Testing? ')
		}
	}

	update(tick, entities) {
		// if (this.outlinePass) {
		// 	this.outlinePass.selectedObjects.splice(0);
		// 	for (var e of entities) {
		// 		var pk = e.GpuPickable;
		// 		if (pk && pk.picktick > 0 && pk.picked)
		// 			this.outlinePass.selectedObjects.push(e.Obj3.mesh);
		// 	}
		// }

		if (this.camera) {
			// this.camera.updateProjectionMatrix();
			this.finalComposer.render();
		}
		else if (x.log >= 5)
			console.warn('[5] FinalComposer.update(): No camera, testing?');
	}
}

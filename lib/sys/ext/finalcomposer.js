/** @module xv.ecs.sys.ext */

// import * as THREE from 'three'
import * as ECS from '../../../packages/ecs-js/index'

import {ShaderPass} from  '../../../packages/three/postprocessing/ShaderPass'
import {ShaderMaterial} from '../../../packages/three/three.module.js';
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'

import XSys from '../xsys';
import AssetKeepr from '../../xutils/assetkeepr';
import {ramTexture} from '../../xutils/xcommon';

/**
 * @class
 */
export default class FinalComposer extends XSys {
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;

		this.layers = [];
		if (x.options.postEffects)
			this.effects(x);
	}

	/* working: render with only OrthoPass (final pass not active)
	effects(x) {
		var effects = x.composer;
		effects.renderToScreen = true;

		this.finalCompose = new EffectComposer( x.renderer );
		var finalPass = new ShaderPass(
			new THREE.ShaderMaterial( {
				uniforms: {
					texScene: { value: null },
					texEffects: { value: effects.renderTarget2.texture }
				},
				vertexShader: finalVert,
				fragmentShader: finalFrag,
				defines: {} } ),
			"texScene");
		finalPass.renderToScreen = true;
		this.finalCompose.addPass( finalPass );
		this.effectPass = effects;
	}

	update(tick, entities) {
		this.effectPass.render();
	}
	*/

	/** working: only raw green lines
	effects(x) {
		var effects = x.composer;
		effects.renderToScreen = false;

		this.finalCompose = new EffectComposer( x.renderer );

		var renderPass = new RenderPass( x.scene, x.xcam.XCamera.cam);
		renderPass.renderToScreen = false;
		this.finalCompose.addPass(renderPass);

		var finalPass = new ShaderPass(
			new THREE.ShaderMaterial( {
				uniforms: {
					texScene: { value: null },
					texEffects: { value: effects.renderTarget1.texture }
				},
				vertexShader: finalVert,
				fragmentShader: finalFrag,
				defines: {} } ),
			"texScene");
		finalPass.renderToScreen = true;
		this.finalCompose.addPass( finalPass );
		this.effectPass = effects;
	}

	update(tick, entities) {
		this.finalCompose.render();
	}
	*/

	effects(x) {
		var effects = x.composer;
		effects.renderToScreen = false;
		this.effectPass = effects;


		this.finalCompose = new EffectComposer( x.renderer );

		var renderPass = new RenderPass( x.scene, x.xcam.XCamera.cam);
		renderPass.renderToScreen = false;
		this.finalCompose.addPass(renderPass);

		var finalPass = new ShaderPass(
			// Debug Notes: Tricky! Tricky! Tricky! Tricky!
			// This is from packages/three.module.js, not the same as THREE.ShaderMaterial
			new ShaderMaterial( {
				uniforms: {
					texScene: { value: null },
					texEffects: { value: effects.renderTarget2.texture },
					// texEffects: { value: AssetKeepr.defaultex() }

					texTest: { value: new ramTexture(3, 2, 0.25) }
				},
				vertexShader: finalVert,
				fragmentShader: finalFrag,
				defines: {} } ),
			"texScene");
		finalPass.renderToScreen = true;
		// finalPass.needsSwap = true;
		this.finalCompose.addPass( finalPass );
	}

	update(tick, entities) {
		this.effectPass.render();

		// this.effectPass.renderTarget1.texture = AE19D55A
		// this.effectPass.renderTarget2.texture = C1B760F6
		// finalCompose.ShaderPass.uniforms.texEffects = FF9BBFE8
		// finalCompose.ShaderPass.uniforms.texScene = 2F8E3CEA
		this.finalCompose.render();
	}

	/* doesn't work
	effects(x) {
		var effects = x.composer;
		effects.renderToScreen = false;
		// effects.needsSwap = true;


		// var renderPass = new RenderPass( x.scene, x.xcam.XCamera.cam);
		// renderPass.renderToScreen = false;
		// var effects = x.composer;
		// // effects.needsSwap = true;
		// effects.addPass(renderPass);

		this.effectPass = effects;

		var finalPass = new ShaderPass(
			new THREE.ShaderMaterial( {
				uniforms: {
					texScene: { value: null },
					texEffects: { value: effects.renderTarget2.texture }
				},
				vertexShader: finalVert,
				fragmentShader: finalFrag,
				defines: {} } ),
			"texScene");
		finalPass.needsSwap = true;
		finalPass.renderToScreen = false;

		this.finalCompose = new EffectComposer( x.renderer );
		this.finalCompose.addPass( finalPass );
	}

	update(tick, entities) {
		this.effectPass.render();
		this.finalCompose.render();
	}
	*/
}

const finalVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }`;

const finalFrag = `
  uniform sampler2D texScene;
  uniform sampler2D texEffects;
  uniform sampler2D texTest;
  varying vec2 vUv;
  vec4 getTexture( sampler2D tex ) {
    return mapTexelToLinear( texture2D( tex, vUv ) );
  }
  void main() {
    gl_FragColor = ( getTexture( texScene ) + vec4( 1.0 ) * getTexture( texEffects ) );
    // gl_FragColor = ( getTexture( texScene ) + vec4( 1.0 ) * .5 );
	// gl_FragColor = texture2D( texEffects, vUv );
	gl_FragColor += getTexture( texTest ) * .2;
	gl_FragColor.b = 0.1;
  }`;

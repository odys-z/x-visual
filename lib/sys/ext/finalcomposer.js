/** @module xv.ecs.sys.ext */

import * as THREE from 'three'
import * as ECS from '../../../packages/ecs-js/index'

import {ShaderPass} from  '../../../packages/three/postprocessing/ShaderPass'
import XSys from '../xsys';
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'

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

		this.composer = new EffectComposer( x.renderer );
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
		this.composer.addPass( finalPass );
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

		this.composer = new EffectComposer( x.renderer );

		var renderPass = new RenderPass( x.scene, x.xcam.XCamera.cam);
		renderPass.renderToScreen = false;
		this.composer.addPass(renderPass);

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
		this.composer.addPass( finalPass );
		this.effectPass = effects;
	}

	update(tick, entities) {
		this.composer.render();
	}
	*/

	effects(x) {
		var effects = x.composer;
		effects.renderToScreen = false;
		this.effectPass = effects;


		this.composer = new EffectComposer( x.renderer );

		var renderPass = new RenderPass( x.scene, x.xcam.XCamera.cam);
		renderPass.renderToScreen = false;
		this.composer.addPass(renderPass);

		var finalPass = new ShaderPass(
			new THREE.ShaderMaterial( {
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
		this.composer.addPass( finalPass );
	}

	update(tick, entities) {
		this.effectPass.render();
		this.composer.render();
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

		this.composer = new EffectComposer( x.renderer );
		this.composer.addPass( finalPass );
	}

	update(tick, entities) {
		this.effectPass.render();
		this.composer.render();
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

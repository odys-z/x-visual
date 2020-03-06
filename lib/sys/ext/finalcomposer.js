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
		if (x.options.pathEffects)
			this.effects(x);
	}

	effects(x) {
		var unis = {};
		this.effectComposer = x.composer[0];
		// this.effectComposer = new EffectComposer( x.renderer );
		// var target1 = true;
		// for (var effect of x.composer) {
		// 	effect.renderToScreen = false;
		// 	this.effectComposer.addPass(effect);
		// 	target1 = !target1;
		// }
		var target1 = false;

		// FIXME bug: final composer should be the Thrender.composer
		this.finalCompose = new EffectComposer( x.renderer ); // with scene and outline by Thrender

		// var renderPass = new RenderPass( x.scene, x.xcam.XCamera.cam);
		// renderPass.renderToScreen = false;
		// this.finalCompose.addPass(renderPass);

		var finalPass = new ShaderPass(
			// Debug Notes: Tricky!
			// This class comes from packages/three.module.js, not the same as THREE.ShaderMaterial
			// See docs/design-memo/extendsions/post-effects
			new ShaderMaterial( {
				uniforms: {
					texScene: { value: null },
					texEffects: { value: target1 ?
						this.effectComposer.renderTarget1.texture :
						this.effectComposer.renderTarget2.texture },
					texTest: { value: new ramTexture(3, 2, 0.25) }
				},
				vertexShader: finalVert,
				fragmentShader: finalFrag,
				defines: {} } ),
			"texScene");
		finalPass.renderToScreen = true;
		this.finalCompose.addPass( finalPass );
	}

	update(tick, entities) {
		this.finalCompose.render();
	}
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
	gl_FragColor += getTexture( texTest ) * .2;
  }`;

/** @module xv.ecs.sys.ext */

import * as THREE from 'three'
import * as ECS from '../../../packages/ecs-js/index'

import {ShaderPass} from  '../../../packages/three/postprocessing/ShaderPass'
import {XSys} from '../xsys';
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'

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

	effects(x) {
		var effects = x.composer;
		effects.renderToScreen = false;
		// effects.needsSwap = true;

		this.composer = new EffectComposer( x.renderer );
		var renderScene = new RenderPass( x.scene, x.xcam.XCamera.cam );
		this.composer.addPass( renderScene );

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
		// finalPass.needsSwap = true;
		finalPass.renderToScreen = true;
		this.composer.addPass( finalPass );
		this.pass = finalPass;

		// effects.renderToScreen = true;
		// this.composer = effects;
	}

	update(tick, entities) {
		this.composer.render();
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
  varying vec2 vUv;
  vec4 getTexture( sampler2D tex ) {
    return mapTexelToLinear( texture2D( tex, vUv ) );
  }
  void main() {
    gl_FragColor = ( getTexture( texScene ) + vec4( 1.0 ) * getTexture( texEffects ) );
  }`;

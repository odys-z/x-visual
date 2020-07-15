
import * as ECS from '../../../packages/ecs-js/index'

import {ShaderMaterial} from 'three'
import {ShaderPass} from  '../../../packages/three/postprocessing/ShaderPass'
import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'
import {RenderPass} from  '../../../packages/three/postprocessing/RenderPass'
import {FilmPass} from  '../../../packages/three/postprocessing/FilmPass'

import XSys from '../xsys'
import AssetKeepr from '../../xutils/assetkeepr'
import {ramTexture} from '../../xutils/xcommon'

/**
 * Compose all postprocessing effects.
 * @class FinalComposer
 */
export default class FinalComposer extends XSys {

	/**
	 * Compose all postprocessing effects.
	 * @param {ECS} ecs
	 * @param {x} x {options, ...}
	 * where x.alpha0 is a string used to set background, for debugging, default
	 * '0.2'.
	 * @constructor FinalComposer
	 */
	constructor(ecs, x) {
		super(ecs);
		this.ecs = ecs;

		this.layers = [];
		if (x.options.effects
			&& x.composer) // testing
			this.effects(x);
	}

	effects(x) {
		var unis = new Object();
		this.effectComposer = x.composer;
		var target1 = false;
		this.finalComposer = x.thrender;

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
				fragmentShader: finalFrag(x.alphaTest || '0.2'),
				defines: new Object() } ),
			"texScene");
		finalPass.renderToScreen = true;
		this.finalComposer.addPass( finalPass );
	}

	update(tick, entities) {
	}
}

const finalVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }`;

const finalFrag = (alphaTest) => `
  uniform sampler2D texScene;
  uniform sampler2D texEffects;
  uniform sampler2D texTest;
  uniform float alphTest;

  varying vec2 vUv;
  vec4 getTexture( sampler2D tex ) {
    return mapTexelToLinear( texture2D( tex, vUv ) );
  }
  void main() {
    gl_FragColor = ( getTexture( texScene ) + vec4( 1.0 ) * getTexture( texEffects ) );
	gl_FragColor += getTexture( texTest ) * ${alphaTest};
  }`;

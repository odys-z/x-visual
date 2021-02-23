// import * as ECS from '../../../packages/ecs-js/index'
// import {Material, Vector2} from 'three'
// import { EffectComposer } from  '../../../packages/three/postprocessing/EffectComposer'
//
// import {SSAOPass} from  '../../../packages/three/postprocessing/SSAOPass'
//
// import XSys from '../xsys'
// import Orthocclude from './orthocclude'
// import { LayerChannel, Layers } from '../../xmath/layer'
//
// /**
//  * @class SsaoEffect
//  */
// export default class SsaoEffect extends Orthocclude {
// 	constructor(ecs, x) {
// 		super(ecs, x);
// 		this.ecs = ecs;
// 	}
//
// 	getEffectPass(ecs, x) {
// 		var camera = x.xcam.XCamera.cam;
// 		var wh = x.options.canvasize;
//
// 		this.ssaoPass = new SSAOPass( x.scene, camera, wh[0], wh[1] );
// 			this.ssaoPass.kernelRadius = 12;
// 			this.ssaoPass.minDistances = 0.001;
// 			this.ssaoPass.maxDistance = 0.3;
// 			x.ssao = this;
//
// 		var ssaos = ecs.queryEntities( {any: ['Ssao', 'Occluder']} );
// 		if (ssaos.size > 0) {
// 			var layers = new Layers();
// 			layers.enable(LayerChannel.SSAO);
//
// 			for (var e of ssaos) {
// 				e.Obj3.layers |= 1 << LayerChannel.SSAO;
// 			}
//
// 			var effects = [this.ssaoPass];
// 			return {effects, layers};
// 		}
// 		else return {};
// 	}
//
// 	togggleOutput() {
// 		if ( this.ssaoPass.output === SSAOPass.OUTPUT.Default ) {
// 			this.ssaoPass.output = SSAOPass.OUTPUT.SSAO
// 			console.log('SSAO');
// 		}
// 		else if ( this.ssaoPass.output === SSAOPass.OUTPUT.SSAO ) {
// 			this.ssaoPass.output = SSAOPass.OUTPUT.Depth;
// 			console.log('Depth');
// 		}
// 		else if ( this.ssaoPass.output === SSAOPass.OUTPUT.Depth ) {
// 			this.ssaoPass.output = SSAOPass.OUTPUT.Normal;
// 			console.log('Normal');
// 		}
// 		else {
// 			this.ssaoPass.output = SSAOPass.OUTPUT.Default;
// 			console.log('Default');
// 		}
// 	}
// }
//
// SsaoEffect.query = {any: ['Ssao']};

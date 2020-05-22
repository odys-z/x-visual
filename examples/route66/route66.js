import * as xv from 'x-visual'
import * as THREE from 'three'

/**
 * Subclass for rendering parallel axis
 * @class Parallel
 */
export default class Route66 extends xv.XSys {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		if (ecs) {
			var panel = ecs.createEntity({
				id: 'panel',
				Obj3: { geom: xv.XComponent.Obj3Type.USER,  // ignored
						box: [],                            // ignored
						transform: [
							{scale: [10, 10, 10]},
							{rotate: {deg: 90, axis: [1, 0, 0]}},
							{rotate: {deg: 35, axis: [0, 1, 0]}},
							{translate: [-60, 57, -5]}],
						mesh: undefined },
				Visual:{vtype: xv.AssetType.gltf,
						// paras: {nodes: ['CAR', 'GAS_text', 'main-floor', 'route66 panel'],
						paras: {nodes: ['route66 panel'],
						// paras: {nodes: ['route66 panel', 'GAS_text',
										// '24 Hours Service_text', 'welcome panel'],
								withTransform: false},
						asset: 'route66.gltf'},
				// ModelSeqs: { script: [ [
				// 	  { mtype: xv.XComponent.AnimType.SCALE,
				// 		paras: {
				// 			start: Infinity,  // can only be Infinity, see docs/design-memo/task/issues
				// 			scale: [[1, 0.01, 1], [1, 1, 1]],
				// 			ease: xv.XEasing.Elastic} }] ] },
				// CmpTweens: {}
			});

			var car = ecs.createEntity({
				id: 'car',
				Obj3: { geom: xv.XComponent.Obj3Type.USER,  // ignored
						box: [],                            // ignored
						transform: [
							{scale: [8, 8, 8]},
							{rotate: {deg: 90, axis: [0, 1, 0]}},
							{translate: [-50, 9.2, 30]}],
						mesh: undefined },
				Visual:{vtype: xv.AssetType.gltf,
						paras: {nodes: ['CAR'],
								withTransform: false},
						asset: 'route66.gltf'},
			});

			var gas = ecs.createEntity({
				id: 'gas',
				Obj3: { geom: xv.XComponent.Obj3Type.USER,  // ignored
						box: [],                            // ignored
						transform: [
							{scale: [10, 10, 10]},
							{rotate: {deg: 90, axis: [1, 0, 0]}},
							{rotate: {deg: 30, axis: [0, 1, 0]}},
							{translate: [-40, 80, -20]}
						],
						mesh: undefined },
				Visual:{vtype: xv.AssetType.gltf,
						paras: {nodes: ['GAS_text'],
								withTransform: false},
						asset: 'route66.gltf'},
			});

			var lit = ecs.createEntity({
				id: 'light',
				Obj3: { geom: xv.XComponent.Obj3Type.USER,  // ignored
						box: [],                            // ignored
						transform: [
							{scale: [20, 20, 20]}],
						mesh: undefined },
				Visual:{vtype: xv.AssetType.gltf,
						paras: {nodes: ['main-floor'],
								withTransform: false},
						asset: 'route66.gltf'},
			});

			// var earth = ecs.createEntity({
			// 	id: 'earth',
			// 	Obj3: { geom: xv.XComponent.Obj3Type.USER,	// ignored
			// 			box: [],	     					// ignored
			// 			// transform: [{scale: [1, 0.1, 1]}],
			// 			mesh: undefined },
			// 	Visual:{vtype: xv.AssetType.gltf,
			// 			paras: {nodes: ['Sphere'],
			// 					withTransform: false},
			// 			asset: 'earth/earth-low.gltf'},
			// 	// ModelSeqs: { script: [ [
			// 	// 	  { mtype: xv.XComponent.AnimType.SCALE,
			// 	// 		paras: {
			// 	// 			start: Infinity,  // can only be Infinity, see docs/design-memo/task/issues
			// 	// 			scale: [[1, 0.01, 1], [1, 1, 1]],
			// 	// 			ease: xv.XEasing.Elastic} }] ] },
			// 	// CmpTweens: {}
			// });
			// var b =ecs.createEntity({
			// 	id: 'build',
			// 	Obj3: { geom: xv.XComponent.Obj3Type.PointCurve,
			// 			box: [9],  // curve division
			// 			mesh: undefined },
			// 	Visual:{vtype: xv.AssetType.GeomCurve,
			// 			paras: {points: [[0, 0, -50], [100, 0, -50]],
			// 					origin: [-60, 0, 0],
			// 					color: 0xffff00, linewidth: 1} },
			// 	FlowingPath: { paras: [ ] }
			// });
		}
	}

	update(tick, entities) {
		for (const e of entities) {
			 if (e.flag > 0) {
				// handling command like start an animation here
				this.cmd = e.UserCmd.cmds[0].cmd;
			}
			else this.cmd = undefined;
		}
	}
}

Route66.query = {
	iffall: ['Obj3', 'Visual']
};

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

		this.logcnt = 0;

		// create a cube with options
		if (ecs) {
			var lit = ecs.createEntity({
				id: 'light',
				Obj3: { geom: xv.XComponent.Obj3Type.USER,	// ignored
						box: [],	     					// ignored
						mesh: undefined },
				Visual:{vtype: xv.AssetType.gltf,
						transform: {scale: [1, 0.1, 1]},
						paras: {nodes: ['route66 sign point light', 'GAS_text', '24 Hours Service_text', 'welcome panel'],
								withTransform: false},
						asset: 'route66.gltf'},
				ModelSeqs: { script: [ [
					  { mtype: xv.XComponent.AnimType.SCALE,
						paras: {
							start: Infinity,  // can only be Infinity, see docs/design-memo/task/issues
							scale: [[1, 0.01, 1], [1, 1, 1]],
							ease: xv.XEasing.Elastic} }] ] },
				CmpTweens: {}
			});

			var b =ecs.createEntity({
				id: 'build',
				Obj3: { geom: xv.XComponent.Obj3Type.PointCurve,
						box: [9],  // curve division
						mesh: undefined },
				Visual:{vtype: xv.AssetType.GeomCurve,
						paras: {points: [[0, 0, -50], [100, 0, -50]],
								origin: [-60, 0, 0],
								color: 0xffff00, linewidth: 1} },
				FlowingPath: { paras: [ ] }
			});
		}
	}

	update(tick, entities) {
		if (this.logcnt < 2) {
			this.logcnt += 1;
			console.log('cube.update(): ', tick, entities)
		}

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

/** @module xv.example.points */

import * as xv from 'x-visual'
import * as THREE from 'three'

/**
 * Subclass for handling data objects
 * @class
 */
export default class Cube extends xv.XObj {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		this.logcnt = 0;

		// 24 Jan. 2020
		// scene is not avialable because Thrender not created yet.
		// Design Nots: THREE.Scene should only taked care by Thrender.
		// User's app hanling should only care about entity definitions.
		// TODO docs
		// create a cube with options
		// var texture = new THREE.TextureLoader().load( '../assets/rgb2x2.png' );
		// var mat = new THREE.MeshBasicMaterial({ map: texture });
		// var m = new THREE.Mesh( new THREE.BoxBufferGeometry( 60, 200, 40 ), mat );
		// options.xscene.add( m );
		// console.log('add mesh to scene: ', m.uuid);

		if (ecs) {
			var cube = ecs.createEntity({
				id: 'cube0',
				Obj3: { geom: xv.XComponent.Obj3Type.BOX,
						box: [200, 120, 80] },	// bounding box
				Visual: {vtype: xv.AssetType.mesh,
						 asset: '../../assets/rgb2x2.png' }
			});
		}
	}

	update(tick, entities) {
		if (this.logcnt < 2) {
			this.logcnt += 1;
			console.log('cube.update(): ', tick, entities)
		}

		for (const e of entities) {
			if (e.CmdFlag) {
			 	if (e.CmdFlag.flag > 0) {
					// handling command like start an animation here
					this.cmd = e.UserCmd.cmds[0].cmd;
				}
				else this.cmd = undefined;
			}
		}
	}
}

Cube.query = {
	iffall: ['Visual', 'CmdFlag']
};

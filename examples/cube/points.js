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

		// create a cube with options
		var texture = new THREE.TextureLoader().load( '../assets/rgb2x2.png' );
		var mat = new THREE.MeshBasicMaterial({ map: texture });
		var m = new THREE.Mesh( new THREE.BoxBufferGeometry( 60, 200, 40 ), mat );
		options.xscene().add( m );
		console.log('add mesh to scene: ', m.uuid);

		if (ecs) {
			var cube = ecs.createEntity({
				id: 'cube0',
				Geometry: {pos: [0, 0, 0],
						rotate: [0, 0, 0] },
				Visual: {vtype: xv.AssetType.mesh, assetId: 0}
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
					this.cmd = e.UserCmd.cmds[0].cmd;
				}
				else this.cmd = undefined;
			}
			else if (e.Visual) {
				if (this.cmd)
					console.log('visual changing: ', this.cmd);
			}
		}
	}
}

Cube.query = {
	any: ['Visual', 'CmdFlag']
};

console.log('Cube.query', Cube.query);

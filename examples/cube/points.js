
import * as xv from 'x-visual'


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
		// var cubeGeom = new THREE.BoxBufferGeometry( 200, 200, 200 );
	}

	update(tick, entities) {
		if (this.logcnt < 2) {
			this.logcnt += 1;
			console.log('cube.update(): ', tick, entities)
		}
	}

}

Cube.query = {
  has: ['Geometry', 'Visual']
};

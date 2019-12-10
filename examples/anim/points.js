
// import * as ECS from '../../packages/ecs-js/index';
//<script type='text/javascript' src='../../dist/xv-0.1.0.min.js'></script>

/**
 * Subclass for handling data objects
 * @class
 */
class Cube extends xv.sys.Obj {
	constructor(ecs, options) {
		super(ecs);
		this.ecs = ecs;

		// create a cube with options
		// var cubeGeom = new THREE.BoxBufferGeometry( 200, 200, 200 );
	}

	update(tick, entities) {
	}

}

Input.query = {
  has: ['Geometry', 'Visual']
};

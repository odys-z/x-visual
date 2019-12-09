
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
	}

	update(tick, entities) {
	}

}


import Cube from './points'

class Business {
	constructor() {}

	static createCubesys(ecs, options) {
		// create a cube for disply
		return new Cube(ecs, options);
	}
}

export {Business}

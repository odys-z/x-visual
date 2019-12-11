
import Cube from './points'

class Business {
	constructor() {}

	static createCubesys(ecs, scene) {
		// create a cube for disply
		return new Cube(ecs, {scene});
	}
}

export {Business}

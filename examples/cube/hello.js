
import Cube from './hellocube'

class Hello {
	constructor() {}

	static createCubesys(ecs, options) {
		// create a cube for disply
		return new Cube(ecs, options);
	}
}

export {Hello}

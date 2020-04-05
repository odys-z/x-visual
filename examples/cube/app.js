/** Example: Hello XWorld
 */

import * as xv from 'x-visual'
import Cube from './hellocube'

/** Hollow XWorld Application.
 * add the user implemented system, Hello, into xworld, then show it.
 * @class
 */
class App {
	constructor(canv) {
		var c = document.getElementById(canv);
		const xworld = new xv.XWorld(c, window, {
			camera: {far: 10000} // default 5000
		});
		var ecs = xworld.xecs;

		xworld.addSystem('hello', // any group name as you like
			new Cube(ecs, {xscene: xworld.xscene}));
		xworld.startUpdate();
	}
}



window.App = App;

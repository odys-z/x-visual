/** Example: Hello XWorld
 */

import * as xv from 'x-visual'
import Parallel from './parallel-coords'

/** Hollow XWorld Application.
 * add the user implemented system, Hello, into xworld, then show it.
 * @class
 */
class XMesh {
	constructor(canv) {
		var c = document.getElementById(canv);
		const xworld = new xv.XWorld(c, window, {
			camera: {far: 10000} // default 5000
		});
		var ecs = xworld.xecs;

		xworld.addSystem('mesh', // any group name as you like
			new Parallel(ecs, {xscene: xworld.xscene}));
		xworld.startUpdate();
	}
}



window.XMesh = XMesh;

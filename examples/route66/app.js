import * as xv from 'x-visual'
import Route66 from './route66'

/** Example XWorld Application.
 * @class
 */
export class App {
	constructor(canv) {
		var c = document.getElementById(canv);
		const xworld = new xv.XWorld(c, window, { });
		var ecs = xworld.xecs;

		xworld.addSystem('route66', // any group name as you like
			new Route66(ecs, {xscene: xworld.xscene}));
		xworld.startUpdate();
	}
}

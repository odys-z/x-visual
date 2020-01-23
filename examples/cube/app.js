
import * as xv from 'x-visual'
import {Business} from './business'

class App {
	constructor(canv) {
		var c = document.getElementById(canv);
		const xworld = new xv.XWorld(c, window, {
			camera: {far: 10000} // default 5000
		});
		var ecs = xworld.xecs;

		// FIXME Geometry should already been registered by XObj
		ecs.registerComponent('Geometry', xv.XComponent.Geometry);
		// ecs.registerComponent('Visual', xv.XComponent.Visual);

		xworld.addSystem('visu', Business.createCubesys(ecs, {xscene: xworld.xscene}));
		xworld.startUpdate();
	}
}

window.App = App;

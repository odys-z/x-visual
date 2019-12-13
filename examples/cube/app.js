
import * as xv from 'x-visual'
import {Business} from './business'
// import Geometry from './business'

class App {
	constructor(canv) {
		var c = document.getElementById(canv);
		console.log(c, c.getContext);
		const xworld = new xv.XWorld(c, window, {});
		var ecs = xworld.xecs();
		ecs.registerComponent('Geometry', xv.XComponent.Geometry);
		ecs.registerComponent('Visual', xv.XComponent.Visual);
		xworld.addSystem('visu', Business.createCubesys(ecs, {}));
		xworld.update();
	}
}

// console.log('creating App for "canv"...');
window.App = App;

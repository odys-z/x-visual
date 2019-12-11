
import * as xv from 'x-visual'
import {Business} from './business'

class App {
	constructor(canv) {
		const xworld = new xv.XWorld(document.getElementById(canv), window, {});
		xworld.addSystem('visu', Business.createCubesys(xv.ecs, {}));
		xworld.update();
	}
}

console.log('creating App for "canv"...');
window.App = new App('canv');

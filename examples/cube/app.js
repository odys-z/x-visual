
import * as X from 'x-visual'

export default class App {
	constructor() {
		const xworld = new XWorld(document.getElementById('canv'), window, {});
		xworld.addSystem('visu', new Business(xv.ecs, {}));
		xworld.update()
	}
}

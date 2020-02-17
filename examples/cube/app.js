/**Example of hello xworld
 * @module xv.example.hello */
import * as xv from 'x-visual'
import {Hello} from './hello'

class App {
    constructor(canv) {
        var c = document.getElementById(canv);
        const xworld = new xv.XWorld(c, window, {});
        var ecs = xworld.xecs;

        xworld.addSystem('visu', Business.createCubesys(ecs, {xscene: xworld.xscene}));
        xworld.startUpdate();
    }
}

window.App = App;

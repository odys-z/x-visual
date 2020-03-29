
import * as ECS from '../../../packages/ecs-js/index'

import AssetKeepr from '../../xutils/assetkeepr.js';
import XSys from '../../sys/xsys'
import {x} from '../../xapp/xworld';
import {AssetType, ShaderFlag} from '../../component/visual';
import {Obj3Type} from '../../component/obj3';
import {Pie} from '../../component/ext/chart';

// https://www.npmjs.com/package/d3
import * as d3 from "d3";

/**
 * Subsystem rendering 2d pie chart in an svg div.
 *
 * reference:
 * https://observablehq.com/@d3/pie-chart
 * @class D3Pie
 */
export default class D3Pie extends XSys {
    /**
     * @constructor
     */
    constructor(ecs, options, json) {
        super(ecs);
        this.logged = false;
        this.ecs = ecs;
        this.cmd = [];

        ecs.registerComponent('Pie', Pie);

        if (!json)
            throw new XError('XPie can only been created synchronously with json data for initializing');

        if (ecs) {
            debugPie3(ecs, options, json);
        }
    }

    /**
     * @param {int} tick
     * @param {array<Entity>} entities
     * @member D3Pie.update
     * @function
     */
    update(tick, entities) {
        for (const e of entities) {
            if (e.CmdFlag) {
                 if (e.CmdFlag.flag > 0) {
                    this.cmd.push(...e.UserCmd.cmds);
                }
                continue;
            }

            for (var cmd of this.cmd) {
                if (cmd.code === 'mouse' && e.GpuPickable && e.GpuPickable.picked
                    && this.onMouse(cmd.cmd, e))
                    break;
            }

            if (e.Canvas && e.Canvas.dirty) {
                e.Obj3.mesh.material.map = e.Canvas.tex; // debug hard
                e.Obj3.mesh.visible = true;
                e.Canvas.dirty = false;
            }
        }
        this.cmd.splice(0);
    }

    /**
     * @param {string} cmd
     * @param {Event} e
     * @member D3Pie.onMouse
     * @function
     */
    onMouse(cmd, e) {
        if (e.CmpTweens) {
            var twCmd;
            switch (cmd) {
                case 'mousemove':
                    twCmd = e.Pie.onOver;
                    return true;
                case 'click':
                case 'mouseup':
                    twCmd = e.Pie.onClick;
                    if (twCmd !== undefined)
                        pieClick(e, twCmd);
                    return true;
                default:
            }
        }
        else {
            if (!this.logged) {
                console.error('XPie.onMouse(): No such tween. eid: ', e.id);
                this.logged = true;
            }
        }
        return false;
    }

    /**
     * @param {Cavnas} cmpCanv
     * @param {object} json e.g. <br>
     * {rows: [{browser: "name", percent: "10.2"}],<br>
     *  columns: ["browser", "percent"]<br>
     * }
     * @param {object} options
     * @member D3Pie#drawPie
     */
    static drawPie (cmpCanv, json, options) {
        var domId = cmpCanv.domId;
        var w = options ? options.width || 512 : 512,
            h = options ? options.height || 512 : 512,
            h_off = h / 10,
            radius = Math.min(w, h - 2*h_off) / 2;
        cmpCanv.texsize = {width: w, height: h};

        var svg = d3.select("body")
                    .append("div")
                    .style("display", "block").style("position", "absolute").style("z-index", "-1")
                    // .style("width", w).style("height", h + 100).style("background", "transparent")
                    .append("svg")
                    .attr("id", function(d, i) { return domId; })
                    .style("width", w).style("height", h)
                    .style("background", "transparent")
        console.log( svg.attr("id"), svg );

        var g = svg.append("g")
                   .attr("transform", `translate( ${w / 2}, ${h / 2 + h_off} )`);

            var color = d3.scaleOrdinal(['#4daf4a','#377eb8','#ff7f00','#984ea3','#e41a1c']);

            var pie = d3.pie().value(function(d) {
                return d.percent;
            });

            var path = d3.arc()
                     .outerRadius(radius)
                     .innerRadius(radius / 4);

            var label = d3.arc()
                      .outerRadius(radius)
                      .innerRadius(radius - 40);

            var percent = d3.arc()
                      .outerRadius(radius + 20)
                      .innerRadius(radius);
        var data = [
            {browser: "Chrome", percent: "73.70"},
            {browser: "IE/Edge", percent: "4.90"},
            {browser: "Firefox", percent: "15.40"},
            {browser: "Safari", percent: "3.60"},
            {browser: "Opera", percent: "1.00"}];
            data.columns = ["browser", "percent"];
            var arc = g.selectAll(".arc")
                       .data(pie(data))
                       .enter().append("g")
                       .attr("class", "arc");

            arc.append("path")
               .attr("d", path)
               .attr("fill", function(d) { return color(d.data.browser); });

            console.log(arc)

            arc.append("text")
               .attr("transform", function(d) {
                    return "translate(" + label.centroid(d) + ")";
                })
               .text(function(d) { return d.data.percent > 3 ? d.data.browser : ''; });

            arc.append("text")
               .attr("transform", function(d) {
                    return "translate(" + percent.centroid(d) + ")";
                })
               .text(function(d) { return d.data.percent > 3 ? `${d.data.percent} %` : ''; });

        svg.append("g")
           .attr("transform", "translate(" + (w / 2 - 120) + "," + 20 + ")")
           .append("text")
           .text("Browser use statistics - Hello D3")
           .attr("class", "title")
    }

}

D3Pie.query = {
    any: ['CmdFlag', 'Pie']
};

function pieClick(e, twCmd) {
    if (e.CmpTweens !== undefined) {
        e.CmpTweens.startCmds.push(e.Pie.cmd.click);
    }
}

function debugPie3(ecs, options, json) {
    var scl = options.xscale || 4;
    var domId = svgUId();

    const wh = Object.assign(
        {width: 64 * scl, height: 64 * scl},
        options.texsize);

    const obj3 = Object.assign({
            geom: Obj3Type.PLANE,
            box: [wh.width, wh.height, 0],       // plane size
            mesh: undefined },
        options.obj3);

    const vis = Object.assign({ vtype: AssetType.canvas });

    const canv = {domId,
            dirty: false,     // wait svg ready for reloading
            options: wh};     // buffer texture canvas size

    var p11 = ecs.createEntity({
        id: options.eid || '',
        Obj3: obj3,
        Visual: vis,
        Pie: {  onOver: 0,        // tweens[0], blinking
                onClick:1 },      // uniform animation
        Canvas: canv,
        GpuPickable: {pickid: 1},
        ModelSeqs: {script: [
             [{ mtype: xv.XComponent.AnimType.ALPHA,
                paras: {
                    start: Infinity,
                    duration: 0.3,
                    alpha: [0.3, 0.9]
             } }],
             [{ mtype: xv.XComponent.AnimType.UNIFORMS,
                paras: {
                    start: Infinity,
                    duration: 1.1,
                    u_arg1: 0
             } }],
          ]},
        CmpTweens: {}
    });

    D3Pie.drawPie(canv, json, {width: wh.width, height: wh.height});

	// FIXME
    // Debug shows webgl context must been got before html2canvas been called.
	// Why?
	// document.getElementById('canv').getContext('webgl');
    x.container.getContext('webgl');

	AssetKeepr.loadCanvtex2(canv, options);
}

/**
 * @memberof D3Pie
 */
var svguuid = 0;

/**
 * @memberof D3Pie */
function svgUId() {
	return `d3-${++svguuid}`;
}

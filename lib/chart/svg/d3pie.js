
import * as ECS from '../../../packages/ecs-js/index'

import AssetKeepr from '../../xutils/assetkeepr.js';
import XSys from '../../sys/xsys'
import {Obj3Type} from '../../component/obj3';

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
            debugPie3(ecs, json, options);
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
}

D3Pie.query = {
    any: ['CmdFlag', 'Pie']
};

function pieClick(e, twCmd) {
    if (e.CmpTweens !== undefined) {
        e.CmpTweens.startCmds.push(e.Pie.cmd.click);
    }
}

function debugPie3(ecs, json, options) {
    var scl = options.xscale || 16;
    var ixVal = json.coordinates.length;
    var domId = svgUId();

    const wh = Object.assign(
        {width: 4 * scl, height: 4 * scl},
        options.texsize);

    const obj3 = Object.assign({
            geom: Obj3Type.PLANE,
            box: [w, h, 0],       // plane size
            mesh: undefined },
        options.obj3);

    const vis = Object.assign({vtype: AssetType.canvas },
            def.visual || def.Visual);

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
             [{ mtype: xv.XComponent.AnimType.UNIFORM,
                paras: {
                    start: Infinity,
                    duration: 1.1,
                    u_arg1: 0
             } }],
          ]},
        CmpTweens: {}
    });

    drawPie(domId);

	AssetKeepr.loadCanvtex2(canv, undefined, onRefresh);
}

function drawPie (domId, json) {
    var w = 500,
        h = 300,
        radius = Math.min(w, h) / 2;
    var svg = d3.select("body")
                .append("svg")
                // .attr("id", function(d, i) { return domId; });
                .style("width", w).style("height", h + 100);
                // .style("display", "none");
    console.log( svg.attr("id"), svg );

    var g = svg.append("g")
               .attr("transform", `translate( ${w / 2}, ${h / 2 + 50} )`);

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
    daat.columns = ["browser", "percent"];
    // d3.csv("browseruse.csv", function(error, data) {
    //     if (error) {
    //         throw error;
    //     }
    //     console.log(data);
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
    // });

    svg.append("g")
       .attr("transform", "translate(" + (w / 2 - 120) + "," + 20 + ")")
       .append("text")
       .text("Browser use statistics - Hello D3")
       .attr("class", "title")
}

/**
 * @memberof D3Pie
 */
var svguuid = 0;

/**
 * @memberof D3Pie */
function svgUId() {
	return `d3-${svguuid++}`;
}

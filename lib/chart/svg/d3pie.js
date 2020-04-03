
import * as THREE from 'three';
import * as ECS from '../../../packages/ecs-js/index'

import AssetKeepr from '../../xutils/assetkeepr.js';
import XSys from '../../sys/xsys'
import {x} from '../../xapp/xworld';
import {XError} from '../../xutils/xcommon'
import {AssetType, ShaderFlag} from '../../component/visual'
import {Obj3Type} from '../../component/obj3'
import {Pie} from '../../component/ext/chart'
import xmath from '../../xmath/math';

// https://www.npmjs.com/package/d3
import * as d3 from 'd3';

/**
 * Subsystem rendering 2d pie chart in an svg div.
 *
 * reference:
 * https://observablehq.com/@d3/pie-chart
 * @class D3Pie
 */
export default class D3Pie extends XSys {
	/**
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {array} json [{pivot, rows, columns}]
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
			// debugPie3(ecs, options, json[0]);
			D3Pie.pies(ecs, json, options);
		}
	}

	/**
	 * @param {int} tick
	 * @param {array<Entity>} entities
	 * @member D3Pie.update
	 * @function
	 */
	update(tick, entities) {
		if (!this.camera && entities.size > 0)
			this.camera = x.xcam.XCamera.cam;

		if (x.xview.flag > 0) {
			this.cmd.push(...x.xview.cmds);
		}

		for (const e of entities) {
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

			// FIXME mvc:
			// This branch should been ducked whenever cmd flag is clear.
			if (e.Pie && e.Pie.faceCameraXZ) {
				// e.Pie.norm = xmath.normxz(e.Pie.norm,
				// 		this.camera.position, e.Obj3.mesh.position);
				// e.Obj3.mesh.setFromNormalAndCoplanarPoint(
				// 		e.Pie.norm, e.Obj3.mesh.position);
				e.Pie.norm.copy(this.camera.position);
				e.Pie.norm.z = e.Obj3.mesh.position.z;
				e.Obj3.mesh.autoUpdateMatrix = false;
				e.Obj3.mesh.matrix.lookAt(e.Obj3.mesh.position, e.Pie.norm, x.up);
			}
		}
		this.cmd.splice(0);
	}

	/**Handle mouse cmd.
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
						if (e.CmpTweens !== undefined) {
							e.CmpTweens.startCmds.push(twCmd);
						}
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

	/**Draw a d3 pie, to cmpCanv.domId.
	 * @param {Cavnas} cmpCanv
	 * @param {object} json e.g. <br>
	 * {rows: [{browser: "name", percent: "10.2"}],<br>
	 *  columns: ["browser", "percent"]<br>
	 * }
	 * @param {object} options { width, height }
	 * @member D3Pie.drawPie
	 * @function
	 */
	static drawPie (cmpCanv, json, wh) {
		var domId = cmpCanv.domId;
		var w = wh ? wh.width || 512 : 512,
			h = wh ? wh.height || 512 : 512,
			h_off = h / 10,
			radius = Math.min(w, h - 2 * h_off) / 2;

		var svg = d3.select("body")
					// .append("div")
					.append("svg")
					.style("display", "block").style("position", "absolute")
					.style("z-index", "-1")
					// .append("svg")
					.attr("id", function(d, i) { return domId; })
					.style("width", w).style("height", h)

		if (x.log >= 5)
			console.log('[5]', svg.attr("id"), svg );

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

		var data = json.rows;
			data.columns = json.columns;
			var arc = g.selectAll(".arc")
					   .data(pie(data))
					   .enter().append("g")
					   .attr("class", "arc");

			arc.append("path")
			   .attr("d", path)
			   .attr("fill", function(d, i) { return color(d.data[json.columns[0]]); });

			arc.append("text")
			   .style('fill', 'Bisque')
			   .attr("transform", function(d) {
					return "translate(" + label.centroid(d) + ")";
				})
			   .text(function(d) { return d.data.percent > 3 ? d.data.browser : ''; });

			arc.append("text")
			   .style('fill', 'White')
			   .attr("transform", function(d) {
					return "translate(" + percent.centroid(d) + ")";
				})
			   .text(function(d) { return d.data.percent > 3 ? `${d.data.percent} %` : ''; });

		svg.append("g")
		   .attr("transform", "translate(" + (w / 2 - 120) + "," + 20 + ")")
		   .append("text")
		   .text("Browser use statistics - Hello D3")
		   .attr("class", "title")
		   .style('fill', 'Cornsilk');
		   .style('color', 'Cornsilk');
	}

	/**
	 * create pies
	 * @param {ECS} ecs
	 * @param {object} json {pie: [p]},
	 * where p = {pivot, rows, columns}, pivot is the grid index.
	 * @param {object} options
	 * @member D3Pie.pies
	 * @function
	 */
	static pies(ecs, json, options) {
		if (!json || json.length === 0)
			return;

		// FIXME
		// Debug shows webgl context must been got before html2canvas been called.
        // Otherwise the webgl context is null after html2canvas got 2d context.
		// Why?
		// document.getElementById('canv').getContext('webgl');
		x.container.getContext('webgl');

		var scl = options.xscale || 4;
		var spc = options.gridSpace || 40;

		const wh = Object.assign(
			{width: 64 * scl, height: 64 * scl},
			options.texsize);

		var defs = [];
		for (var pie of json) {
			const domId = svgUId();
			const canv = {domId,
				dirty: false,	 // wait svg ready for reloading
				options: wh};	 // buffer texture canvas size
			const translate = [ pie.pivot[0] * spc,
								pie.pivot[1] * spc,
								pie.pivot[2] * spc];
			defs.push ( {
				id: options.eid || 'e-' + svgUId(),
				Obj3: Object.assign({
						geom: Obj3Type.PLANE,
						box: [wh.width, wh.height, 0],	   // plane size
						transform: [{translate}],
						mesh: undefined },
					options.obj3),
				Visual:{vtype: AssetType.canvas,
						paras: {tex_alpha: 1.0}}, // Design MEMO: it's better to separate tween object
				Pie:   {faceCameraXZ: pie.faceCameraXZ === undefined ? false : true,
						norm: new THREE.Vector3(),
						onOver: 0,         // tweens[0], blinking
						onClick: 1 },      // uniform animation
				Canvas: canv,
				GpuPickable: {},
				ModelSeqs: {script: [
					 [{ mtype: xv.XComponent.AnimType.ALPHA,
						paras: {
							start: Infinity,
							duration: 0.3,
							alpha: [1.0, 0.9]
					 } }],
					 [{ mtype: xv.XComponent.AnimType.UNIFORMS,
						paras: {
							start: Infinity,
							duration: 1.1,
							u_arg1: 0
					 } }],
				  ]},
				CmpTweens: {}
			} );

			D3Pie.drawPie(canv, pie, wh);
			AssetKeepr.loadCanvtex2(canv, wh);
		}
		options.xworld.addEntities(defs);

	}
}

D3Pie.query = { any: ['Pie'] };

/**
 * Generate a debugging object (pie) for hard coded parameters.
 * @param {ECS} ecs
 * @param {object} options igonered
 * @param {object} json the data to draw the canvas - debugPie3 didn't touched
 * @function
 */
function debugPie3(ecs, options, json) {
	var scl = 4;
	var domId = svgUId();

	const wh = {width: 64 * scl, height: 64 * scl};

	const obj3 = {
			geom: Obj3Type.PLANE,
			box: [wh.width, wh.height, 0],	   // plane size
			mesh: undefined
		};

	const vis = Object.assign({
			vtype: AssetType.canvas,
			paras: {tex_alpha: 1.0}});

	const canv = {domId,
			dirty: false,	 // wait svg ready for reloading
			options: wh};	 // buffer texture canvas size

	var p11 = ecs.createEntity({
		id: 'e-' + svgUId(),
		Obj3: obj3,
		Visual: vis,
		Pie:{ faceCameraXZ: true,
			  norm: new THREE.Vector3(),
			  onOver: 0,		// tweens[0], blinking
			  onClick: 1 },	 // uniform animation
		Canvas: canv,
		GpuPickable: {},
		ModelSeqs: {script: [
			 [{ mtype: xv.XComponent.AnimType.ALPHA,
				paras: {
					start: Infinity,
					duration: 0.3,
					alpha: [1.0, 0.9]
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

	D3Pie.drawPie(canv, json, wh);

	// FIXME
	// Debug shows webgl context must been got before html2canvas been called.
	// Why?
	// document.getElementById('canv').getContext('webgl');
	x.container.getContext('webgl');

	AssetKeepr.loadCanvtex2(canv, wh);
}

/**For generating Pie object uuid.
 * @memberof D3Pie
 */
var svguuid = 0;

/**Get a uuid.
 * @memberof D3Pie */
function svgUId() {
	return `d3-${++svguuid}`;
}

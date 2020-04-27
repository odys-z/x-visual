import * as ECS from '../../packages/ecs-js/index'

import XSys from '../sys/xsys'

import {x} from '../xapp/xworld'
import {XError} from '../xutils/xcommon'
import {vec3} from '../xmath/vec';
import {CoordsGrid} from '../xmath/chartgrid'
import {GridElem} from '../component/ext/chart';
import {Obj3Type} from '../component/obj3';
import {AssetType, ShaderFlag} from '../component/visual';

/**
 * Subsystem manage 3d chart's auxillaries.<br>
 * @class GridVisuals
 */
export default class GridVisuals extends XSys {

	/**
	 * create chart world
	 * @param {ECS} ecs
	 * @param {object} options
	 * options.chart: json chart section
	 * @param {array} json visuas configuration.
	 * @constructor GridVisuals	 */
	constructor(ecs, options, json) {
		super(ecs);
		this.logged = false;
		this.ecs = ecs;
		this.cmd = [];

		ecs.registerComponent('GridElem', GridElem);

		if (!options.chart)
			throw new XError('GridVisuals can only been created synchronously with json data (options.chart) for initializing');

		if (ecs) {
			/** @property {object} elems - {xyzLine, xyzPlane}, where<br>
			 * xyzLine is a THREE.Object3D, with children of 3 vertical lines;<br>
			 * xyzPlane is a THREE.Object3D, with children of 3 vertical plane;<br>
			 * @member GridVisuals#elems
			 */
			this.elems = this.visuals(ecs, options, json);
			/** @property {CoordsGrid} grid - grid space manager
			 * @member GridVisuals#grid
			 */
			this.grid = options.grid;
		}
	}

	/**
	 * @param {int} tick
	 * @param {array<Entity>} entites
	 * @member GridVisuals#update
	 * @function
	 */
	update(tick, entities) {
		if (x.xview.flag > 0) {
			this.cmd = 0;
			if (x.xview.cmds[0].cmd === 'left')
				this.cmd = -1;
			else if (x.xview.cmds[0].cmd === 'right')
				this.cmd = 1;

			// if (ths.cmd != 0) {
			// }
		}
	}

	/** Generate chart visual elements.
	 * @param {ECS} ecs
	 * @param {object} options
	 * @param {object} json
	 * @member GridVisuals#visuals
	 * @function
	 */
	visuals(ecs, options, json) {
		var grid = options.grid ? options.grid : new CoordsGrid(options.chart);
		options.grid = grid;
		// var s = grid.space(vec3.add(options.chart.grid, 1));
		var s = grid.space([1, 1, 1]);

		// x, y, z line with value label
		var idxline = options.lines;
		var xyzLine = ecs.createEntity({
			id: 'xyz-line',
			Obj3: { geom: Obj3Type.PointSect,
					box: [] },
			Visual:{vtype: AssetType.DynaSects,
					paras: {
						sects:[[[1, 1, 1], [0, 1, 1]],
							   [[1, 1, 1], [1, 0, 1]],
							   [[1, 1, 1], [1, 1, 0]]],
						origin: [0, 0, 0],
						scale: s,
						color: idxline && idxline.color || 0xcc00ff } },
			GridElem: {}
		});

		var bounds = grid.spaceBound();

		var xPlane = ecs.createEntity({
			id: 'x-plane',
			Obj3: { geom: Obj3Type.PLANE,
					transform: [{rotate: {deg: 90, axis: [0, 1, 0]}},
								{translate: [0, bounds[1]/2, bounds[2]/2]}],
					uniforms: {opacity: 0.5},
					box: [bounds[2], bounds[1]] },
			Visual:{vtype: AssetType.mesh,
					asset: options.planes.tex,
					paras: {
						color: 0x770000 } },
			GridElem: {}
		});

		var yPlane = ecs.createEntity({
			id: 'y-plane',
			Obj3: { geom: Obj3Type.PLANE,
					transform: [{rotate: {deg: -90, axis: [1, 0, 0]}},
								{translate: [bounds[0]/2, 0, bounds[2]/2]}],
					uniforms: {opacity: 0.5},
					box: [bounds[0], bounds[2]] },
			Visual:{vtype: AssetType.mesh,
					asset: options.planes.tex,
					paras: {
						color: 0x007700 } },
			GridElem: {}
		});

		var zPlane = ecs.createEntity({
			id: 'z-plane',
			Obj3: { geom: Obj3Type.PLANE,
					transform: [{translate: [bounds[0]/2, bounds[1]/2, 0]}],
					uniforms: {opacity: 0.5},
					box: bounds },
			Visual:{vtype: AssetType.mesh,
					asset: options.planes.tex,
					paras: {
						color: 0x000077 } },
			GridElem: {}
		});
		return {xyzLine, xyzPlane: {x: xPlane, y: yPlane, z: zPlane}};
	}

	/** Generate chart visual elements.
	 * @param {array<int>} gridIx
	 * @return {GridVisuals} this
	 * @member GridVisuals#strechLines
	 * @function
	 */
	strechLines (gridIx) {
		// tested:
		// elems.xyzLine.Obj3.mesh.children[0].geometry.attributes.position.array[0] = 0
		// elems.xyzLine.Obj3.mesh.children[0].geometry.attributes.position.needsUpdate = true
		var p = this.grid.worldPos(gridIx, this.xyzBuf);
		//
		var x = this.elems.xyzLine.Obj3.mesh.children[0].geometry.attributes.position.array;
		x[0] = p[0];
		x[1] = p[1];
		x[2] = p[2];
		x[4] = p[1];
		x[5] = p[2];
		this.elems.xyzLine.Obj3.mesh.children[0].geometry.attributes.position.needsUpdate = true;
		//
		var y = this.elems.xyzLine.Obj3.mesh.children[1].geometry.attributes.position.array;
		y[0] = p[0];
		y[1] = p[1];
		y[2] = p[2];
		y[3] = p[0];
		y[5] = p[2];
		this.elems.xyzLine.Obj3.mesh.children[1].geometry.attributes.position.needsUpdate = true;
		//
		var z = this.elems.xyzLine.Obj3.mesh.children[2].geometry.attributes.position.array;
		z[0] = p[0];
		z[1] = p[1];
		z[2] = p[2];
		z[3] = p[0];
		z[4] = p[1];
		this.elems.xyzLine.Obj3.mesh.children[2].geometry.attributes.position.needsUpdate = true;

		this.xyzBuf = p;
		return this;
	}

	setPlanePos (gridIx) {
	}
}

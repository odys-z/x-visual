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
 * Subsystem manage 3d chart's auxillaries, including xyz plane, xyz value line,
 * xyz value labels.<br>
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

		/** @property {CoordsGrid} grid - grid space manager
		 * @member GridVisuals#grid
		 */
		if (!x.chart || !x.chart.grid) {
			this.grid = new CoordsGrid(options.chart, json);
			x.chart = Object.assign(x.chart || new Object(), {grid: this.grid});
		}
		else this.grid = x.chart.grid;

		if (ecs) {
			/** @property {object} elems - {xyzLine, xyzPlane, axisPlane}, where<br>
			 * xyzLine is a THREE.Object3D, with children of 3 vertical lines;<br>
			 * xyzPlane is a THREE.Object3D, with children of 3 vertical plane,
			 * can be used for highlight value grid;<br>
			 * axisPlane, {yz, zx, xy} is an array of 3 THREE.Object3D, with children of 3 vertical plane at axes plane;<br>
			 * @member GridVisuals#elems
			 */
			this.elems = this.visuals(ecs, options, json);
		}

		this.movePlane = true; // xyzPlane movable
	}

	/**
	 * @param {int} tick
	 * @param {array<Entity>} entites
	 * @member GridVisuals#update
	 * @function
	 */
	update(tick, entities) {
		if (x.xview.flag > 0 && x.xview.picked && x.xview.picked.GridValue) {
			var gridval = x.xview.picked.GridValue;
			var y = this.grid.barHeight(gridval.val);
			this.strechLines(gridval.gridx, [0, y, 0]);
			if (this.movePlane) {

			}
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
		// var s = grid.space(vec3.add(options.chart.grid, 1));
		var s = this.grid.space([1, 1, 1]);

		// x, y, z line with value label
		var idxline = options.lines;
		var xyzLine = ecs.createEntity({
			id: 'xyz-line',
			Obj3: { geom: Obj3Type.PointSects,
					box: [] },
			Visual:{vtype: AssetType.DynaSects,
					paras: {
						// position updated with strechLines(), see update()
						sects:[[[0, 0, 0], [0, 0, 0]],
							   [[0, 0, 0], [0, 0, 0]],
							   [[0, 0, 0], [0, 0, 0]]],
						origin: [0, 0, 0],
						scale: s,
						color: idxline && idxline.color || 0xcc00ff } },
			GridElem: {}
		});

		var bounds = this.grid.spaceBound();

		var xPlane = ecs.createEntity({
			id: 'x-plane',
			Obj3: { geom: Obj3Type.PLANE,
					transform: [{rotate: {deg: 90, axis: [0, 1, 0]}},
								{translate: [0, bounds[1]/2, bounds[2]/2]}],
					uniforms: {opacity: 0.5},
					box: [bounds[2], bounds[1]] },
			Visual:{vtype: AssetType.mesh_basic,
					asset: options.planes.tex,
					paras: {
						blending: THREE.AdditiveBlending,
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
			Visual:{vtype: AssetType.mesh_basic,
					asset: options.planes.tex,
					paras: {
						blending: THREE.AdditiveBlending,
						color: 0x007700 } },
			GridElem: {}
		});

		var zPlane = ecs.createEntity({
			id: 'z-plane',
			Obj3: { geom: Obj3Type.PLANE,
					transform: [{translate: [bounds[0]/2, bounds[1]/2, 0]}],
					uniforms: {opacity: 0.5},
					box: bounds },
			Visual:{vtype: AssetType.mesh_basic,
					asset: options.planes.tex,
					paras: {
						blending: THREE.AdditiveBlending,
						color: 0x000077 } },
			GridElem: {}
		});

		return {xyzLine,
				xyzPlane: {yz: xPlane, xz: yPlane, xy: zPlane} };
	}

	/**Set value indicating lines to grid, with offset in value range (befor scale
	 * to world).
	 *
	 * This method modifying the lines' vertices position buffer directly.
	 * @param {array<int>} gridIx
	 * @param {array<number>} [offset = [0, 0, 0]]
	 * @return {GridVisuals} this
	 * @member GridVisuals#strechLines
	 * @function
	 */
	strechLines (gridIx, offset = [0, 0, 0]) {
		var p = this.grid.worldPos(this.xyzBuf, gridIx);
		return this.strechLinesWorld(p, offset);
	}

	/**Set value indicating lines to position in world, with offset in world.
	 *
	 * This method modifying the lines' vertices position buffer directly.
	 * @param {array<int>} gridIx
	 * @param {array<number>} offset
	 * @return {GridVisuals} this
	 * @member GridVisuals#strechLines
	 * @function
	 */
	strechLinesWorld (p, offset) {
		var s = this.elems.xyzLine.Obj3.mesh.geometry.attributes.position.array;
		var x = 0;
		s[x + 0] = p[0] + offset[0];
		s[x + 1] = p[1] + offset[1];
		s[x + 2] = p[2] + offset[2];
		s[x + 4] = p[1] + offset[1];
		s[x + 5] = p[2] + offset[2];
		//
		var y = 6;
		s[y + 0] = p[0] + offset[0];
		s[y + 1] = p[1] + offset[1];
		s[y + 2] = p[2] + offset[2];
		s[y + 3] = p[0] + offset[0];
		s[y + 5] = p[2] + offset[2];
		//
		var z = 12;
		s[z + 0] = p[0] + offset[0];
		s[z + 1] = p[1] + offset[1];
		s[z + 2] = p[2] + offset[2];
		s[z + 3] = p[0] + offset[0];
		s[z + 4] = p[1] + offset[1];

		this.elems.xyzLine.Obj3.mesh.geometry.attributes.position.needsUpdate = true;

		this.xyzBuf = p;
		return this;
	}

	setPlanePos (gridIx) {
	}
}

GridVisuals.query = {any: ['GridValue']};

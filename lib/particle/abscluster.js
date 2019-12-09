/** @module xv.particle */

import {ECS} from '../packages/ecs-js/ecs';

/**Abstract base class for all cluster effects
 * @class
 */
class AbsCluster {
	constructor(options) {
		this.vs = options.vs;
		this.fs = options.fs;

		this.uniforms = {
			iTime: 0,
		};

		this.uniform = Object.assign(this.uniform, options.uniforms);
	}
}

class CmpCluster extends ECS.BaseComponent {
}

CmpCluster.definition = {
  properties: {
    name: 'dot',
    chart: '<Entity>',

	// shader parameters, test showing properties of cluster won't been sealed?
	cluster: '<AbsCluster>'
  },
};

export {CmpCluster};

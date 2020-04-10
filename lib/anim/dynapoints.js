import * as ECS from '../packages/ecs-js/ecs.js'
/*
	class Anim.DynaPoints
	+ constructor(options, destin_model, from_model)
		''' create an animation controllor '''
		options: step size, time interval, etc.
		destin_model: [optional] moving destination model
		from_model: [optional] moving origin mode
	NOTE: origin and destination points are not the same,
	must resolve the m+>n maping relationship.

	+ update(delta_time)
	   ''' update animation '''

	+ setDest(model)

	+ setFrom(model)
 *
 * @class
 */
class DynasPoints extends ECS.BaseComponent { }

// PointGroup.definition = {
// 	properties: {
// 		name: 'dynas'
// 		slot: '<Entity>'
// 	},
// 	start: undefined, // Float32Array: points array
// 	end: undefined,
// }

// ecs.registerComponentClass(DynasGroup)

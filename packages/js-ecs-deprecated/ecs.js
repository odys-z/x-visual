
// module.exports = {
// 	Engine: require('./src/engine'),
// 	Entity: require('./src/entity'),
// 	System: require('./src/system')
// }

// export {default as Engine} from 'engin.js'
// export {default as Entity} from 'entity.js'
// export {default as Subsystem} from 'system.js'

import Engine from 'engin.js'
import Entity from 'entity.js'
import Subsystem from 'system.js'

export default class ECS {
	Engine, Entity, Subsystem
}

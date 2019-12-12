/** @module xv */

// import * as THREE from 'three';
import {UserCmd, CmdFlag, XCamera} from './component/mvc.js'
import {Geometry} from './component/geometry.js'
import {Visual} from './component/visual.js'


// https://stackoverflow.com/questions/44630265/how-can-i-set-z-up-coordinate-system-in-three-js
// THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

// export * from './osm/osm3.js'
export {default as XWorld, XObj} from './xapp/xworld.js'

export const XComponent = {
	UserCmd, CmdFlag, XCamera, Geometry, Visual
}

/** @module xv */

// import * as THREE from 'three';
import {UserCmd, CmdFlag, XCamera} from './component/mvc.js'
import {Geometry} from './component/geometry.js'
import {Visual, AssetType} from './component/visual.js'
import {Obj3Type, Obj3} from './component/obj3.js'
import {TweenOf, RotaTween, TransTween, PathTween} from './component/tween.js'


// https://stackoverflow.com/questions/44630265/how-can-i-set-z-up-coordinate-system-in-three-js
// THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

export * from './osm/osm3.js'

export {default as XWorld, XObj} from './xapp/xworld.js'

export {AssetType}
export const XComponent = {
	UserCmd, CmdFlag, XCamera, Geometry, Visual, AssetType, Obj3Type, Obj3,
	TweenOf, RotaTween, TransTween, PathTween
}

/** @module xv */

import AssetKeepr from './xutils/assetkeepr.js';

import {UserCmd, CmdFlag, XCamera} from './component/mvc.js'
import {Geometry} from './component/geometry.js'
import {Visual, Canvas, AssetType} from './component/visual.js'
import {Obj3Type, Obj3} from './component/obj3.js'
import {TweenScript, CmpTween} from './component/tween.js'
import {MorphType, MorphSeqs} from './component/morph'

import Htmltex from './sys/htmltex'

// https://stackoverflow.com/questions/44630265/how-can-i-set-z-up-coordinate-system-in-three-js
// THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

export * from './osm/osm3.js'

export {default as XWorld, XObj} from './xapp/xworld.js'
export {Htmltex}
export {AssetType, AssetKeepr}

export const XComponent = {
	UserCmd, CmdFlag, XCamera, Geometry,
	AssetType, Visual, Canvas,
	Obj3Type, Obj3,
	TweenScript, CmpTween, // RotaTween, TransTween, PathTween
	MorphType, MorphSeqs
}

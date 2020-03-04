/** @module xv */

// import AssetKeepr from './xutils/assetkeepr.js';

import * as xutils from './xutils/xcommon.js';
import {UserCmd, CmdFlag, XCamera} from './component/mvc'
import {Geometry} from './component/geometry'
import {Visual, Canvas, AssetType, ShaderFlag} from './component/visual'
import {Obj3Type, Obj3} from './component/obj3'
import {TweenScript, CmpTween} from './component/tween'
import {AnimType, ModelSeqs} from './component/morph'
import { LayerFilter, FlowingPath, GlowingEdge, Filming } from './component/ext/effects'

import Htmltex from './sys/ext/htmltex'

// https://stackoverflow.com/questions/44630265/how-can-i-set-z-up-coordinate-system-in-three-js
// THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

export {XSys} from './sys/xsys'
export * from './osm/osm3.js'
export * from './sys/tween/animizer'
export * from './sys/tween/xtweener'

export {default as XWorld} from './xapp/xworld.js'
export {Htmltex, AssetType}
export * from './xutils/assetkeepr.js'
export {xutils}

export const XComponent = {
	UserCmd, CmdFlag, XCamera, Geometry,
	AssetType, ShaderFlag, Visual, Canvas,
	Obj3Type, Obj3,
	TweenScript, CmpTween, // RotaTween, TransTween, PathTween
	AnimType, ModelSeqs,
	LayerFilter, FlowingPath, GlowingEdge, Filming,
}

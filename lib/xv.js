/** @namespace xv */

// import AssetKeepr from './xutils/assetkeepr.js';

import * as xutils from './xutils/xcommon.js';
import {UserCmd, CmdFlag, XCamera} from './component/mvc'
// import {Geometry} from './component/geometry'
import {Visual, Canvas, AssetType, ShaderFlag} from './component/visual'
import {Obj3Type, Obj3} from './component/obj3'
import {TweenScript, CmpTween} from './component/tween'
import {AnimType, ModelSeqs} from './component/morph'
import {Occluder, FlowingPath, Glow, Filming} from './component/ext/effects'

import XSys from './sys/xsys'
import Htmltex from './sys/ext/htmltex'
import XSankey from './chart/curve/xsankey'
import D3Pie from './chart/svg/d3pie'

// https://stackoverflow.com/questions/44630265/how-can-i-set-z-up-coordinate-system-in-three-js
// THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

export {LayerChannel, Layers} from './xmath/layer'
export {AssetType, XSys, Htmltex, XSankey}
// export {Htmltex, AssetType}
export * from './osm/osm3.js'
export * from './sys/tween/animizer'
export * from './sys/tween/xtweener'

export {default as XWorld} from './xapp/xworld.js'
export * from './xutils/assetkeepr.js'
export {xutils}

export const XComponent = {
	UserCmd, CmdFlag, XCamera,
	AssetType, ShaderFlag, Visual, Canvas,
	Obj3Type, Obj3,
	TweenScript, CmpTween, // RotaTween, TransTween, PathTween
	AnimType, ModelSeqs,
	FlowingPath, Glow, Filming, Occluder,
}

export const chart = {
	XSankey
}

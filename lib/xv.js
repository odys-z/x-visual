import * as xutils from './xutils/xcommon.js';
import {XCamera} from './component/mvc'
// import {Geometry} from './component/geometry'
import {Visual, Canvas, Dynatex, AssetType, ShaderFlag} from './component/visual'
import {Obj3Type, Obj3} from './component/obj3'
import {TweenScript, CmpTween} from './component/tween'
import {AnimType, ModelSeqs} from './component/morph'
import {Occluder, FlowingPath, Glow, Filming} from './component/ext/effects'
import {Sankey, Pie, GridElem} from './component/ext/chart'

import XSys from './sys/xsys'
import Htmltex from './sys/ext/htmltex'
import XBar from './chart/shape/xbar'
import XSankey from './chart/curve/xsankey'
import D3Pie from './chart/svg/d3pie'
import Axisys from './chart/axis'
import GridVisuals from './chart/gridvisuals'

// https://stackoverflow.com/questions/44630265/how-can-i-set-z-up-coordinate-system-in-three-js
// THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

export {LayerChannel, Layers} from './xmath/layer'
export {KeyFlag} from './sys/input'
export {AssetType, XSys, Htmltex}
export * from './osm/osm3.js'
export * from './sys/tween/animizer'
export {default as XTweener, XEasing} from './sys/tween/xtweener'
export {default as Thrender} from './sys/thrender'

export {default as XWorld} from './xapp/xworld.js'
export * from './xutils/assetkeepr.js'
import * as xglsl from './xutils/xglsl'
export {xglsl}

/**
 * Package of components exposed by x-visual.
 *
 * **Components can not created directly. See example for how to use.**
 * @class XComponent
 * */
export const XComponent = {
	XCamera,
	AssetType, ShaderFlag, Visual, Canvas, Dynatex,
	Obj3Type, Obj3,
	TweenScript, CmpTween,
	AnimType, ModelSeqs,
	FlowingPath, Glow, Filming, Occluder,
	GridElem, Pie, Sankey,
}

/**
 * Package of components for chart extension exposed by x-visual.
 *
 * **Components can not created directly. See example for how to use.**
 * @class chart
 * */
export const chart = {
	Axisys, XBar, XSankey, D3Pie, GridVisuals
}

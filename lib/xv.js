import * as THREE from '../packages/three/three.module-MRTSupport'

import * as xutils from './xutils/xcommon.js';
import {XCamera, CameraType} from './component/mvc'
import {Visual, Canvas, Dynatex, AssetType, ShaderFlag, ShaderAlpha} from './component/visual'
import {Obj3Type, Obj3} from './component/obj3'
import {TweenScript, CmpTween} from './component/tween'
import {AnimType, ModelSeqs} from './component/morph'
import {Occluder, FlowingPath, Glow, Filming} from './component/ext/effects'
import {Sankey, Pie, GridElem} from './component/ext/chart'
import {CBoundCubes} from './component/ext/geo'

import XSys from './sys/xsys'
import CanvTex from './sys/canvtex'
import Htmltex from './sys/ext/htmltex'

import XBar from './chart/shape/xbar'
import XSankey from './chart/curve/xsankey'
import D3Pie from './chart/svg/d3pie'
import Axisys from './chart/axis'
import GridVisuals from './chart/gridvisuals'

import {BoundingCubes} from './map3/buildings'

export {THREE}
// https://stackoverflow.com/questions/44630265/how-can-i-set-z-up-coordinate-system-in-three-js
// THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

import * as OrbitControls from '../packages/three/orbit-controls'
export {OrbitControls}

export {LayerChannel, Layers} from './xmath/layer'
export {KeyFlag} from './sys/input'
export {AssetType, ShaderFlag, ShaderAlpha, AnimType, Obj3Type, XSys, Htmltex, CanvTex}
// disabled scince v0.3.81 export * from './osm/osm3.js'
export * from './sys/tween/animizer'
export {default as XTweener, XEasing} from './sys/tween/xtweener'
export {default as Thrender} from './sys/thrender'

export {default as XWorld} from './xapp/xworld.js'
export * from './xutils/assetkeepr.js'
export {default as xgeom} from './xmath/geom'
export {default as AssetKeepr} from './xutils/assetkeepr'
export {CameraType}
export {xutils}

/**
 * Package of components exposed by x-visual.
 *
 * <h4>Note</h4>
 * **Components can not created directly. See example for how to use.**
 *
 * see <a href='../reference/components.html'>docs for more details about components</a>.
 * @class XComponent */
export const XComponent = {
	XCamera,
	AssetType, ShaderFlag, ShaderAlpha, Visual, Canvas, Dynatex,
	Obj3Type, Obj3,
	TweenScript, CmpTween,
	AnimType, AnimType, ModelSeqs,
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

export const map3 = {
	BoundingCubes, CBoundCubes
}

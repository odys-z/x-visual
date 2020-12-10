/**
 * Modified from Three.js/src/renderers/WebGLRenderer.js
 * */

import { WebGLRenderer } from '../three.module-MRTSupport'

export
/** Filter renderer for rendering filter, using provided shadow map
 *  - which is not directly used here but provided for shaders
 */
class Filterenderer {
	constructor(webglRenderer, options) {
		this.renderer = webglRenderer;
	}

	renderQuad ( scene, camera ) {
		let r = this.renderer.shadowMap.render;
		let a = this.renderer.autoClearDepth;
		try {
			this.renderer.autoClearDepth = false;
			this.renderer.shadowMap.render = () => {}
			this.renderer.render( scene, camera );
		}
		finally {
			this.renderer.autoClearDepth = a;
			this.renderer.shadowMap.render = r;
		}
	}

	setRenderTarget( target ) {
		this.renderer.setRenderTarget( target );
	}
	// renderQuad ( scene, camera ) {
	//
	// 	let renderTarget, forceClear;
	//
	// 	// if ( _isContextLost === true ) return;
	//
	// 	// reset caching for this frame
	// 	bindingStates.resetDefaultState();
	// 	_currentMaterialId = - 1;
	// 	_currentCamera = null;
	//
	// 	// update scene graph
	// 	if ( scene.autoUpdate === true ) scene.updateMatrixWorld();
	//
	// 	// update camera matrices and frustum
	// 	if ( camera.parent === null ) camera.updateMatrixWorld();
	//
	// 	if ( xr.enabled === true && xr.isPresenting === true ) {
	// 		camera = xr.getCamera( camera );
	// 	}
	//
	// 	//
	// 	if ( scene.isScene === true ) scene.onBeforeRender( _this, scene, camera, renderTarget || _currentRenderTarget );
	//
	// 	currentRenderState = renderStates.get( scene, camera );
	// 	currentRenderState.init();
	//
	// 	_projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
	// 	_frustum.setFromProjectionMatrix( _projScreenMatrix );
	//
	// 	_localClippingEnabled = this.localClippingEnabled;
	// 	_clippingEnabled = clipping.init( this.clippingPlanes, _localClippingEnabled, camera );
	//
	// 	currentRenderList = renderLists.get( scene, camera );
	// 	currentRenderList.init();
	//
	// 	projectObject( scene, camera, 0, _this.sortObjects );
	//
	// 	currentRenderList.finish();
	//
	// 	if ( _this.sortObjects === true ) {
	// 		currentRenderList.sort( _opaqueSort, _transparentSort );
	// 	}
	//
	// 	//
	// 	// if ( _clippingEnabled === true ) clipping.beginShadows();
	// 	//
	// 	// const shadowsArray = currentRenderState.state.shadowsArray;
	// 	//
	// 	// shadowMap.render( shadowsArray, scene, camera );
	// 	//
	// 	// currentRenderState.setupLights( camera );
	// 	//
	// 	// if ( _clippingEnabled === true ) clipping.endShadows();
	//
	// 	//
	// 	if ( this.info.autoReset === true ) this.info.reset();
	//
	// 	if ( renderTarget !== undefined ) {
	// 		this.setRenderTarget( renderTarget );
	// 	}
	//
	// 	//
	// 	background.render( currentRenderList, scene, camera, forceClear );
	//
	// 	// render scene
	// 	const opaqueObjects = currentRenderList.opaque;
	// 	const transparentObjects = currentRenderList.transparent;
	//
	// 	if ( opaqueObjects.length > 0 ) renderObjects( opaqueObjects, scene, camera );
	// 	if ( transparentObjects.length > 0 ) renderObjects( transparentObjects, scene, camera );
	//
	// 	//
	// 	if ( scene.isScene === true ) scene.onAfterRender( _this, scene, camera );
	//
	// 	//
	// 	if ( _currentRenderTarget !== null ) {
	// 		// Generate mipmap if we're using any kind of mipmap filtering
	// 		textures.updateRenderTargetMipmap( _currentRenderTarget );
	// 		// resolve multisample renderbuffers to a single-sample texture if necessary
	// 		textures.updateMultisampleRenderTarget( _currentRenderTarget );
	// 	}
	//
	// 	// Ensure depth buffer writing is enabled so it can be cleared on next render
	// 	state.buffers.depth.setTest( true );
	// 	state.buffers.depth.setMask( true );
	// 	state.buffers.color.setMask( true );
	// 	state.setPolygonOffset( false );
	//
	// 	// _gl.finish();
	// 	currentRenderList = null;
	// 	currentRenderState = null;
	// }

}

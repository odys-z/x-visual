
import * as THREE from '../../packages/three/three.module-MRTSupport';
	import {x} from '../xapp/xworld'
	import {ShaderFlag, ShaderAlpha} from '../component/visual'
	import * as xutils from './xcommon'
	import AssetKeepr from './assetkeepr'
	import GlUniform from './gluniform'

	import {_finalQuad} from './shaders/_final-quad.glsl'
	import {_filters} from './shaders/_filters.glsl'

	import {randomParticl} from './shaders/random-particl.glsl'
	import {cubeVoxels, cubeVoxelGeom} from './shaders/cube-voxels.glsl'
	import {colorLine} from './shaders/color-line.glsl'
	import {phongMorph2} from './shaders/color-array.glsl'
	import {scaleOrb} from './shaders/orb-scale.glsl'
	import {orbGroups} from './shaders/orb-groups.glsl'
	import {worldOrbs} from './shaders/orb-world.glsl'
	import {thermalTile} from './shaders/tile-thermal.glsl'
	import {texPrism} from './shaders/texprism.glsl'
	import {texEnv} from './shaders/tex-env.glsl'
	import {boxLayers, xyzLayer2} from './shaders/shape-layers.glsl'
	import {cubeTex} from './shaders/sdf-boxtex.glsl'
	import {blinkStar, pointGeom} from './shaders/blink-star.glsl'

	import {equirectex} from './shaders/equirectex.glsl'
	import {receiveShadow} from './shaders/dir-shadow.glsl'
	import {reflectex} from './shaders/reflectex.glsl'
	import {envMap, envCubeMap} from './shaders/env-map.glsl'

	import {testPoint} from './shaders/testpoint.glsl'
	import {testXFrag, testXSpec, testXDepth, finalOutline} from './shaders/testxfrag.glsl'
	import {fragShape} from './shaders/frag-shape.glsl'

/**
 * Stub for jsdoc, a collection of common methods
 * <br>This class name is all in lower case. X-visual use this convention for a
 * collection of common global methods when using jsdoc generating API doc.
 * @class xglsl
 */
class xglsl {
	/**@constructor */
	constructor() {}
}

const shaderPool = {}

/**
 * @param {int} flag @see ShaderFlag
 * @param {Visual.paras} vparas @see Visual
 * @return {object} {vertexShader, fragmentShader}<br>
 * The shaders for THREE.ShaderMaterial (using variables supported by Three.js)<br>
 * where<br>
 * return.vertextShader {string}<br>
 * return.vertextShader {string}
 * @member xglsl.randomRarticl
 * @function */
export function xvShader(flag, vparas = {}, obj3 = {}, debug) {
	// TODO share shader progam
	var s;
	switch (flag) {
		case ShaderFlag.randomParticles:
			s = randomParticl(vparas);
			break;
		case ShaderFlag.cubeVoxels:
			s = cubeVoxels(vparas);
			break;
		case ShaderFlag.flameLight:
			s = flameLight(vparas);
			break;
		case ShaderFlag.blinkStar:
			s = blinkStar(vparas);
			break;
		case ShaderFlag.colorArray:
			s = phongMorph2(vparas);
			break;
		case ShaderFlag.scaleOrb:
			// this shader needs vertex has a dir attribute
			s = scaleOrb(vparas);
			break;
		case ShaderFlag.worldOrbs:
			s = worldOrbs(vparas);
			break;
		case ShaderFlag.orbGroups:
			s = orbGroups(vparas);
			break;
		case ShaderFlag.tiledOrbs:
			// s = tileOrbs(vparas);
			s = thermalTile(vparas);
			break;
		case ShaderFlag.colorLine:
			s = colorLine(vparas);
			break;
		case ShaderFlag.texPrism:
			s = texPrism(vparas);
			break;
		case ShaderFlag.texEnv:
			s = texEnv(vparas);
			break;
		case ShaderFlag.boxLayers:
			s = xyzLayer2(vparas, obj3);
			break;
		case ShaderFlag.cubeTex:
			s = cubeTex(vparas);
			break;

		case ShaderFlag._filters:
			s = _filters(vparas, debug);
			break;
		case ShaderFlag._finalQuad:
			s = _finalQuad(vparas, debug);
			break;
		// try
		case ShaderFlag.equirectex:
			s = equirectex(vparas);
			break;
		case ShaderFlag.receiveShadow:
			s = receiveShadow(vparas);
			break;
		case ShaderFlag.reflectex:
			s = reflectex(vparas);
			break;
		// tests & stubs
		case ShaderFlag.envMap:
			s = envMap(vparas);
			break;
		case ShaderFlag.envCubeMap:
			s = envCubeMap(vparas);
			break;
		case ShaderFlag.fragShape:
			throw new XError('todo');
			break;
		case ShaderFlag.discard:
			s = discardShader(vparas);
			break;
		case ShaderFlag.testXFrag:
			s = testXFrag(vparas);
			break;
		case ShaderFlag.testXSpec:
			s = testXSpec(vparas);
			break;
		case ShaderFlag.testXDepth:
			s = testXDepth(vparas);
			break;
		case ShaderFlag.finalOutline:
			s = finalOutline(vparas);
			break;
		case ShaderFlag.testPoints:
		default:
			// console.warn('xvShader(): unrecognized shader flag: ', flag);
			s = testPoint( vparas || new Object() );// as enum doesn't exists, paras also likely undefined
	}
	if (x.log >= 5)
		console.debug(`[5] flag: ${flag.toString(16)}, paras: `,
			vparas, '\nshaders: ', s);
	return s;
}

/**Is the shader support u_alpha?
 * Shaders include AssetType.point, refPoint, GeomCurve, colorArray
 * @param {ShaderFlag} shader
 * @return {bool}
 * @member xglsl.hasUAlpha
 * @function
 */
export function hasUAlpha(shader) {
	return  shader === ShaderFlag.randomParticles ||
			shader === ShaderFlag.cubeVoxels ||
			shader === ShaderFlag.colorArray ||
			shader === ShaderFlag.colorLine;
}

/**@deprecated this function can be completely covered by cubeVoxelGeom().
 * Create geometry buffer from target mesh.
 * If shader type is randomParticles, the buffer also has attributes color and size.
 * @param {Visual.paras} vparas
 * @param {TREE.Mesh} meshSrc
 * @param {TREE.Mesh} meshTarget
 * @return {THREE.BufferGeometry}
 * @member xglsl.particlesGeom
 * @function
 */
export function particlesGeom (vparas, meshSrc, meshTarget) {
	var sizes = [];
	var colors = [];
	var noise = [];
	// var count = meshSrc.count / meshSrc.itemSize;	// count = length / 3
	var count = meshSrc.count;
	for (var c = 0; c < count; c++) {
		var color = xutils.randomRGB();
		colors.push( color.r, color.g, color.b );
		sizes.push( (Math.random() * 2 - 1 ) );

		if (vparas && vparas.a_noise)
			noise.push( (Math.random() * vparas.noise - vparas.noise / 2 ) );
	}

	var geometry = new THREE.BufferGeometry();
	geometry.setAttribute( 'position', meshSrc.clone(), 3 );

	geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 )
			.setUsage( THREE.DynamicDrawUsage ) );
	geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 )
			.setUsage( THREE.DynamicDrawUsage ) );

	if (vparas && vparas.a_noise)
		geometry.setAttribute( 'a_noise', new THREE.Float32BufferAttribute( noise, 1 )
			.setUsage( THREE.DynamicDrawUsage ) );

	// TODO case: meshsrc.count != meshTarget.count
	if (vparas && (vparas.dest || vparas.a_dest)) {
		geometry.setAttribute( 'a_dest', meshTarget.clone(), 3 );
	}
	return geometry;
}

function discardShader(paras = {}) {
  return {
	vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); } `,
	fragmentShader: `void main() { discard; }`
  };
}

/**Example:
 * See docs/design memoe/shader samples
 *
 * @param {object} vparas visual paras, same as Visual.paras
 * @member xglsl.flameLight
 * @function
 */
function flameLight(vparas) {
	throw XError("TODO");
}

export {cubeVoxelGeom, pointGeom}

import { Material, cloneUniforms, GLSL3 } from '../../packages/three/three.module-MRTSupport'

/**Is this means shader flag is actually material type?
 */
function XEquirectMatrl( parameters ) {
	parameters.isMrt = true;

	Material.call( this );

	this.type = 'XEquirectMatrl';

	this.defines = {};
	this.uniforms = {};

	this.vertexShader = equirect_vert;
	this.fragmentShader = equirect_frag;

	this.linewidth = 1;

	this.wireframe = false;
	this.wireframeLinewidth = 1;

	this.fog = false; // set to use scene fog
	this.lights = false; // set to use scene lights
	this.clipping = false; // set to use user-defined clipping planes

	this.skinning = false; // set to use skinning attribute streams
	this.morphTargets = false; // set to use morph targets
	this.morphNormals = false; // set to use morph normals

	this.defaultAttributeValues = {
		'color': [ 1, 1, 1 ],
		'uv': [ 0, 0 ],
		'uv2': [ 0, 0 ]
	};

	this.index0AttributeName = undefined;
	this.uniformsNeedUpdate = false;

	this.glslVersion = GLSL3;

	if ( parameters !== undefined ) {
		this.setValues( parameters );
	}

}

XEquirectMatrl.prototype = Object.create( Material.prototype );
XEquirectMatrl.prototype.constructor = XEquirectMatrl;

XEquirectMatrl.prototype.isRawShaderMaterial = true;

XEquirectMatrl.prototype.copy = function ( source ) {

	Material.prototype.copy.call( this, source );

	this.fragmentShader = source.fragmentShader;
	this.vertexShader = source.vertexShader;

	this.uniforms = cloneUniforms( source.uniforms );

	this.defines = Object.assign( {}, source.defines );

	this.wireframe = source.wireframe;
	this.wireframeLinewidth = source.wireframeLinewidth;

	this.lights = source.lights;
	this.clipping = source.clipping;

	// this.skinning = source.skinning;
	//
	// this.morphTargets = source.morphTargets;
	// this.morphNormals = source.morphNormals;
	//
	// this.extensions = Object.assign( {}, source.extensions );

	this.glslVersion = source.glslVersion;

	return this;

};

const equirect_vert = ``;

const equirect_frag = ``;

export { XEquirectMatrl };

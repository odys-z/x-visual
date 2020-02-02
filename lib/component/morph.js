/** @module xv.ecs.comp.anim */

const ANIMTYPE_0 = 0x40;

const AnimType = {
	ALPHA: ANIMTYPE_0 + 1,
	/** using tween.js update shader uniforms (Obj3.uniforms) */
	GL_VERTS_TRANS: ANIMTYPE_0 + 2,
	WIREFAME: ANIMTYPE_0 + 3,
	OBJ3ROTX: ANIMTYPE_0 + 4,
	OBJ3ROTAXIS: ANIMTYPE_0 + 5,
	TODO: ANIMTYPE_0 + 6,
	USER: ANIMTYPE_0 + 63,
};

const ModelSeqs = {
	properties: {
		script: [[]]	// example: test/html/mdel-morph.html
	}
};

const ModelTrans = {
	properties: {
		tweindx: [],	// current script index
		script: [[]]	// example: test/html/mdel-morph.html
	}
};

export { AnimType, ModelSeqs, ModelTrans };

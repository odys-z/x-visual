/** @module xv.ecs.comp.anim */

const ANIMTYPE_0 = 0x40;

const AnimType = {
	TODO: ANIMTYPE_0,
	USER: ANIMTYPE_0 + 1,
	ALPHA: ANIMTYPE_0 + 2,
	/** using tween.js update shader uniforms (Obj3.uniforms) */
	UNIFORMS: ANIMTYPE_0 + 3,
	U_VERTS_TRANS: ANIMTYPE_0 + 4,
	WIREFAME: ANIMTYPE_0 + 5,
	OBJ3ROTX: ANIMTYPE_0 + 6,
	OBJ3ROTAXIS: ANIMTYPE_0 + 7,
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

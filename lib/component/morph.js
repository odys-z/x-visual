/** @module xv.ecs.comp.anim */

const ANIMTYPE_0 = 0x40;

const AnimType = {
	FADEOUT: ANIMTYPE_0 + 1,
	FADEIN: ANIMTYPE_0 + 2,
	POINTS: ANIMTYPE_0 + 3,
	OBJ3ROTX: ANIMTYPE_0 + 4,
	OBJ3ROTAXIS: ANIMTYPE_0 + 5,
	TODO: ANIMTYPE_0 + 62,
	USER: ANIMTYPE_0 + 63,
};

const ModelSeqs = {
	properties: {
		script: [[]]	// example: test/html/mdel-morph.html
	}
};

const ModelTrans = {
	properties: {
		script: [[]]	// example: test/html/mdel-morph.html
	}
};

export { AnimType, ModelSeqs, ModelTrans };

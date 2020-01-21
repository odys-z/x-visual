/** @module xv.ecs.comp.anim */

const MorphType_0 = 0x20;

const MorphType = {
	FADEOUT: MorphType_0 + 1,
	FADEIN: MorphType_0 + 2,
	POINTS: MorphType_0 + 3,
	TODO: MorphType_0 + 4,
	USER: MorphType_0 + 15,
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

export { MorphType, ModelSeqs, ModelTrans };

/** @module xv.ecs.comp.anim */

const MorphType_USER = 0x20;

const MorphType = {
	USER: MorphType_USER,
	FADEOUT: MorphType_USER + 1,
	FADEIN: MorphType_USER + 2,
	POINTS: MorphType_USER + 3,
	TODO: MorphType_USER + 4,
};

const ModelSwitch = {
	properties: {
		src: undefined,
		dest: undefined,
		script: undefined,
	}
};

const ModelTrans = {
	properties: {
		src: undefined,
		dest: undefined,
		script: undefined,
	}
};

export { MorphType, ModelSwitch, ModelTrans };

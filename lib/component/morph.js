/** @namespace xv.ecs.comp.anim */

const ANIMTYPE_0 = 0x40;
const AnimCate = {
	COMBINE_AFFINE: 1 << 16,
	MASK: 0xffff << 16,
}

const AnimType = {
	USER: ANIMTYPE_0 + 1,

	ALPHA: ANIMTYPE_0 + 2,
	UNIFORMS: ANIMTYPE_0 + 3,
	U_VERTS_TRANS: ANIMTYPE_0 + 4,
	WIREFAME: ANIMTYPE_0 + 5,
	/* deprecated, replaced by ROTAXIS, used for affines + non-affine combination testing */
	ROTATEX: ANIMTYPE_0 + 6,
	ROTAXIS: ANIMTYPE_0 + 7 | AnimCate.COMBINE_AFFINE,
	ORBIT: ANIMTYPE_0 + 8 | AnimCate.COMBINE_AFFINE,
	PATH_MOVE: ANIMTYPE_0 + 9,
	TODO: ANIMTYPE_0 + 10,
};




const ModelSeqs = {
	properties: {
		script: [],
		/**Design Note:
		 * sometimes the lage data block used by other system can be chached here
		 * for MorphingAnim or XTweener etc.
		 * But what's the better way in ECS pattern?
		 * Senario: Thrender.createObj3s()
					case AssetType.geomCurve */
		chache: undefined,
	}
};

export { AnimType, ModelSeqs, AnimCate };

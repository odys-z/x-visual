/** @const
 * @memberof xv.ecs.comp.anim */
const ANIMTYPE_0 = 0x40;
/**@type AnimCate
 * @memberof XComponent */
const AnimCate = {
	COMBINE_AFFINE: 1 << 16,
	MASK: 0xffff << 16,
}

/**@type AnimType
 * @memberof XComponent  */
const AnimType = {
	USER: ANIMTYPE_0 + 1,

	POSITION: ANIMTYPE_0 + 2 | AnimCate.COMBINE_AFFINE,
	ALPHA: ANIMTYPE_0 + 3,
	UNIFORMS: ANIMTYPE_0 + 4,
	U_VERTS_TRANS: ANIMTYPE_0 + 5,
	WIREFAME: ANIMTYPE_0 + 6,
	/* deprecated, replaced by ROTAXIS, used for affines + non-affine combination testing */
	ROTATEX: ANIMTYPE_0 + 7 | AnimCate.COMBINE_AFFINE,
	ROTAXIS: ANIMTYPE_0 + 8 | AnimCate.COMBINE_AFFINE,
	ORBIT: ANIMTYPE_0 + 9 | AnimCate.COMBINE_AFFINE,
	PATH_MOVE: ANIMTYPE_0 + 10,
	TODO: ANIMTYPE_0 + 11,
};


/**@type ModelSeqs
 * @memberof XComponent  */
const ModelSeqs = {
	properties: {
		script: [],
		/**Design Note:
		 * sometimes the lage data block used by other system can be chached here
		 * like vertices creted by Thrender, for MorphingAnim or XTweener etc.
		 * But what's the better way in ECS pattern?
		 * Senario: Thrender.createObj3s()
					case AssetType.geomCurve */
		cache: undefined,
	}
};

export { AnimType, ModelSeqs, AnimCate };

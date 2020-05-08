/** @const
 * @memberof xv.ecs.comp.anim */
const ANIMTYPE_0 = 0x40;
/**Animation type ({@link AnimType}) category / mask.
 * @enum {int}
 * @memberof XComponent */
const AnimCate = {
	/** cate: affine combination */
	COMBINE_AFFINE: 1 << 16,
	/** cate mask */
	MASK: 0xffff << 16,
}

/**
 * @readonly
 * @enum {number}
 * @memberof XComponent  */
const AnimType = {
	/** User defined animation - not supported in v1.0 */
	USER: ANIMTYPE_0 + 1,

	/** Model translation */
	POSITION: ANIMTYPE_0 + 2 | AnimCate.COMBINE_AFFINE,
	/** Alpah change */
	ALPHA: ANIMTYPE_0 + 3,
	/** Uniform change */
	UNIFORMS: ANIMTYPE_0 + 4,
	/** Vertex translate morphing */
	U_MORPHi: ANIMTYPE_0 + 5,
	/** ?? */
	WIREFAME: ANIMTYPE_0 + 6,
	/** <b>DEPRECATED</b><br>
	 * replaced by ROTAXIS, used for affines + non-affine combination testing */
	ROTATEX: ANIMTYPE_0 + 7 | AnimCate.COMBINE_AFFINE,
	/** Rotate around axis */
	ROTAXIS: ANIMTYPE_0 + 8 | AnimCate.COMBINE_AFFINE,
	/** Orbit around pivot */
	ORBIT: ANIMTYPE_0 + 9 | AnimCate.COMBINE_AFFINE,
	/** Move alone path */
	PATH_MOVE: ANIMTYPE_0 + 10,
	/** Shader material with color changing */
	SHADER_COLOR: ANIMTYPE_0 + 11,
	/** Extending */
	TODO: ANIMTYPE_0 + 12,
};


/**Model sequences.
 * @class ModelSeqs
 * @memberof XComponent  */
const ModelSeqs = {
	properties: {
		/**Sequences of animation scripts.
		 * @property {array} script -
		 * @member ModelSeqs#script
		 * @memberof XComponent
		 */
		script: undefined,
		/**On sequence finished handling functions.
		 * @property {arrey=} fFinished -
		 * @member ModelSeqs#fFinished
		 * @memberof XComponent
		 */
		fFinished: undefined,
		/**Design Note:
		 * sometimes the lage data block used by other system can be chached here
		 * like vertices creted by Thrender, for MorphingAnim or XTweener etc.<br>
		 * But what's the better way in ECS pattern?<br>
		 * Senario: Thrender.createObj3s()<br>
		 * case AssetType.GeomCurve
		 * @property {array} script -
		 * @member ModelSeqs#cache
		 * @memberof XComponent
		 */
		cache: undefined,
	}
};

export { AnimType, ModelSeqs, AnimCate };

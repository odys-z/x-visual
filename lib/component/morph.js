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

/**Animation types.
 * @enum {number}
 * @memberof XComponent  */
const AnimType = {
	/** User defined animation - not supported in v1.0 */
	USER: ANIMTYPE_0 + 1,

	/** Model translation */
	POSITION: ANIMTYPE_0 + 2 | AnimCate.COMBINE_AFFINE,
	/** Model scale */
	SCALE: ANIMTYPE_0 + 3 | AnimCate.COMBINE_AFFINE,
	/** Alpah change */
	ALPHA: ANIMTYPE_0 + 9,
	/** Uniform change */
	UNIFORMS: ANIMTYPE_0 + 10,
	/** Vertex translate morphing in vertex uniforms */
	U_MORPHi: ANIMTYPE_0 + 11,
	/** Uniform pos morphing
	 * - tweening Obj3.mesh.unfiorms.wpos alone Obj3.datum.path,
	 * which is created by Thrender case like AssetType.PathTube.<br>
	 * @see MorphingAnim.attachShaderPosTween */
	U_PATH_MORPH: ANIMTYPE_0 + 12,
	// /** temp: Uniform pos morphing, with count specifying position number */
	// U_PATH_MORPHn: ANIMTYPE_0 + 13,
	/** Uniform pos morphing, with path dir */
	PATH_MOVE_Dir: ANIMTYPE_0 + 14 | AnimCate.COMBINE_AFFINE,
	/** ?? */
	WIREFAME: ANIMTYPE_0 + 15,
	/** <b>DEPRECATED</b><br>
	 * replaced by ROTAXIS, used for affines + non-affine combination testing */
	ROTATEX: ANIMTYPE_0 + 16 | AnimCate.COMBINE_AFFINE,
	/** Rotate around axis */
	ROTAXIS: ANIMTYPE_0 + 17 | AnimCate.COMBINE_AFFINE,
	/** Orbit around pivot */
	ORBIT: ANIMTYPE_0 + 18 | AnimCate.COMBINE_AFFINE,
	/** Move alone path */
	PATH_MOVE: ANIMTYPE_0 + 19,
	/** Shader material with color changing */
	SHADER_COLOR: ANIMTYPE_0 + 20,
	/** Extending */
	TODO: ANIMTYPE_0 + 32,
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
		 * @property {array=} fFinished -
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

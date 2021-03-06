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
 * @enum {int}
 * @memberof XComponent  */
const AnimType = {
	/** User defined animation - not supported in v1.0 */
	USER: ANIMTYPE_0 + 1,

	/** Model translation */
	POSITION: ANIMTYPE_0 + 2 | AnimCate.COMBINE_AFFINE,
	/** Model scale */
	SCALE: ANIMTYPE_0 + 3 | AnimCate.COMBINE_AFFINE,
	/** Alpah change @deprecated replaced by U_ALPHA */
	ALPHA: ANIMTYPE_0 + 8,
	/**<p id='animtype-ualpha'>uniform u_alpha animation</p>
	 * Tween's of this uniform can be updated to children - handled by
	 * {@link XTweener}.*/
	U_ALPHA: ANIMTYPE_0 + 8,
	/** Uniform change - @deprecated? */
	UNIFORMS: ANIMTYPE_0 + 9,
	U_t: ANIMTYPE_0 + 9,
	/** <p id='animtype-unow'>current time (ms)</p>
	 * U_NOW is acctually not a tweened variable.
	 * XTweener just keep update unforms.u_now with cuurent time. */
	U_NOW: ANIMTYPE_0 + 10,
	/** Vertex translate morphing in vertex uniforms */
	U_MORPHi: ANIMTYPE_0 + 11,
	/** Uniform pos morphing
	 * - tweening Obj3.mesh.unfiorms.wpos alone Obj3.datum.path,
	 * which is created by Thrender case like AssetType.PathTube.<br>
	 * @see MorphingAnim.attachShaderPosTween */
	U_PATH_MORPH: ANIMTYPE_0 + 12,
	/**Uniform pos morphing, with count specifying position number */
	U_PATHn_MORPH: ANIMTYPE_0 + 15,


	/** ?? */
	WIREFAME: ANIMTYPE_0 + 21,
	/** <b>DEPRECATED</b><br>
	 * replaced by ROTAXIS, used for affines + non-affine combination testing */
	ROTATEX: ANIMTYPE_0 + 22 | AnimCate.COMBINE_AFFINE,
	/** Rotate around axis */
	ROTAXIS: ANIMTYPE_0 + 23 | AnimCate.COMBINE_AFFINE,
	/** Orbit around pivot */
	ORBIT: ANIMTYPE_0 + 24 | AnimCate.COMBINE_AFFINE,
	/** Move alone path */
	PATH_MOVE: ANIMTYPE_0 + 25,
	/** Shader material with color changing */
	SHADER_COLOR: ANIMTYPE_0 + 26,
	/** Extending */
	TODO: ANIMTYPE_0 + 32,
};

/**Animation script sequences.
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
		/**On sequence finished handling functions. For example,
		 * see test/html/morph-events.html, affine-dynamic-target.html.
		 * @property {function=} fFinished - fFinished(seq, twidx)
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


/**Component for boxes in an area.
 *
 * @class BoundCubes
 * @memberof map3
 */
const CBoundCubes = {
  properties: {
	/**Filtering area constructed as {@link XComponent.Obj3Type.GeoPrism},
	 * only feature.properties.area === only will be created, ignoring others.
	 * If undefined, ignore this condition - all prisms will be constructed. */
	only: undefined,
	/** resource uri. If present, will load freature asynchronously */
	uri: undefined,
	area: undefined,
	boxes: undefined
  }
};

export {CBoundCubes}

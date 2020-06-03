Visual.paras
============

.. _visual-paras:

Visual.paras has different usage for different vtype. See :ref:`visual-renderer`
for general information about Visual component.

Shared for different vtype
--------------------------

- tex_alpha

Range 0 ~ 1, for any object's material accepting alpha channel (Three.js Object3D.opacity).

- uniforms

These parameters are merged into THREE.Material's uniforms property.

paras only for ShaderFlag enabled
---------------------------------

X-visual extended some shaders for special visual effects. The following parameters
can be meaningful only for these shaders.

- paras.u_tex

A string pointing to file in 'asset' folder. If the is not undefined, the vtype's
flag, ShaderFlag.defaultex is ignored.

u_tex is a shader's uniforms parameter, which means only Visual using THREE.ShaderMaterial
can has a u_tex parameter.

In v0.2.40 ~ v0.3, *u_tex* is an array for shader of ShaderFlag = colorArray.

paras only for vtype = point or refPoint
----------------------------------------

It's been used for vtype = :ref:`AssetType.refPoint<vtype-refPoint>` or
:ref:`AssetType.point<vtype-point>`.

For these vtype, it's usually used together with :ref:`animtype-u-morphi`
and :ref:`animtype-uniform`.

Check it for how Visual.paras and ModelSeqs.script.paras work together to change
glsl/shaders behaviour.

If the Visual.asset specified a gltf asset, the gltf mesh will be converted into
visible points, as particles (e.g. the vertices are tweened with uniforms).

If the Visual.asset parameter is null or undefined, the Obj3.mesh will be created
by Thrender using this entity.Visual.paras.obj3type, which can be one of geometry
type of :ref:`XComponent <api-xcomponents>` value.

- paras.nodes

This parameter used only for creating mesh from gltf assets. It's a string array
of node's name in gltf. Model of these nodes will be converted into points.

- paras.paths

This parameter used only for creating mesh from svg assets. It's a string array
of path names in svg.

-- For AssetType.refPoint

TODO test case as example.

-- For AssetType.voxel

A `Voxel <https://en.wikipedia.org/wiki/Voxel>`_ is handled in x-visual as a single
WebGl point.

- paras.noise

If true, the generated Object3D object will have a 'a_noise' attribute. For animation
type :ref:`AnimType.U_MORPHi <animtype-u-morphi>` and :ref:`AnimType UNIFORM<animtype-uniform>`,
this value is used for scale the distance.

** Not implemented **

- paras.vert_scale

A **string** for vertex size scale. Here is how the default particles vertex shader
handling this parameter.

.. code-block:: javascript

    gl_PointSize = size * `${paras.vert_scale || '10.0'}`;
..

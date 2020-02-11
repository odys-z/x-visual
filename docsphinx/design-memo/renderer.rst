Visual & Renderers
==================

Visual Component
----------------

The Visual Component specify the visual effect such as materail texture asset or wireframe type.

Obj3 Component
--------------

The Obj3 Component specify the geometry or shape such as plane, box or path type.

Thrender the Default
--------------------

Thrender is the xv default renderer, handling Visual and Obj3 components. Created by xworld.startUpdate().

Example:

.. code-block:: javascript

        var cube = ecs.createEntity({
            id: 'cube0',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],    // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    // Three use document to load assets, which doesn't exist whil testing
                    // null acts as a flag to let thrender create a ram texture.
                    asset: null },
            });
..

Visual.vtype & Obj3.geom Handling
+++++++++++++++++++++++++++++++++

Visual.vtype specify an AssetType;

Obe3.geom specify shape or model type.

When Thrender is created by xworld.startUpdate(), all entities' Obj3 components
will been converted to a scene object, with visual effect of Visual component.

Model geometry and materail are good examples to get this idea. Another is the
point visual and points object, where point is a visual effect a points array,
the scene object consists many points.

Visual.vtype
____________

- AssetType.point

The created `THREE.Object3D <https://threejs.org/docs/#api/en/core/Object3D>`_
will be rendered as an array of WebGl points.

The point type's material can only be a `THREE.ShaderMaterial <https://threejs.org/docs/index.html#api/en/materials/ShaderMaterial>`_.

If the Visual.asset specified a gltf asset, the gltf mesh will be converted into
visible points, as particles (e.g. the vertices are tweened with uniforms).

If the Visual.asset parameter is null or undefined, the Obj3.mesh will be created
by Thrender using this entity.Visual.paras.obj3type, which can be one of
:ref:`Obj3Type component<api-component-obj3type>` value.

-- paras.nodes

This parameter used only for creating mesh from gltf assets. It's a string array
of node's name in gltf. Model of these nodes will be converted into points.

- AssetType.refPoint

TODO test case as example.

- AssetType.voxel

A `Voxel <https://en.wikipedia.org/wiki/Voxel>`_ is handled in x-visual as a single
WebGl point.

Visual.asset
____________

Specify a gltf asset file, e.g. int the test case of html/gltf:

::

    test/html/gitf-city.html/script/Citysys.initCity(),

    Visual.asset: 'city/scene.gltf'

The file located in 'assets/city/scene.gltf' and referenced bin file together with
texture files are loaded by :ref:`xv-gltf-loader` of gltf loader.

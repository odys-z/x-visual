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

Point type's material can only be a `THREE.ShaderMaterial <https://threejs.org/docs/index.html#api/en/materials/ShaderMaterial>`_.

- AssetType.refPoint

Same as *point*, except that this type use the *asset* property specifying entity id
of which the vertices' position is copied from, the entity's Obj3.mesh.

Point type's material can only be a `THREE.ShaderMaterial <https://threejs.org/docs/index.html#api/en/materials/ShaderMaterial>`_.

Visual.paras
____________

For point & refPoint
....................

Visual.paras has different usage for different vtype.

It's been used for vtype of :ref:`vtype-refPoint`, :ref:`vtype-point`.

For these vtype, it's usually used together with :ref:`animtype-u-verts-trans` and :ref:`animtype-uniform`.

Check it for how Visual.paras and ModelSeqs.script.paras work together to change glsl/shaders behaviour.

If the Visual.asset specified a gltf asset, the gltf mesh will be converted into
visible points, as particles (e.g. the vertices are tweened with uniforms).

If the Visual.asset parameter is null or undefined, the Obj3.mesh will be created
by Thrender using this entity.Visual.paras.obj3type, whhich can be one of 
:ref:`Obj3Type component<api-component-obj3type>` value.

TODO test case as example.

-- paras.nodes

String array of node's name. Model of these nodes will be converted into points.

-- paras.noise

If true, the generated Object3D object will have a 'a_noise' attribute. Fo animation
type :ref:`animtype-u-verts-trans` and :ref:`animtype-uniform`, this value is used for
scale the distance.

-- paras.vert_scale

A string for vertex size scale: 

.. code-block:: cpp

    gl_pointSize = 3.0 * vert_scale;
..

Visual.asset
____________

Specify a gltf asset file, e.g. int the test case of html/gltf:

::

    test/html/gitf-city.html/script/Citysys.initCity(),

    Visual.asset: 'city/scene.gltf'

The file located in 'assets/city/scene.gltf' and referenced bin file together with
texture files are loaded by :ref:`xv-gltf-loader` of gltf loader.

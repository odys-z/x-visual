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


Components
==========

Example
-------

using components to defining an Entity

With npm:

::

    npm i x-visual

and the js example for webpack:

.. code-block:: javascript

    import * as xv from 'x-visual'

    // Obj3: { geom: xv.XComponent.Obj3Type.BOX,
    // ...
..

Or in plain js:

.. code-block:: html

    <script type='text/javascript' src='../../dist/xv-0.1.0.min.js'></script>
..

.. code-block:: javascript

    // usage
    var cube = ecs.createEntity({
        id: 'cube0',
        UserCmd: {},
        CmdFlag: {},
        Obj3: { geom: xv.XComponent.Obj3Type.BOX,
                box: [200, 120, 80],    // bounding box
                // mesh is inited by thrender, can be ignored here - CmpTween's target
                mesh: undefined },
        Visual:{vtype: xv.AssetType.mesh,
                asset: 'tex/byr0.png' },
    });
..

Components Definitions
----------------------

Common Enums
____________

X-visual defined some consts used as a contract between application and x-visual.

These consts is documented as enum in `API doc / XComponent <https://odys-z.github.io/javadoc/x-visual/XComponent.html>`__.

.. _animcate:

AnimCate
++++++++

Mask of affine transformation related animation.

declared in: lib/component/morph.js

.. _animtype:

AnimType
++++++++

Supported Animation types.

defined in: lib/component/morph.js

AssetType
+++++++++

Visual form.

xv.Thrender use this to create THREE.Object3D.

declared in: lib/component/visual.js

Obj3Type
++++++++

Mesh geometry type.

xv.Thrender use this to create THREE.BufferGeometry.

TODO renamed as GeomType.

ShaderFlag
++++++++++

A code for which shader provided by x-visual can be used.

declared in: lib/component/visual.js

.. _api-xcomponents:

API Doc: XComponent
===================

All components provided by x-visual are exported in xv.XComponent.
See `API doc / XComponent <https://odys-z.github.io/javadoc/x-visual/XComponent.html>`__.

For extension components, see `chart <https://odys-z.github.io/javadoc/x-visual/chart.html>`_.

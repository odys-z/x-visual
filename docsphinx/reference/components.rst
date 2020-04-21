Components
==========

Example
-----------------------------------------------

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

.. _animcate:

AnimCate
++++++++

.. literalinclude:: ../../lib/component/morph.js
   :language: javascript
   :lines: 3-7
   :linenos:

.. _animtype:

AnimType
++++++++

Supported Animation types are defined in x-visual/component/morph.js:

.. literalinclude:: ../../lib/component/morph.js
   :language: javascript
   :lines: 9-20
   :linenos:

AssetType
+++++++++

.. literalinclude:: ../../lib/component/visual.js
   :language: javascript
   :lines: 2-29
   :linenos:

ShaderFlag
++++++++++

.. literalinclude:: ../../lib/component/visual.js
   :language: javascript
   :lines: 30-42
   :linenos:

API Doc: XComponent
===================

All components provided by x-visual are exported in xv.XComponent.
See `API doc / XComponent <../jsdoc/XComponent.html>`_.

For extension components, see `chart <../jsdoc/chart.html>`_.

.. raw:: html
    <embed>
        <iframe src='../jsdoc/XComponent.html' style="width:100%; height: 800px"></iframe>
	<embed>

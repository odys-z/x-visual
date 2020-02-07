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

AnimType
++++++++

Supported Animation types are defined in x-visual/component/morph.js:

.. literalinclude:: ../../lib/component/morph.js
   :language: javascript
   :lines: 5-20
   :linenos:

AssetType
+++++++++

.. literalinclude:: ../../lib/component/visual.js
   :language: javascript
   :lines: 6-19
   :linenos:

ShaderType
++++++++++

.. literalinclude:: ../../lib/component/visual.js
   :language: javascript
   :lines: 20-24
   :linenos:

Visual
++++++

.. literalinclude:: ../../lib/component/visual.js
   :language: javascript
   :lines: 25-35
   :linenos:


.. _api-component-obj3type:

Obj3Type
++++++++

.. literalinclude:: ../../lib/component/obj3.js
   :language: javascript
   :lines: 4-37
   :linenos:

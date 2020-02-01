Components
==========

Visual
------

plain js

.. code-block: javascript
    xv.XComponents.Visual
..

npm i x-visual

.. code-block: javascript
    import * as xv from 'x-visual'
    /** usage
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
     */
..

Tween & Animation
-----------------

- :

.. code-block: json

    {
    }

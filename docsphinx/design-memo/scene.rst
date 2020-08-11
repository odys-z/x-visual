Scene & HUD
===========

Main Scene
----------

Objects including mesh, line & points are rendered in main scene, except one component,
HudGroup and it's children.

The :ref:`Hello XWorld in guide page<guide-hello-xworld>` is a simple example for
how to create main scene objects.

Main Scene Light
________________

Main scene use a modified Three.js `HemisphereLight <https://threejs.org/docs/#api/en/lights/HemisphereLight>`_.

The default parameters::

    skyColor: #xffffbb
    groundColor: #x080820
    intensity: 1.1
    position: [1, 1, 1]

To configure it, set parameters via `Lighting#set() <https://odys-z.github.io/javadoc/x-visual/light.html>`_.

X-visual use this singleton parameter globally. When the object using material
of Three.js, the light effects is exactly the same with examples of Three.js.

But x-visual use a diffuse light with direction (the light position) and a specular
color use the light as point light. This is illustrated in the
:ref:`test case: light<test-xworld-light>`.

The diffuse color is the same as skyColor, and groundColor used as ambient color.

An object in scene has it's own specular properties, so an object can be configured
with Visual.paras:

.. code-block:: javascript

    Visual: {
      paras: {
        shininess: 1,
        specular: [1, 0, 1]
      }
    }
..

HUD
---

If an entity has HudGroup, x-visual will create a HUD of plane object, and all
HudChild entities.

A HudChild must has a HudChild.hud parameter equals parent group's entity id. i.e.
entity id defined in HudGroup's entity.

HUD Light
_________

TODO doc...

HUD Example
___________

These 2 objects are created as an HUD plane and a box in it.

.. code-block:: javascript

    var hud = ecs.createEntity({
        id: 'hud0',
        Obj3: { geom: undefined,     // ignored, always PLANE
                box: [60, 20, 0],
                transform: [{translate: [-100, 80, -100]}],
                mesh: undefined },
        Visual:{vtype: undefined,    // ignored, always mesh
                paras: {alpha: 0.3},
                asset: 'tex/byr0.png'},
        HudGroup: { }
    });

    var box = ecs.createEntity({
        id: 'cube0',
        Obj3: { geom: xv.XComponent.Obj3Type.BOX,
                box: [16, 16, 16],
                group: 'hud0',
                mesh: undefined },
        GpuPickable: {},    // FIXME Not supported
        Visual:{vtype: xv.AssetType.mesh,
                asset: 'tex/ruler256.png'
            },
        HudChild: { hud: 'hud0' }
    });
..

For the complete example, see test/html/hud.html.

Post Effects
============

Post Effects are a serials of post visual effect compositon supported by
`ThreeJS EffectComposer <https://threejs.org/docs/index.html#examples/en/postprocessing/EffectComposer>`_
and Passes. See `article from threejs fundamental.org <https://threejsfundamentals.org/threejs/lessons/threejs-post-processing.html>`_.

x-visual Passes & Composer
--------------------------

Currently x-visual is trying to make these effects can be plugged in orthogonally.

Design Pattern v0.2
___________________

- Abstratct Base Class: Orthocclude

::

    1. pack up Passes as an effect composer
    2. ask subclass.getEffectPass() for {effects, layers}, where effects is an
       array of Pass elements. Layers in Obj3 are already ready for rendering
       effects or used for occluding. E.g. in PathEffect#getEffectPass():

       if (e.Occluder && e.Occluder.FlowingPath)
           e.Obj3.occluding |= 1 << LayerChannel.FLOWING_PATH ;
       e.Obj3.layers |= 1 << LayerChannel.FLOWING_PATH ;

    3. render with composer in update() - subclass shouldn't rendering by themselves
       3.1 use obj3's layers replacing mesh's layers
       3.2 render with composer (camera.layers = this.layers)

- Orthogonal Effects, e.g. FlowingPath

For example, in FlowingPath

::

    1. compact several effect passes like render pass, blooming pass, etc.,
    2. setup a layer mask,
    3. then enable object mask saved to entities Obj3.layers.

- Helping steps in XWorld & Thrender

::

    1. add functions to THREE.Layers (used in Object3D, e.g. Obj3.mesh)
    2. add call backs to ECS.ECS.createEntity(), makes some added components trigger
       some options, and creating some subsystem like PathEffect and FinalComposer
    3. thrender will use final composer rendering scene in update() if it's triggered

[`EffectComposer <https://threejs.org/docs/#examples/en/postprocessing/EffectComposer>`_]
[`Pass.js (no docs) <https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/Pass.js>`_]

TODO docs ...

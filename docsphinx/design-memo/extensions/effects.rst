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

About the Three Module Issue
----------------------------

.. attention:: It's worth to have a note after days of debugging.
..

EffectComposer and its depending passes are not included in the threejs bundle.
This makes x-visual have to import these modules via both by npm *three/examples/*
or by copying directly the source files.

As x-visual is using Mocha for test, the former method leads to another problem,
(see the *packages/README*,) which makes the latter method the only plausible way
- as to his knowledge limitation.

But the using threejs module source presented another issue, classes supposed to
be the same class are not as expected when checking with "instanceof".

There is a good example showing this issue.

In lib/sys/ext/finalcomposer.js, the system create a *ShaderPass* with a
THREE.ShaderMaterial will makes *ShaderPass* failed to check the the instance.

There are similar issue like `this question <https://stackoverflow.com/questions/47481703/three-effectcomposer-is-not-a-constructor/49211046>`_.

The code snippet causing the issue in lib/sys/ext/finalComposer.js/FinalComposer:

.. code-block:: javascript

    import * as THREE from 'three'
    import {ShaderPass} from  '../../../packages/three/postprocessing/ShaderPass'
    import {EffectComposer} from  '../../../packages/three/postprocessing/EffectComposer'

    class FinalComposer extends XSys {
        effects(x) {
            var effects = x.composer;
            effects.renderToScreen = false;
            this.effectPass = effects;

            this.finalCompose = new EffectComposer( x.renderer );

            var finalPass = new ShaderPass(
                // Should from packages/three.module.js, instead of THREE.ShaderMaterial
                new THREE.ShaderMaterial( {
                    uniforms: {
                        texScene: { value: null },
                        texEffects: { value: effects.renderTarget2.texture },
                    },
                    vertexShader: finalVert,
                    fragmentShader: finalFrag,
                } ),
                "texScene");
            finalPass.renderToScreen = true;
            this.finalCompose.addPass( finalPass );
        }
    }
..

The final composer sharing texture from effects composer (*effects*) rendering
target is essential to the result.

**Here is where the problem comes from**:

The packages/three/postprocessing/ShaderPass constructor check the *shader* arguments
with "*insanceof ShaderMaterial*" which is actually another class from ../three.module.js,
leading to an unexpected result.

.. literalinclude:: ../../../packages/three/postprocessing/ShaderPass.js
   :language: javascript
   :lines: 5-40
   :linenos:

Debug Notes
===========

Three.js #14635
---------------

test case::

    test/html/greate-cd.html

About the Three Module Issue
----------------------------

.. attention:: This issue should no longer exists because all imports from
   packages/three/three.module.js are now directly from *three* package - not verified.
..

.. note:: It's worth to have a note after days of debugging.
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

.. literalinclude:: ../../packages/three/postprocessing/ShaderPass.js
   :language: javascript
   :lines: 5-40
   :linenos:

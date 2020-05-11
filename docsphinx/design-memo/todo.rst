Tasks
=====

TODO
----

1. Optimize anti-aliasing

see `Three.js Texture <https://threejsfundamentals.org/threejs/lessons/threejs-textures.html>`_.

Issues
------

1. ModelSeqs can't handle asynchronously loaded mesh

test case: html/gltf-car.html

Problem: If setting animation sequence start at 0 (any but Infinity) on a gltf
mesh, then the target Obj3.mesh won't being ready when playing started.

Loading the gltf nodes is an asynchronous process, of which the node objects can
only been ready for rendering latter.

Code snippet of starting Tween animation in AffineCombiner.update():

.. code-block:: javascript

    if (!e.CmpTweens.idle) {
        if (e.CmpTweens.playRising) {
            e.Obj3.m0.setByjs(e.Obj3.mesh.matrix);
        }
        ...
..

Code snippet of Thrender.createObj3s() AssetType.gltf branch:

.. code-block:: javascript

    AssetKeepr.loadGltfNodes(e.Obj3, `assets/${e.Visual.asset}`,
        nds,
        (nodes) => {
            // Too late to push mesh into mes now, add to scene directly
            if (scene && nodes) {
                for (var n of nodes) {
                    if (e.Obj3 && e.Obj3.transform) {
                        var m4 = new mat4();

                        if (e.Visual.paras && e.Visual.paras.withTransform)
                            m4.setByjs(n.matrix);

                        for (var trs of e.Obj3.transform)
                            m4.appAffine(trs);

                        n.matrixAutoUpdate = false;
                        m4.put2js(n.matrix);
                        e.Obj3.mesh = n;
                    }
                    scene.add(n);
                }
            }
        });
..

`Jsdoc API - AssetKeepr <../jsdoc/AssetKeepr.html>`_

Wish List
---------

- Animize Letters

See `Ilmari Heikkinen, Animating a Million Letters Using Three.js <https://www.html5rocks.com/en/tutorials/webgl/million_letters>`_

- Tween.js Extension

E.g. Noisy Easing

- Extends GPU picking with points picking

This needs implementing a point shader for GPU picking.

- Tween.glsl

`Jet Blue already had tried this <https://stackoverflow.com/questions/35328937/how-to-tween-10-000-particles-in-three-js>`_ :

.. code-block:: cpp

    // Vertex Shader

    uniform float elapsedTime;
    uniform float duration;
    attribute vec3 targetPosition;

    float exponentialInOut( float k ){
        // https://github.com/tweenjs/tween.js/blob/master/src/Tween.js
        if( k <= 0.0 ){
            return 0.0;
        }
        else if( k >= 1.0 ){
            return 1.0;
        }
        else if( ( k *= 2.0 ) < 1.0 ){
            return 0.5 * pow( 1024.0, k - 1.0 );
        }
        return 0.5 * ( - pow( 2.0, - 10.0 * ( k - 1.0 ) ) + 2.0 );
    }

    void main(){

        // calculate time value (also vary duration of each particle)
        float t = elapsedTime / ( duration * ( 1.0 + randomNum.x ) );

        // calculate progress
        float progress = exponentialInOut( t );

        // calculate new position (simple linear interpolation)
        vec3 delta = targetPosition - position;
        vec3 newPosition = position + delta * progress;

        // something
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
    }
..

- Tween.affine

Have tweening transformation combinable.

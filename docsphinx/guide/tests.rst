Test Case Explained
===================

.. _test-morph:

Morphing transform & color
--------------------------

case: AnimType.ALPHA, UNIFORMS, U_MORPHi
________________________________________

html file: test/html/morph-model.html

The test defined 2 box object, with the 3rd as points referencing the boxes' vertices
and moving the points while changing the alpha.

.. image:: imgs/002-case-morph-model.jpg
    :width: 420px

A test case for basic morphing scripts.

.. literalinclude:: ../../test/html/morph-model.html
   :language: javascript
   :lines: 73-115
   :linenos:

In MorphSeqs.script, the moving points, entity id of 'points', is defined as a
*refPoint*, which makes the points object will be created according to the referenced
object's mesh vertices, defined with *asset* = "entity1".

The morphing target is defined with uniforms.a_dest = 'entity2'. Tween value is
been tweened in between values defined in *u_morph* = [0, 1]. This makes vertices
of *points* will moving between box of *entity1* & *entity2*.

In this case only *u_morph* and *u_alpha* are supported by shader *randomParticles*.

case: AnimType.POSITION
_______________________

html file::

    test/html/morph-model.html

This test shows how to update target position and use a animation to move to there.

.. literalinclude:: ../../test/html/dynamic-tween-target.html
   :language: javascript
   :lines: 56-73
   :linenos:

The user command interaction is handled in TestDynamicPos.update().

.. _test-gltf:

case: AnimType.gltf
___________________

html file::

    test/html/gltf-city.html
    test/html/gltf-car.html
    test/html/gltf-verts.html

About nodes' transformation:

The gltf nodes include a property of matrix, which is usually set by assets' artists.
As gltf nodes can be a tree structure, loading some nodes can cause problem if
applying the node's transformation.

The x-visual provide a brutal solution for this - just ignore all transformation.
User can specify each node's transformation in Obj3. The gltf-car.html used both
methods. The road is using the gltf transformation, withTransform = true; while
cars completely ignored all transformation and configured with a new set of paras.

.. image:: imgs/003-gltf-car.jpg

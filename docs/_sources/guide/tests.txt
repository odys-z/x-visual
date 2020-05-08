Test Case Explained
===================

.. _test-morph:

Morphing transform & color
--------------------------

- case: test/html/morph-model.html

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

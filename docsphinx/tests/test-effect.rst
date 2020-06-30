.. _test-effect:

Test - Postprocessing
=====================

Cate: Occluding (PointGeom)
---------------------------

case: FlowingPath Occluding
___________________________

html file::

    test/html/flowing-path-occluding.html

The code snippet shows flowing path effect is occluded with a plane.

.. literalinclude:: ../../test/html/flowing-path-occlude.html
   :language: javascript
   :lines: 55-65
   :linenos:

This file also show a user defined curve:

.. literalinclude:: ../../test/html/flowing-path-occlude.html
   :language: javascript
   :lines: 79-90
   :linenos:

As The plane entity is specified as an FlowingPath Occluder, it has post effects
on all entities of FlowingPath - part of yellow line's post processing is occluded.

.. image:: imgs/004-post-flowingpath.jpg

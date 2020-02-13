Obj3 & Scene
============

This component is used for `THREE.Object3D <https://threejs.org/docs/index.html#api/en/core/Object3D>`__
definition.

Obj3 is defined in component/obj3.js.

.. _obj3-transform-guide:

Obj3.transform
--------------

.. note:: *Obj3.transform* are parameters used only for creating THREE.Object3D
    object. Any further updating for animation are processed via Obj3.mesh properties.

..

Initial object transform. (TODO re-implement rotation animation using this.)

Supported transform properties include:

::

    translate, scale, shear, rotation, reflect

.. image:: imgs/002-transformatrix.svg
    :width: 600px

`from Wikipedia [CC BY-SA 3.0] <https://en.wikipedia.org/wiki/Transformation_matrix#/media/File:2D_affine_transformation_matrix.svg>`_

TODO Example

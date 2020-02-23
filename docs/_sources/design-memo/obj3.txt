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

Supported transform properties include 5 affine transformation in the exactly
following sequence:

::

    translate, rotate, reflect, shear, scale

.. image:: imgs/002-transformatrix.svg
    :width: 600px

`from Wikipedia [CC BY-SA 3.0] <https://en.wikipedia.org/wiki/Transformation_matrix#/media/File:2D_affine_transformation_matrix.svg>`_

TODO Example

Shear is defined as:

.. code-block:: json

    {x_y, x_z, y_x, y_z, z_x, z_y}
..

where x_y stands for shear x with y, a.k.a x is changed wile increasing y in scale
x_y, a.k.a mat4[1, 2] = x_y, a.k.a x' = m11 * x + x_y * y.

The 3D shear matrix is defined as:

::

    m =
    11   x_y  x_z  tx
    y_x  22   y_z  ty
    z_x  z_y  33   tz
    41   42   43   w

Affine Transformation References:

`[1] Maths - Affine Transformations <https://www.euclideanspace.com/maths/geometry/affine/index.htm>`_

`[2] Affine Transformation, wikipedia <https://en.wikipedia.org/wiki/Affine_transformation>`_

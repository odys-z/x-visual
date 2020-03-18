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

Obj3.affines & combined
------------------------

This 2 properties ara similar to the mesh.matrix4, except that it's created by
animizer and tweened by XTtweener.

Affines is an array of affine object, where affine can be:

::

    translate: vec3
    rotate: radian
    scale: number

Reflect and Shear are not supported as THREE.Matrix4 seams can only been decomposed into
rotation, translation and scale.

See `Three.js Matrix4 Source Code <https://github.com/mrdoob/three.js/blob/master/src/math/Matrix4.js>`__.

.. code-block:: javascript

    Object.assign( Matrix4.prototype, {
      decompose: function ( position, quaternion, scale ) {
        var te = this.elements;
        var sx = _v1.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
        var sy = _v1.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
        var sz = _v1.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

        // if determine is negative, we need to invert one scale
        var det = this.determinant();
        if ( det < 0 ) sx = - sx;

        position.x = te[ 12 ]; position.y = te[ 13 ]; position.z = te[ 14 ];

        // scale the rotation part
        _m1.copy( this );
        var invSX = 1 / sx; var invSY = 1 / sy; var invSZ = 1 / sz;
        _m1.elements[ 0 ] *= invSX; _m1.elements[ 1 ] *= invSX; _m1.elements[ 2 ] *= invSX;
        _m1.elements[ 4 ] *= invSY; _m1.elements[ 5 ] *= invSY; _m1.elements[ 6 ] *= invSY;
        _m1.elements[ 8 ] *= invSZ; _m1.elements[ 9 ] *= invSZ; _m1.elements[ 10 ] *= invSZ;

        quaternion.setFromRotationMatrix( _m1 );
        scale.x = sx; scale.y = sy; scale.z = sz;
        return this;
      },
    }
..

and Object3D

.. code-block:: javascript

    Object3D.prototype = Object.assign( Object.create( EventDispatcher.prototype ), {
      constructor: Object3D,
      isObject3D: true,
      onBeforeRender: function () {},
      onAfterRender: function () {},

      applyMatrix4: function ( matrix ) {
        if ( this.matrixAutoUpdate ) this.updateMatrix();
        this.matrix.premultiply( matrix );
        this.matrix.decompose( this.position, this.quaternion, this.scale );
      },
    }
..

Combined is an array parsed and combined operation represented as a mat4.

Obj3.Combined is the XTweener's tweening target and been set to Obj3.mesh.matrix4 directly.
Not using Object3D.applyMatrix() because the mesh matrix will accumulate ratation etc. at
each updating & applying matrix, making rotation steps getting increased.

User shouldn't modify *affines* and *combined* fields.

Affine Transformation References:
---------------------------------

`[1] Maths - Affine Transformations <https://www.euclideanspace.com/maths/geometry/affine/index.htm>`_

`[2] Geometric Operations: Affine Transformation <https://homepages.inf.ed.ac.uk/rbf/HIPR2/affine.htm>`_

`[3] Affine Transformation, wikipedia <https://en.wikipedia.org/wiki/Affine_transformation>`_

`[4] What is the difference between linear and affine function, Mathematics <https://math.stackexchange.com/questions/275310/what-is-the-difference-between-linear-and-affine-function>`_

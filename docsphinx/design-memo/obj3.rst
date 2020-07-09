Obj3 & Transformation
=====================

Component Obj3 is used for `THREE.Object3D <https://threejs.org/docs/index.html#api/en/core/Object3D>`__
definition, declared in component/obj3.js.

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

Using Obj3.transform
--------------------

Obj3.transform setup an Object3D's initial transformation. X-vsual supports 3 type
of transforamtion that Three.js also supports:

- rotate

e.g.::

    {rotate: {deg: 90, axis: [0, 1, 0]}}

- translate

e.g.::

    {translate: [20, 0, 0]}

- scale

e.g.::

    {scale: [1.2, 1, 2]}}

Transformations can be combined into an array of Obj3's definition::

    Obj3: {
        transfrom: [{translate: [100, 0, 0]},
                    {rotate: {deg: 45, axis: [1, 0, 0]}},
                    {scale: [1, 0.5, 1]}]
    }

Obj3.affines & combined
------------------------

This 2 properties are used to control object transformation, similar to the mesh.
matrix4, but created by animizer and tweened by XTtweener, other than by Three.js.

Affines is an array of affine object, where affine can be:

::

    translate: vec3
    rotate: radian
    scale: number

Reflect and Shear are not supported as THREE.Matrix4 seams can only been decomposed into
rotation, translation and scale. For details about this, see
`Three.js Matrix4 Source Code <https://github.com/mrdoob/three.js/blob/master/src/math/Matrix4.js>`__
and Object3D.

Here is the code snippet of Matrix4.decompose:

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

and `Object3D <https://github.com/mrdoob/three.js/blob/master/src/core/Object3D.js>`_

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

Obj3.Combined is an array parsed and combined operation represented as a mat4.

Combined is the XTweener's tweening target and been set to Obj3.mesh.matrix4 directly.
Not using Object3D.applyMatrix() because the mesh matrix will accumulate ratation etc. at
each updating & applying matrix, making rotation steps getting increased.

User shouldn't modify *affines* and *combined* fields.

In addition to basic affine transformation, x-visual provide some combined transformation
from these basic transformations, like orbiting and interpolated translating.

See :ref:`Affine Combiner Design <affine-design-memo>` for more details.

Issue: Quaternion Injection
---------------------------

Chart/D3Pie.update() use matrix decompose() and compose() to force object facing
screen. Could this breaching the design doctrine?

.. code-block:: javascript

    if (e.Pie && e.Pie.lookScreen) {
        var m = e.Obj3.mesh;
        m.matrix.decompose( m.position, m.quaternion, m.scale );
        m.quaternion.copy(this.camera.quaternion);
        m.matrix.compose( m.position, m.quaternion, m.scale );
        m.matrixAutoUpdate = false;
    }
..

Affine Transformation References:
---------------------------------

`[1] Maths - Affine Transformations <https://www.euclideanspace.com/maths/geometry/affine/index.htm>`_

`[2] Geometric Operations: Affine Transformation <https://homepages.inf.ed.ac.uk/rbf/HIPR2/affine.htm>`_

`[3] Affine Transformation, wikipedia <https://en.wikipedia.org/wiki/Affine_transformation>`_

`[4] What is the difference between linear and affine function, Mathematics <https://math.stackexchange.com/questions/275310/what-is-the-difference-between-linear-and-affine-function>`_

Obj3 & Geometry
---------------

Most of x-visual geometry handling depends on Three.js' geometry buffer and it's
subclasses. See `Thrender.threeGeometryCase() <https://odys-z.github.io/javadoc/x-visual/Thrender.html#api-threeGeometryCase>`_.

There are also some extensions.

Obj3Type.MapXZRoad
__________________

Generate a road polygon in y = paras.y0 plane. The generated path is scaled and
stored in Obj3.datum, in {paths, dirty}.

Some animation type like AnimType.U_PATHn_MORPH will take this as it's own's Obj3
datum.ref object and can tweening path without noticing paths' data changed.

See the :ref:`Geometry Tests<test-geom>` &
`xgeom.generateWayxz() API <https://odys-z.github.io/javadoc/x-visual/xgeom.html#generateWayxz>`_.

.. _obj3-hexatile-guide:

Obj3Type.Hexatile
_________________

Generate a hexagonal tiles module from json similar with geojson, except that it's
recommended using EPSG 3857 coordinates. Coordinates in EPSG 4326 can be directly
applied if showing a small area and geoScale is large enough.

See the test :ref:`tst-geom-hexatile` &
`xgeom.hexacylinder3857() API <https://odys-z.github.io/javadoc/x-visual/xgeom.html#hexacylinder3857>`_.

:ref:`Memo: hexagon tile generation<geom-hexatile>`

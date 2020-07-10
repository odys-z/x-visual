Animizers
=========

Animizers convert ModelSeqs, the animation sequences scripts into Tween objects
that can be played by XTweener.

Animation scripts are a 2D array in an entity definition, ModelSeqs.script.

Sequence the Animation Structure
--------------------------------

Tween animations are organized as a 2D array, with major order the index of animation
sequences' order. Each sequence is an array of *CmpTween* component.

API Reference:

- `ModelSeqs <https://odys-z.github.io/javadoc/x-visual/XComponent.ModelSeqs.html>`_

- `CmpTweens <https://odys-z.github.io/javadoc/x-visual/XComponent.CmpTweens.html>`_

- `CmpTween <https://odys-z.github.io/javadoc/x-visual/XComponent.CmpTween.html>`_

Start Tween Sequence
--------------------

There are 3 way to start a tween animation:

1. Set start = 0 in the script, let ModelMorph start the sequence automatically.

2. Triggered by other scripts, with *startWith* & *followBy* command in script.

3. Use start command, CmpTween.startCmds. Which is an array buffering commands to
   start a sequence. It's index is the same as tween sequences' index. The following
   code start the second sequence of entity e.

::

    e.CmpTweens.startCmds.push(1);

A more elegant way to do this is use the XTweener.startSeq() API.

Mesh Animiation Script
----------------------

Example:

.. code-block:: javascript

    var cube = ecs.createEntity({
        id: 'fade-out',
        Obj3: { geom: Obj3Type.BOX,
                box: [200, 120, 80],
                mesh: undefined },
        Visual:{vtype: AssetType.mesh,
                // Three use document to load assets, which doesn't exist while testing.
                // null | undefined acts as a flag to let thrender create a ram texture.
                asset: null },

        // in version 1.0, only type of sequential animation is supported
        ModelSeqs: {
            script: [[{ mtype: AnimType.U_ALPHA,
                        paras: {start: 0,         // auto start, only alpha tween in v0.2
                                duration: 0.8,    // seconds
                                alpha: [opa0, opa1],
                                ease: XEasing.Elastic.InOut}
                    }]] },
        CmpTweens: {}
    });
..

In the above example, the entity is defined with 2 components, ModelSeqs & CmpTweens.

ModelSeqs is the animation defining animation process that animated by the x-visual's
tweening system, XTweener.

Then tweening process is record and updated in CmpTweens. It's a 2D array of CmpTween,
the equivalent of Tween object's data part in Tween.js. The methods part is moved
to XTweener, which is the style of ECS.

CmpTween and CmpTweens are wrapped by x-visual and user shouldn't worry about it.
The ModelSeqs is what users will working on, which also is defined as a 2D array.

.. note:: As x-visual is a data visualization prototype, it's only support static
    animation scripts triggered by commands. Scripts can only provided when creating
    entities, and not emit events.

- ModelSeqs

Each 1D Array of the 2D array is an animation processing script. Each element of
1D array define a duration of tween animation. The above example defined 1 process
of two tween steps.

ModleSeqs.script
----------------

mtype
+++++

The script sequence element has mtype as the first property, which can be one of
AnimType defined in component/morph.js.

AnimType
________

:ref:`AnimType<animtype>` declares supported Animation types.

Currently animation a all driven by a modified version of Tween.js module, XTweener.

X-visual is struggling to divide animations into a group of orthogonal calculations,
but not always the case.

Tests shows some animation do showing this character. The AnimType.U_MORPHi type
for example, can be combined together with more than one visual types.

AnimCate
________

mtype also has a flag indicating what kind of the animation is. Currently there
is only one special flag, AnimCate.COMBINE_AFFINE, defined in :ref:`AnimCate<animcate>`,
indicating that the animation should been handled by AffineCombiner.

See :ref:`Affine Combination <affine-design-memo>` for details.

paras
+++++

common paras
____________

.. _anim-paras-start:

- start

Acctually this is delay time for starting in seconds.

value

0 | number:

    Delay seconds and start the the animation. If the script step is the first of
    the animation process, the animation will automatically start.

    **ISSUE**

*In the current version, start time in animation steps other than the first will
be ignored. (We are considering reorganize the Tween.js scheduling schema.)*

Infinity:

    Infinity: Never start automatically. (Triggered by others)

- duration

Animation duration, in seconds.

- ease:

Same as tween.js, any one of

::

    Linear
    Quadratic
    Cubic
    Quartic
    Quintic
    Sinusoidal
    Exponential
    Circular
    Elastic
    Back
    Bounce

.. _script-followby:

- followBy:

An array of scripts that triggering other entities' animation when this animation
is finished.

Object with properties:

entity

    followed by the script of name of the entity.

idx

    script index

start

    see :ref:`paras.start<anim-paras-start>`.

Example:

.. code-block:: json

    type: [{ entity: 'id',
             seqx: 0,
             start: 0.1}]
..

- startWith:

Start animation with script in other entities.

Object has same properties of :ref:`paras.followBy<script-followby>`.

AnimType.POSITION paras
_______________________

The *POSITION* animation type is used to update object's position, in world (xscnene).

- translate

A 2D array with major length = 2 specifying to position moving section. As this is an
affine transformation, it's designed as start from where it is. So the first one is
usually an array of zero vector, i. e. [0, 0, 0].

The second vector is for target position.

.. note:: From version 0.2, the target position can be dynamically updated, which
    is the only one can be updated dynamically.

    see test/html/dynamic-position-tween.html for example.
..

AnimType.ROTATEX paras
______________________

- deg

Rotation degree

AnimType.ROTAXIS paras
______________________

- axis:

Array of axis to rotate around.

- deg

Rotation degree

AnimType.ORBIT paras
____________________

- axis:

Array of axis to rotate around.

- pivot:

The pivot point tor rotate around.

- deg

Rotation degree

detailed reference:

    `Maths - Calculation of Matrix for 2D Rotation about a point <https://www.euclideanspace.com/maths/geometry/affine/aroundPoint/matrix2d/index.htm>`_

    `StatckOverflow Discussion: Three JS Pivot point <https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733>`_

    `Three.js org discourse: How to rotate an object around a pivot point? <https://discourse.threejs.org/t/how-to-rotate-an-object-around-a-pivot-point/6838>`_

Yep,

::

    1 0 x       1 0 -x      1 0 0
    0 1 y   *   0 1 -y   =  0 1 0
    0 0 1       0 0  1      0 0 1

Three.js implementation

.. code-block:: javascript

    function Object3D() {
        var position = new Vector3();
        var rotation = new Euler();
        var quaternion = new Quaternion();
        var scale = new Vector3( 1, 1, 1 );
    }

    Object3D.prototype = Object.assign( Object.create( EventDispatcher.prototype ), {
        applyMatrix4: function ( matrix ) {
            if ( this.matrixAutoUpdate ) this.updateMatrix();
            this.matrix.premultiply( matrix );
            this.matrix.decompose( this.position, this.quaternion, this.scale );
        },

        applyQuaternion: function ( q ) {
            this.quaternion.premultiply( q );
            return this;
        },
    });

    //////////////////////////////////////////////////////////////////////
    function Matrix4() {
        this.elements = [ 1, 0, 0, 0,
                          0, 1, 0, 0,
                          0, 0, 1, 0,
                          0, 0, 0, 1 ];

        if ( arguments.length > 0 ) {
            console.error( 'THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.' );
        }
    }

    Object.assign( Matrix4.prototype, {
        compose: function ( position, quaternion, scale ) {
            var te = this.elements;

            var x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
            var x2 = x + x,    y2 = y + y, z2 = z + z;
            var xx = x * x2, xy = x * y2, xz = x * z2;
            var yy = y * y2, yz = y * z2, zz = z * z2;
            var wx = w * x2, wy = w * y2, wz = w * z2;

            var sx = scale.x, sy = scale.y, sz = scale.z;

            te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
            te[ 1 ] = ( xy + wz ) * sx;
            te[ 2 ] = ( xz - wy ) * sx;
            te[ 3 ] = 0;

            te[ 4 ] = ( xy - wz ) * sy;
            te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
            te[ 6 ] = ( yz + wx ) * sy;
            te[ 7 ] = 0;

            te[ 8 ] = ( xz + wy ) * sz;
            te[ 9 ] = ( yz - wx ) * sz;
            te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
            te[ 11 ] = 0;

            te[ 12 ] = position.x;
            te[ 13 ] = position.y;
            te[ 14 ] = position.z;
            te[ 15 ] = 1;
            return this;
        },

    decompose: function ( position, quaternion, scale ) {
        var te = this.elements;

        var sx = _v1.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
        var sy = _v1.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
        var sz = _v1.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

        // if determine is negative, we need to invert one scale
        var det = this.determinant();
        if ( det < 0 ) sx = - sx;

        position.x = te[ 12 ];
        position.y = te[ 13 ];
        position.z = te[ 14 ];

        // scale the rotation part
        _m1.copy( this );

        var invSX = 1 / sx;
        var invSY = 1 / sy;
        var invSZ = 1 / sz;

        _m1.elements[ 0 ] *= invSX;
        _m1.elements[ 1 ] *= invSX;
        _m1.elements[ 2 ] *= invSX;

        _m1.elements[ 4 ] *= invSY;
        _m1.elements[ 5 ] *= invSY;
        _m1.elements[ 6 ] *= invSY;

        _m1.elements[ 8 ] *= invSZ;
        _m1.elements[ 9 ] *= invSZ;
        _m1.elements[ 10 ] *= invSZ;

        quaternion.setFromRotationMatrix( _m1 );

        scale.x = sx;
        scale.y = sy;
        scale.z = sz;

        return this;
    },

    //////////////////////////////////////////////////////////////////////
    function Quaternion( x, y, z, w ) {
        this._x = x || 0;
        this._y = y || 0;
        this._z = z || 0;
        this._w = ( w !== undefined ) ? w : 1;
    }

    Object.assign( Quaternion.prototype, {
        setFromRotationMatrix: function ( m ) {
            // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
            // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
            var te = m.elements,
                m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
                m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
                m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],
                trace = m11 + m22 + m33,
                s;
            if ( trace > 0 ) {
                s = 0.5 / Math.sqrt( trace + 1.0 );
                this._w = 0.25 / s;
                this._x = ( m32 - m23 ) * s;
                this._y = ( m13 - m31 ) * s;
                this._z = ( m21 - m12 ) * s;
            } else if ( m11 > m22 && m11 > m33 ) {
                s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );
                this._w = ( m32 - m23 ) / s;
                this._x = 0.25 * s;
                this._y = ( m12 + m21 ) / s;
                this._z = ( m13 + m31 ) / s;
            } else if ( m22 > m33 ) {
                s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );
                this._w = ( m13 - m31 ) / s;
                this._x = ( m12 + m21 ) / s;
                this._y = 0.25 * s;
                this._z = ( m23 + m32 ) / s;
            } else {
                s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );
                this._w = ( m21 - m12 ) / s;
                this._x = ( m13 + m31 ) / s;
                this._y = ( m23 + m32 ) / s;
                this._z = 0.25 * s;
            }
            this._onChangeCallback();
            return this;
        },
    });
..


AnimType.U_ALPHA paras
______________________

- alpha:

Array of starting and ending alpha.

If the Visual is a :ref:`point<vtype-point>` or :ref:`refPoint<vtype-refPoint>`
type, the alpha tween is been handled by shader.

.. _animtype-uniform:

AnimType.UNIFORM paras
______________________

.. _animtype-u-morphi:

AnimType.U_MORPHi paras
_______________________

The shader uniforms are:

- u_morph[i]:

This is an array of weights in between array elements. If used form morphing
between vertices, positions, the vertex positions will be mixed with all target,
the *a_target* attributes.

For a_target, See VisualType.point.

In version 0.3, there are two tests showing the usage:

test/html/morph-color.html and test/html/morph-model.html.

- u_dist:

The vertix distance to position variable, scaled with attribute noise, *a_noise*.
For a_noise, See VisualType.point.

Script Example:
---------------

see test case: :ref:`test-morph`.

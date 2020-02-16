Animizers
=========

Mesh Animiation Script
----------------------

Example:

.. literalinclude:: ../../test/scripts.case.js
   :language: javascript
   :lines: 88-114
   :linenos:

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

AnimType
________

Supported Animation types are defined in x-visual/component/morph.js:

.. literalinclude:: ../../lib/component/morph.js
   :language: javascript
   :lines: 5-15
   :linenos:

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

AnimType.OBJ3ROTX paras
_______________________

- deg

Rotation degree

AnimType.OBJ3ROTAXIS paras
__________________________

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

    `Discussion: Three JS Pivot point <https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733>`_
    
    `Three.js org discourse: How to rotate an object around a pivot point? <https://discourse.threejs.org/t/how-to-rotate-an-object-around-a-pivot-point/6838>`_

Yep, T'T = I

::

    1 0 x       1 0 -x      1 0 0
    0 1 y   *   0 1 -y   =  0 1 0
    0 0 1       0 0  1      0 0 1

AnimType.ALPHA paras
____________________

- alpha:

Array of starting and ending alpha.

If the Visual is a :ref:`point<vtype-point>` or :ref:`refPoint<vtype-refPoint>`
type, the alpha tween is been handled by shader.

.. _animtype-uniform:

AnimType.UNIFORM paras
______________________

.. _animtype-u-verts-trans:

AnimType.U_VERTS_TRANS paras
____________________________

- u_morph:

The vertix position will be mixed with attribute target, *a_target*.
For a_target, See VisualType.point.

- u_dist:

The vertix distance to position variable, scaled with attribute noise, *a_noise*.
For a_noise, See VisualType.point.

Script Example:
---------------

The test case 'html/model-morph.html' is an html page using transpiled results,
defining 2 box object, with the 3rd as points referencing the boxes' vertices and
moving the poings, changing the alpha.

.. literalinclude:: ../../test/html/model-morph.html
   :language: javascript
   :lines: 14-118
   :linenos:

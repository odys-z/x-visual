Animizers
=========

Mesh Animiation Script
----------------------

Example:

.. literalinclude:: ../../test/scripts.case.js
   :language: javascript
   :lines: 45-73
   :linenos:

In the above example, the entity is defined with 2 components, ModelSeqs & CmpTweens.

ModelSeqs is the animation defining animation process that animated by the x-visual's
tweening system, XTweener.

Then tweening process is record and updated in CmpTweens. It's a 2D array of CmpTween,
the equivalent of Tween object's data part in Tween.js. The methods part is moved
to XTweener, which is the style of ECS.

CmpTween and CmpTweens are wrapped by x-visual and user shouldn't worry about it.
The ModelSeqs is what users will working on, which also is defined as a 2D array.

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

- start

Acctually this is delay time for starting in seconds.

value

0 | number:

    Delay seconds and start the the animation. If the script step is the first of
    the animation process, the animation will automatically start.


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

.. _script_followBy:

- followBy:

An array of scripts that triggering other entities' animation when this animation
is finished.

Object with properties:

entity

    followed by the script of name of the entity.

idx

    script index

start

    see paras.start.

Example:

.. coed-block:: json

    type: [{ entity: 'id',
             seqx: 0,
             start: 0.1}]
..

- startWith:

Start animation with script in other entities.

Object has same properties of :ref:`script-followBy`.

AnimType.OBJ3ROTX paras
_______________________

- deg

Rotaion degree

AnimType.OBJ3ROTAXIS paras
__________________________

- axis:

Array of axis to rotate around.

AnimType.ALPHA paras
____________________

- alpha:

Array of starting and ending alpha.

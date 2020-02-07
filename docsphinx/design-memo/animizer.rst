Animizers
=========

Mesh Animiation Script
----------------------

Example:

.. code-block:: javascript

        var cube = ecs.createEntity({
            id: 'cube0',
            Obj3: { geom: Obj3Type.BOX,
                    box: [200, 120, 80],    // bounding box
                    mesh: undefined },
            Visual:{vtype: AssetType.mesh,
                    // Three use document to load assets, which doesn't exist whil testing
                    // null acts as a flag to let thrender create a ram texture.
                    asset: null },

            // TODO docs: in version 1.0, only type of sequence animation is supported
            ModelSeqs: {
                script: [[{ mtype: AnimType.OBJ3ROTX,
                            paras: {start: 0,        // auto start, only alpha tween in v0.2
                                    duration: 0.8,    // seconds
                                    cmd: '',
                                    deg: [0, 45],    // from, to
                                     ease: undefined}// default linear
                          },
                          { mtype: AnimType.OBJ3ROTAXIS,
                            paras: {start: Infinity,// auto start, only alpha tween in v0.2
                                    duration: 1,    // seconds
                                    axis: [0, 1, 0],
                                    deg: [0, 90],    // from, to
                                     ease: XEasing.Elastic,// TODO docs
                                    onComplete: assertComplete(completeflags)}
                          } ]]
                },
            CmpTweens: {
                twindx: [],    // e.g. twindex[0] is 0, script[0] current is 0, created by animizer
                tweens: []}    // initialized by animizer, handled by XTweener. [] is safely ignored
        });
..

script
------

mtype
+++++

AnimType
________

Supported Animation types are defined in x-visual/component/morph.js:

.. literalinclude:: ../../lib/component/morph.js
   :language: javascript
   :lines: 5-20
   :linenos:

paras
+++++

common paras
____________

- start

Acctually this is delay time in seconds.

value

0 | number:

    Delay seconds and start the the animation.


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

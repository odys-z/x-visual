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

AnimType (TODO doc)

paras
+++++

common paras
____________

- start

Acctually this is delay time in milliseconds.

0 | null | undefined: 

    start the first immediatly, without delaying following once the previous one completed;

Infinity:

    start the tween with other way, e.g. by cmd handling (todo)

- duration

Same as tween.js

- ease:

Same as tween.js

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

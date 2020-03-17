Affine Tweening
===============

.. _affine-design-memo:

Affine Combination
------------------

.. attention:: Design and API for affine combination is not stable in current version.

    Affine combination is planed to be upgraded.
..

To make affine tweening start from where it's finished, and can be combined from
all tweens of the object (component Obj3), it's updated in XTweener like this:

..
    1. Animizer:
       compose all scripts into every CmpTween's affine field.
    2. XTweener.update(): for each tweening update
       2.1 create the Obj3.combined as each tweening update buffer
           - Tween.js update target object with interpolated value, not incremental value.
       2.2 take a snapshot (mesh.matrix) before combine the object's transformations
           combined.m0 = clone(mesh.matrix);
       2.3 for each tween sequence, combine the transformation
           combined.m4.mul(affine[tween]);
           - to make each tween sequence can be triggered asynchronously, m0 is kept will updating
       2.4 When all these finished, the results has been applied to Obj3.mesh.matrix,
           and snapshot has been dropped.

let :math:`f(\cdot), g(\cdot)` stand for independent transformations, and
z-transform for time expansion, such that

:math:`m_{0_{f}}, m_{0_{g}} = mesh.matrix \cdot z^{0}, mesh.matrix \cdot z^{\alpha}`

:math:`m_{1} = f^{1}(m_{0_{f}}) z^{1}`

:math:`m_{i} = f^{i}(m_{0_{f}}) z^{i} + g^{i - \alpha}(m_{0_{g}}) z^{i - \alpha}`

where :math:`\alpha \in Z^{+}`.

`[mathjax cheat sheet] <https://matplotlib.org/tutorials/text/mathtext.html>`_

Algorithm: ::

    1. Animizer:
       compose all scripts into every CmpTween's affine field;
       set CmpTweens[i].m0 = undefined;

    2. XTweener.update():
       for each entity
         for each tween sequence
           for each tween
             if starting a tween:
               event: onStart() => clear m0;
             update tween;

    3. Affine.update():
        for each tween in CmpTweens,
          // This is how Tween.js works - tweened value got from the beginning.
          3.1 if starting a sequence (tween.m0 == undefied), take snapshot:
              tween.m0 -> Obj3.mesh.matrix
          3.2 combine affine transformation when the tween is updated
              Obj3.mi <- Obj3.mi.mul( f( tween.m0 ) * z )
          3.3 if the tween is finished, keep tween.m0

Affine transformation are accumulated in Obj3.mi:

.. literalinclude:: ../../lib/xmath/affine.js
   :language: javascript
   :lines: 66-73
   :linenos:

.. _affine-issue:

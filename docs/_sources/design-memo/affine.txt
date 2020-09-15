Affine Tweening
===============

.. _affine-design-memo:

Affine Combination
------------------

.. attention:: Design and API for affine combination is not stable in current version.

    It is planed to be upgraded.
..

.. note:: Also a hard learnt lesson:

    Let different systems cooperate purely only upon components, don't trigger
    each other. There should be only one signal issuer.

    Trigger combination events in XTweener makes things complicate. E.g. startween()
    set *isPlaying* = true, but call onStart() handler of a component should happened
    at next update loop, this will signal two different starting events.

    If a system changed something useful for following updating, leave them in
    components.
..

Affine combination collect all orthogonal transformation from tweening results,
typically an array of transformation data, and combine into a martrix4.

To make affine tweening start from where it's finished, and can be combined from
all tweens of the object (component Obj3), it's updated in XTweener like this:

..
    backup old version
    let :math:`f(\cdot), g(\cdot)` stand for independent transformations, and
    z-transform for time expansion, such that

    :math:`m_{0_{f}}, m_{0_{g}} = mesh.matrix \cdot z^{0}, mesh.matrix \cdot z^{\alpha}`

    :math:`m_{1} = f^{1}(m_{0_{f}}) z^{1}`

    :math:`m_{i} = f^{i}(m_{0_{f}}) z^{i} + g^{i - \alpha}(m_{0_{g}}) z^{i - \alpha}`

    where :math:`\alpha \in Z^{+}`.

let :math:`f(\cdot), g(\cdot)` stand for independent transformations, and
z-transform for time expansion, such that

:math:`m_{0} = mesh.matrix \cdot z^{0}`

:math:`m_{1} = f^{1}(m_{0}) z^{1}`

:math:`m_{i_{f}}, m_{i_{g}} = f^{i}(I) z^{i}, g^{i - \alpha}(I) z^{i - \alpha}`

where :math:`\alpha \in Z^{+}`.

:math:`m_{i} = m_{i_{f}} \cdot m_{i_{g}}`

:math:`mesh.matrix = m_{i} \cdot m_{0}`

`[mathjax cheat sheet] <https://matplotlib.org/tutorials/text/mathtext.html>`_

There are two level of combination:

::

    1. transformation that grouped into a combined one, like orbit moving.

    2. at a parallel tween sequences updating, transformation are combined across
       multiple sequences.

TODO refine these structure and debug the problem of results been reset after
previous tween finished (:math:`m_{i_{f,g}}` needing been keept as snapshots).

.. code-block:: javascript

    Core structure - Affine

    class Affine {
        m_f: mat4,
        aff: array<AffineType>
    }
..

Algorithm: ::

    1. Animizer:
       compose all scripts into every CmpTween's affine field;
       Obj3.m0, mi, mi_z = I
       # mi_z is a copy of mi, to prevent mi been reseted before idle state fired.
       # z ^ 1 stands for span of time affines updated.
       each tween.mf = new mat4()
       idle = true

    2. XTweener.update():
       // setup idle as the flag of some tween updated (needing combined later)
       // always snapshot m0 when a tween started
       for each entity:
         for each tween sequence:
           for each tween:
             if starting a tween:
               // event: onStart() => clear m0;
               if idle:
                 idle-edge = lowing, i.e. play-rising
               idle = false;
             update tween;

         if none updated:
            idle = true
            if prev-idle = true:
                idle-edge = rising

    3. Affine.update():
        A. if not idle:
          for each tween in CmpTweens:
            // This is how Tween.js works - tweened value got from the beginning.
            A.1 if play-rising:
                Obj3.m0 = mesh.matrix, i.g. the all tweens' starting point.
            A.2 if starting a consecutive:
                tween._mf <- previous-tween.mf
                i.e. save previous mf for where this animation start to tween.
            A.3 combine affine transformation for all tweens in all sequence currently updatings
                Obj3.mi <- Obj3.mi.mul( fi( m0 ) * zi )
            A.4 if the tween is finished, keep tween.m0
                i.g. if all tween is affine and used for combine:
                mf_z = mf
        B. if idle rising:
            mesh.matrix = mf_z
            # this makes comination results been set to mesh, permanently,
            # open for other updating, and can be re-taken snapshot as m0.

Affine transformation are accumulated in Obj3. :math:`m_{i}` :

.. literalinclude:: ../../lib/sys/tween/affinecombiner.js
   :language: javascript
   :lines: 96-131
   :linenos:

.. _affine-issue:

A Note on Tween.js Behaviour
----------------------------

When Tween.js start a tween animation again, it will restore saved starting object
for the beginning of interpolation. This makes AffineCombiner can't drive tween
animation from where it stopped.

- Test

test/html/script-linear-combination.html.

- x-visual way

To handle this, x-visual save :math:`m_{f}` in each CmpTween, as a bridge between
2 combination levels. Each :math:`m_{f}` is independent to each other and to :math:`m_{0}`.

When a tween is completed inside a sequence, :math:`m_{f}` has been kept, having
combined tween sequences updating keeping use it to update the final :math:`m_{i}`.

.. image:: imgs/003-ortho-mfs.png
    :width: 420px

The key point of x-visual way is that all finger print of tween driven transformation
are saved in each tween for being combined later, orthogonally.

Debug Notes:
------------

1. There do has an :math:`m_{0}`, set at all tweens sequences started, triggered
by *playRising*, and at each cross update, post applied to :math:`m_{i}`.

2. In x-visual v0.2, :math:`m_{f}` is been taken snapshot by onStart handler.

**Issue**: This is not following the rule learnt through the hard lesson, but looks
like an easy way to update :math:`m_{f'_{1}}` before Tween.js is upgraded.

3. Test case shows this way have significantly larger error in combined results.

Guess: this may comes from 2 sources:

A. The last affine combination is not updated as the XTweener changed sequence
index, making last affine update skipped the iteration.

B. The multiple mat4 multiplication incurred precision error.

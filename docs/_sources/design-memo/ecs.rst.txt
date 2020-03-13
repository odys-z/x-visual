ECS Framework
=============

.. note:: doc stub
..

X-visual is inspired by fritz/ECS.

In x-visual v1.0, all object are handled in static way - no new object can be created
during scene updating process. Each subsystem is implement assuming that entity
won't been changed during entire rendering life cycle.

Reason: there are many other more important concepts to be verified, this decision
can largely simplify x-visual, and it's highly probably impose limited modification
when it's needed in the future.

Extension
---------

query conditions
________________

- iffall

- any

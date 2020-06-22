ECS Framework
=============

.. note:: doc stub
..

X-visual is inspired by fritz/ECS.

Before x-visual v0.3.0, all object are handled in static way - no new object can be created
during scene updating process. Each subsystem is implement assuming that entity
won't been changed during entire rendering life cycle.

*Memo: As loading SVG & GLTF asynchronously required, the v0.2.39 can add assets to
Three.js later than initializing xworld.*

Reason: there are many other more important concepts to be verified, this decision
can largely simplify x-visual, and it's highly probably impose limited modification
when it's needed in the future.

query conditions
----------------

The query condition of entity set that a system updating upon.

.. attention:: All these type of conditions are recommended to use only one of it
    for each query. Any combination of these are not tested and debugged - though
    it's designed in this way.

    *Is it reasonable to suppose that defining components carefully will eliminate
    the needing of logic combination - no such requirements?*
..

- has

The *has* query condition is what fritzy provided in the original `ECS framework <https://github.com/fritzy/ecs-js>`_.

In x-visual, this means query entities with all the provided components: ::

    provide c1, c2, c3 are components,
    set sys.query = {has: ['c1', 'c2']},
    e = {c1, c2}, f = {c1, c2, c3},
    ecs.queryEntities() => result = [e]

`Related Issue <https://github.com/fritzy/ecs-js/issues/6>`_

- iffall

The *iffall* query condition get entities with all required components if it
prestend, no matter any other components in the entity.::

    provide c1, c2, c3 are components,
    set sys.query = {iffall: ['c1', 'c2']},
    e = {c1, c2}, f = {c1, c2, c3},
    ecs.queryEntities() => result = [e, f]

- any

The *any* query condition is will get entities with any of the defined components.::

    provide c1, c2, c3 are components,
    set sys.query = {any: ['c1', 'c3']},
    e = {c1, c2}, f = {c2, c3}, g = {c2}
    ecs.queryEntities() => result = [e, f]

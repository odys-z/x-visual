.. _guide-app-architecture:

X-visual App Architecture
=========================

.. note:: Following x-visual examples readme to start up.

..

x-visual is a pure javascript ECS WebGl rendering application framework. ECS stands
for Entity, Component, System. Application should following this concept to use
x-visual effectiently.

1. x-visual startup
-------------------

x-visual is a npm package, together with a bundle can be used in plain javascript.
For quick start, see x-visual/examples readme.

2. Hello XWorld
---------------

Here is as simple application using x-visual for data representation.

.. literalinclude:: ../../examples/cube/app.js
   :language: javascript
   :lines: 1-25
   :linenos:

In the main program, the 3D world, xworld, is used as the 3D space manager.
Afther create the xworld, a cube also been created, which representing some user
data been visualized. After this, call xworld.startUpdate() and render the scene
repeatedly.

.. literalinclude:: ../../examples/cube/hellocube.js
   :language: javascript
   :lines: 1-50
   :linenos:

A cube entity has been defined above, with id, Obj3, Visual components.

About System
____________

- ECS.System & ECS.XSys

ECS.System is a base class of all x-visual built-in systems, like renderer, x-view
and tween animation driver.

ECS.XSys is a base class for users to extend. It's nothing now but a coding convention.
Application systems should extends this class in case some common helping functions
added to this system in the future.

- query & update

In the *Hello XWorld* example, there is a line of code reflecting key concept of
ECS, the query condition:

.. code-block:: javascript

    Cube.query = {
        iffall: ['Visual', 'CmdFlag']
    };
..

The *iffall* is a condition specifying that all entities with all 2 components,
*Visual* and *CmdFlag* must been handled by *Cube* system.

The *update()* function is where a system handling entities at each rendering loop.
The argument *entities* is passed to it according to the *query* logics.

Examples
________

All examples are using Webpack for transpiling.

::

    npm i
    webpack

If everything goes well, open the examples/cube/index.html and it will show
a cube.

.. image:: imgs/001-hellocube.png
    :width: 300px

3. Common Practice of Application
---------------------------------

An x-visual application includes:

- App Main

    Main function is a common pattern of application includes creating XWorld,
    Entities then start rendering by calling xworld.startUpdate().

- Entities

    Entities are groups of Components. In x-visaul, these components are a group
    of data and System actions scripts.

- Systems

    Systems update components' state, changing how data been rendered. A user system
    can change object's position, moving path or color etc.

4. Next Step
------------

There are some html test cases can be useful, see `x-visual/test/html <https://github.com/odys-z/x-visual>`_.

Details is up coming...

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

About System.query
__________________

todo ...

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

- Main (App)

    Common pattern of application includes creating XWorld, Entity then start by
	calling xworld.startUpdate().

- Entities

    Entities are groups of Components. In x-visaul, these components are a group
    of data and System actions scripts.

- Systems

    TODO ...

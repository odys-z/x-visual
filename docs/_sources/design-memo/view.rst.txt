MVC View
========

To the author's knowledge, the ECS framework still needs an MVC pattern to handle
user interactions.

View
----

The xview is used as default mvc view.

Xview is a singleton filed with properties *cmds* for commands queue and *flag*
for commands length. All system that response to user action can access this cmds
directly.

.. attention:: Only Input system can write the *xview.cmds* and *xview.flag*.

    This rule are not enforced by x-visual.
..

At each update beginning, *xview.cmds* and *xview.flag* are cleared.

Input may not the only system parsing user input and generate cmds. The intuition
for this is there may be more user interaction handler, such as a websocket client.

handling process:

::

    Inputs: mouse | key events -> xview.cmds
    WebClient: web-message -> xview.cmds
    GpuPicker: Cmd.clietxy -> GpuPickable(entity.id)

Inputs
------

Input system always been created by xworld for handling user input.

User interaction been converted into User-Cmd for subsequent system handling.

On each updating iteration, the command's buffer (xview.cmds) is cleared. This
only happening at at the update() beening called. User action are buffered in an
internal buffer.

If no new user action, a flag, *xview.flag* will be set to help to prevent
unnecessary iteration.

GpuPicking
----------

If an entity has a GpuPickable component, GpuPicker subsystem will create another
object for rendering the picking scene.

So if there are entities only with Obj3, they can be rendered as visible but not
pickable, and can preventing entities with GpuPickable to be picked if they are
rendered closer to camera.

**Note:**

The GpuPickable component has a *pickid* property, it's immediately been updated by
x-visual.GpuPicker. Users can not depend on this.

[1] `Three.js Picking (with GPU) <https://threejsfundamentals.org/threejs/lessons/threejs-picking.html>`__

[2] `Changing Materials at Runtime #2599 <https://github.com/mrdoob/three.js/issues/2599>`__

MVC View
========

To the author's knowledge, the ECS framework still needs an MVC pattern to handle
user interactions.

View
----

The xview is used as default mvc view.

Xview is an entity has components CmdFlag and UserCmd. All system that can response to
user command must query UserCmd.

The intuition for this is there may be more user interaction handler, such as a websocket
client.

handling process:

::

    Inputs: mouse | key events -> UserCmd
    WebClient: web-message -> UserCmd
    GpuPicker: UserCmd.clietxy -> GpuPickable(entity.id)

Inputs
------

Input system always been created by xworld for handling user input.

User interaction been converted into UserCmd component for subsequent system handling.

On each updating iteration, the command's buffer (UserCmd) is cleared. If no new
user action, a flag, CmdFlag will be set to prevent unnecessary iteration.

GpuPicking
----------

If an entity has a GpuPickable component, GpuPicker subsystem will create another
object for rendering the picking scene.

So if there are entities with Obj3, they can be rendered as visible but not pickable,
and can prevent entities with GpuPickable to be picked if they are rendered closer.

[1] `Three.js Picking (with GPU) <https://threejsfundamentals.org/threejs/lessons/threejs-picking.html>`__

[2] `Changing Materials at Runtime #2599 <https://github.com/mrdoob/three.js/issues/2599>`__
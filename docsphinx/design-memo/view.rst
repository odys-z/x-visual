MVC View
========

To the author's knowledge, the ECS framework still needs an MVC pattern to handle
user interactions.

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

[1] `Three.js Picking (with GPU) <https://threejsfundamentals.org/threejs/lessons/threejs-picking.html>`__

[2] `Changing Materials at Runtime #2599 <https://github.com/mrdoob/three.js/issues/2599>`__

.. _volumetric-shaders:

Morphing Volumetric Shaders
===========================

For shaderFlag API, see `XComponent.ShaderFlag <https://odys-z.github.io/javadoc/x-visual/XComponent.html#shaderflag>`_

Scalable Orb
------------

Render an orb centered at world position, uniform vec3 wpos.

See `xglsl.scaleOrb() <https://odys-z.github.io/javadoc/x-visual/xglsl.html#scaleOrb>`_

ShaderFlag::

    xv.XComponent.ShaderFlag.scaleOrb

World position Orbs
-------------------

Render a goup of orbs with offsets in world position.

See `xglsl.worldOrb() <https://odys-z.github.io/javadoc/x-visual/xglsl.html#worldOrbs>`_

ShaderFlag::

    xv.XComponent.ShaderFlag.worldOrbs

World Orb Groups
----------------

Render goups of orbs with offsets in world position, followed by offsets of tweening
percentage, range 0 ~ 100.

See `xglsl.orbGroups() <https://odys-z.github.io/javadoc/x-visual/xglsl.html#orbGroups>`_

ShaderFlag::

    xv.XComponent.ShaderFlag.orbGroups

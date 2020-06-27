.. _test-geom:

Test - Geometries
=================

Cate: Path & Dir Geometry
-------------------------

.. _tst-geom-dirtube:

Case: Dir TubeGeometry
______________________

html file::

    test/html/geom-dirtube.html

.. image:: imgs/005-geom-tube-curve-sim.png

AssetType::

    xv.XComponent.AssetType.PathTube

Visual.paras:

see AssetType jsdoc.

See reference section about :ref:`Three.js tube geometry algorithm of Frenet Frame<ref-frenet-frame>`.

TODO doc ...

Case: Volumetric Tube
_____________________

html files::

    test/html/shader-scaleorb.html
    test/html/shader-multi-orb.html
    test/html/map3d/geopath-road.html
    test/html/map3d/geopaths.html
    test/html/map3d/cd-express.html

Testing types of volumetric shader program.

ShaderFlag::

    xv.XComponent.ShaderFlag.scaleOrb
    xv.XComponent.ShaderFlag.worldOrbs
    xv.XComponent.ShaderFlag.orbGroups

See also :ref:`volumetric-shaders` & :ref:`visual paras for volumetric shaders<visual-paras-scaleorb:>`.

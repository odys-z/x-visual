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

.. _tst-geom-volume-tube:

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

See also :ref:`volumetric-shaders` & :ref:`visual paras for volumetric shaders<visual-paras-scaleorb>`.

.. _test-case-hexatile:

Case: Hexatile from Geojson
___________________________

html files::

    test/html/map3d/hexacylinder.html
    test/html/map3d/epsg4326-points.html

Using shaders:

    xv.XComponent.ShaderFlag.tiledOrbs,

Animation type:

	 xv.XComponent.AnimType.U_NOW

See :ref:`Guide: Obj3Type.Hexatile<obj3-hexatile-guide>`

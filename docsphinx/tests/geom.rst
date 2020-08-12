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

.. _tst-geom-hexatile:

Case: Hexatile from Geojson
___________________________

html files::

    test/html/map3d/hexacylinder.html
    test/html/map3d/epsg4326-points.html

Using shaders:

    xv.XComponent.ShaderFlag.tiledOrbs,

Animation type:

	 xv.XComponent.AnimType.U_NOW

Example parameters explained:

.. code-block:: javascript

    { id: 'layer3',
      Obj3: { geom: xv.XComponent.Obj3Type.Hexatile,
              box: [] },
        Visual: {
          vtype: xv.AssetType.mesh,
          shader: xv.XComponent.ShaderFlag.tiledOrbs,
          paras: {
            side: THREE.FrontSide,
            // shader orb
            colors: [[0, 0, 1], [0, 1, 0], [1, 0, 0], [0.7, 0.7, 0], [1, 0, 1],
                     [0, 0, 1], [0, 1, 0], [1, 0, 0], [0.7, 0.7, 0], [1, 0, 1]],
            orbR:    [2, 8, 2, 1.4, 3, 2, 3, 2, 1.4, 3],
            offsets:[[-20, 0, 0], [0, 0, 0], [20, 0, -0], [0, 0, 20], [0, 0, -20],
                     [-10, 0, 10], [10, 0, 10], [5, 0, -12], [5, 0, 12], [-5, 0, -12]],
          	whiteAlpha: 0.8,	 // out of range alpha
            orbScale: [3, 3, 4],
            thermalColors: [[0, 0, 1], [1, 1, 0], [1, 0, 0]],

            // tile geometry
            features: json0.features,
            origin: o3,
            geostyle: { radius: 45, height: 24, scale: 0.02,
              maxHeight: 40,     // for distributing thermal color
              groups: 2,
              onGroup: (fx, feature) => { return fx % 2; } }, // then update() can change morphings
          },
          asset: '../../assets/tex/rgb2x2.png' } ,
		ModelSeqs: { script: [[{
          mtype:  xv.XComponent.AnimType.U_NOW,
          paras: {start: 0,
            speed: 0.002,   // speed para alwasy comes with U_NOW
            duration: 0 }	// ignored
          }]]
        },
        CmpTweens: {}
      }

In the above example, where

Obj3.geom = Obj3Type.Hexatile, this will makes x-visual create a module of hexagonal
cylinders, with each centered at Visual.paras.features' point coordinates. See
:ref:`Guide: Obj3Type.Hexatile<obj3-hexatile-guide>` for the geometry detials.

Visual.paras has two parts. The first part is for shader tileOrbs.  See
:ref:`vpara details<visual-para-tiledorbs>` for this part of parameters.

The second part is for the geometry generation - which will be moved to a new
component in the future. The features is an array of feature objects, typically
come from a (similar) geojson data, with coordinates of EPSG 3857. See the test
page source for sample data.

Visual.paras.featrues can also been replaced by Visual.paras.uri. The difference
is that *uri* are handled in a feature-by-feature style, with the help of
`Oboe <https://www.npmjs.com/package/oboe>`_. There is an example of *uri* in test
page 'epsg4326-points.html'

Details of Visual.paras.geostyle is explained in :ref:`geom-hexatile`.

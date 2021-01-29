.. _test-filter:

Test - Post Filtering
=====================

Tone & HDR
----------

Blooming
--------

Bokeh
-----

.. _test-filter-ssao:

SSAO
----

X-visual use a cheap way for SSAO, based on MIP map of depth buffer.

filter::

    filters.ssao: paras => glsl-string

Shaders with *f_DepthBokeh* flag can support SSAO. In version 0.3.74, these shaders
are::

    colorArray: 6 | f_LIGHTENED | f_DepthBokeh,
    texPrism: 12 | f_LIGHTENED | f_DepthBokeh,
    boxLayers: 15 | f_LIGHTENED | f_DepthBokeh,
    cubeTex: 16 | f_LIGHTENED | f_DepthBokeh,
    reflectex: 17 | f_LIGHTENED | f_DepthBokeh,
    texEnv: 18 | f_LIGHTENED | f_DepthBokeh,
    envCubeMap: 43 | f_LIGHTENED | f_DepthBokeh,
    envMap: 44 | f_LIGHTENED | f_DepthBokeh,

For latest shader supporting SSAO, see *Visual* component
`source <https://github.com/odys-z/x-visual/blob/master/lib/component/visual.js>`_
& `API doc <https://odys-z.github.io/javadoc/x-visual/XComponent.Visual.html>`_.

Test::

    test/html/ecs-basics/ssao.html

Visaul explained:

This test page using a filter debugging shader showing SSAO color in enhanced
green color. To show the real SSAO effect, disable
`xv.ShaderFlag.finalOutline <https://github.com/odys-z/x-visual/blob/ae176d5fc095d2c7c0e1c8fd147ae949f2e54974/lib/xutils/shaders/testxfrag.glsl.js#L105>`_
in ssao.html:

.. code-block:: javascript

    const xworld = new xv.XWorld(document.getElementById('canv'),
          window, {
            canvasize: [600, 400],
            camera: {
                far: 1200,
                ratio: 1.5,
            },
            light:{
                intensity: 0.8,
                skyColor: 0x000000,
                position: [-100, 100, 56] },
            finalQuad: {
                ssao: { radius: 8,
                        intense: 2,
                        debug: 0.3 },
                shader: xv.ShaderFlag.finalOutline,
                debug: false
            } } );
..

::

    finalQuad.ssao:
        radius:  the sample distance on screen to find SSAO area;
        intense: scale SSAO color;
        lod:     depth texture LOD for SSAO detecting;
        epsilon: min and max scale for finding distance range to rendering SSAO

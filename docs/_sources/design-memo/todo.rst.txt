Tasks
=====

TODOs
-----

1. Fix self rotation axis

2. Extend volumetric shader for tube geometry

Failed.

Shader *scaleOrb* is using ray casting for distance calculating, which is not good
at shape figuring like ray matching, a slow method.

The *scaleOrb* shader use a scale inverse for finding ellipsoid distance, a simple
version of inverse matrix. It's said that's expensive to calculate inverse matrix
in GPU. So this shader stop here for now, with out direction rotation.

*Is it possible to handle distance to model in vertex shader? Or simply update
matrix uniform(s) for every vertex?*

3. Dynamic faces

Example: `Three.js Custom BufferGeometry <https://threejsfundamentals.org/threejs/lessons/threejs-custom-buffergeometry.html>`_

4. Optimize anti-aliasing

see `Three.js Texture <https://threejsfundamentals.org/threejs/lessons/threejs-textures.html>`_.

.. _wish-svg:

5. SVG

Issues
------

1. Implementing Shadow with SSAO

Reference:

`OGL Tutorial 45: Screen Space Ambient Occlusion <http://ogldev.org/www/tutorial45/tutorial45.html>`_

3D distance fields: A survey of techniques and applications, August 2006IEEE
Transactions on Visualization and Computer Graphics 12(4):581-99
`DOI: 10.1109/TVCG.2006.56 <https://www.researchgate.net/publication/6979985_3D_distance_fields_A_survey_of_techniques_and_applications>`_

`A Complete Distance Field Representation, 2001 <https://graphics.stanford.edu/courses/cs468-03-fall/Papers/completeDistanceFieldRep.pdf>`_

`Generating Signed Distance Fields From Triangle Meshes, 2002 <http://www2.imm.dtu.dk/pubdb/edoc/imm1289.pdf>`_

2. Loaded GLTF makes outlined together with box mesh.

And further, if used in an other project, the loaded GLTF modules crashes with box object::

    three.module.js:16034 Uncaught TypeError: Cannot read property 'type' of undefined
        at WebGLIndexedBufferRenderer.setIndex (three.module.js:16034)
        at WebGLRenderer.renderBufferDirect (three.module.js:24169)
        at renderObject (three.module.js:24886)
        at renderObjects (three.module.js:24856)
        at WebGLRenderer.render (three.module.js:24637)
        at RenderPass.render (RenderPass.js:58)
        at EffectComposer.render (EffectComposer.js:142)
        at Thrender.update (thrender.js:920)
        at ECS.runSystemGroup (ecs.js:197)
        at XWorld.update (xworld.js:311)
    THREE.REVISION
    "113"

There are `Three.js issue about the same error <https://github.com/mrdoob/three.js/pull/14367>`_.

`Jsdoc API - AssetKeepr <https://odys-z.github.io/javadoc/x-visual/AssetKeepr.html>`_

- bug: Obj3.uniforms.u_alpha will affect each others

.. code-block:: javascript

	xworld.addEntities( {
		id: 'way0',
		Obj3: { geom: xv.XComponent.Obj3Type.MapXZRoad,
				box: [0] },    // y0 = 0
		Visual:{
			vtype: xv.AssetType.mesh,
			shader: xv.ShaderFlag.colorArray,
			paras: {
				feature: path1.property,
				points: path0[0].points,
				origin: origin0,
				colors: [[0, 0.3, 0], [0, 0.3, 0.5]] } }
			});

	xworld.addEntities( {
		id: 'plane',
		Obj3: { geom: xv.XComponent.Obj3Type.PLANE,
				uniforms: {opacity: 1.0},
				box: [300, 10] },
		Visual:{
			vtype: xv.AssetType.mesh,
			shader: xv.ShaderFlag.colorArray,
			paras: {
				// texMix: xv.ShaderAlpha.mix,
				colors: [[0, 0.2, 0], [0.5, 0.2, 0]] },
			asset: '../../assets/tex/ruler256.png'}
			});
..

plane.Obj3.uniforms.opacity will hide / show way0

.. _issue-asynch-gltf:

3. ModelSeqs can't handle asynchronously loaded mesh

.. attention:: This issue should no longer exists in version latter than v0.3.

test case: html/gltf-car.html

Problem: If setting animation sequence start at 0 (any but Infinity) on a gltf
mesh, then the target Obj3.mesh won't being ready when playing started.

Loading the gltf nodes is an asynchronous process, of which the node objects can
only been ready for rendering latter.

Code snippet of starting Tween animation in AffineCombiner.update():

.. code-block:: javascript

    if (!e.CmpTweens.idle) {
        if (e.CmpTweens.playRising) {
            e.Obj3.m0.setByjs(e.Obj3.mesh.matrix);
        }
        ...
..

Code snippet of Thrender.createObj3s() AssetType.gltf branch:

.. code-block:: javascript

    AssetKeepr.loadGltfNodes(e.Obj3, `assets/${e.Visual.asset}`,
        nds,
        (nodes) => {
            // Too late to push mesh into mes now, add to scene directly
            if (scene && nodes) {
                for (var n of nodes) {
                    if (e.Obj3 && e.Obj3.transform) {
                        var m4 = new mat4();

                        if (e.Visual.paras && e.Visual.paras.withTransform)
                            m4.setByjs(n.matrix);

                        for (var trs of e.Obj3.transform)
                            m4.appAffine(trs);

                        n.matrixAutoUpdate = false;
                        m4.put2js(n.matrix);
                        e.Obj3.mesh = n;
                    }
                    scene.add(n);
                }
            }
        });
..

Wish List
---------

- Animize Letters

See `Ilmari Heikkinen, Animating a Million Letters Using Three.js <https://www.html5rocks.com/en/tutorials/webgl/million_letters>`_

- Tween.js Extension

E.g. Noisy Easing

- Extends GPU picking with points picking

This needs implementing a point shader for GPU picking.

- Tween.glsl

`Jet Blue already had tried this <https://stackoverflow.com/questions/35328937/how-to-tween-10-000-particles-in-three-js>`_ :

.. code-block:: cpp

    // Vertex Shader

    uniform float elapsedTime;
    uniform float duration;
    attribute vec3 targetPosition;

    float exponentialInOut( float k ){
        // https://github.com/tweenjs/tween.js/blob/master/src/Tween.js
        if( k <= 0.0 ){
            return 0.0;
        }
        else if( k >= 1.0 ){
            return 1.0;
        }
        else if( ( k *= 2.0 ) < 1.0 ){
            return 0.5 * pow( 1024.0, k - 1.0 );
        }
        return 0.5 * ( - pow( 2.0, - 10.0 * ( k - 1.0 ) ) + 2.0 );
    }

    void main(){

        // calculate time value (also vary duration of each particle)
        float t = elapsedTime / ( duration * ( 1.0 + randomNum.x ) );

        // calculate progress
        float progress = exponentialInOut( t );

        // calculate new position (simple linear interpolation)
        vec3 delta = targetPosition - position;
        vec3 newPosition = position + delta * progress;

        // something
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
    }
..

- Tween.affine

Have tweening transformation combinable.

- SVG Shader

references:

-- `Stackoverflow question: Displaying SVG in OpenGL without intermediate raster <https://stackoverflow.com/questions/1027179/displaying-svg-in-opengl-without-intermediate-raster>`_

-- `Stackoverflow question: Rendering Vector Graphics in OpenGL? [duplicate] <https://stackoverflow.com/questions/4129932/rendering-vector-graphics-in-opengl>`_

-- `Mark Kilgard, GPU Accelerated Path Rendering <http://on-demand.gputechconf.com/gtc/2012/presentations/S0024-GPU-Accelerated-Path-Rendering.pdf>`_
   A general introduction. And `here's details about stencil <https://learnopengl.com/Advanced-OpenGL/Stencil-testing>`_.

-- `Charles Loop & Jim Blinn, Chapter 25. Rendering Vector Art on the GPU @ NVIDIA Developer <https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-25-rendering-vector-art-gpu>`_
   Using control points to generate face?

-- `W3C draft: Filter Effects Module Level 1, Editor’s Draft, 21 October 2019 <https://drafts.fxtf.org/filter-effects/>`_
   Retrieved on 2 Jun, 2020.

-- `3D wireframe in SVG @ grasshopper <https://prideout.net/blog/svg_wireframes/>`_
   A strange way to use svg filter?

-- `Victor Gaultney, Martin Hosken, Alan Ward, An Introduction to TrueType Fonts: A look inside the TTF format 2003-05-23 <https://scripts.sil.org/cms/scripts/page.php?site_id=nrsi&id=IWS-Chapter08>`_
   Simple introduction of TrueType Font, together with `Rendering technologies overview <https://scripts.sil.org/cms/scripts/page.php?item_id=IWS-Chapter07>`_,
   and a font engine project, `SIL Graphite <https://scripts.sil.org/cms/scripts/page.php?site_id=projects&item_id=graphite_home>`_.

-- `simoncozens.github.io: How OpenType Works <https://simoncozens.github.io/fonts-and-layout/opentype.html>`_
   Nice explanation of OpenType Font.

-- `DirectWrite Font Cache (obsolete), docs of the Chromium Projects <https://www.chromium.org/developers/design-documents/directwrite-font-cache>`_
   Details about how Chromium sandbox handling fonts in Windows.

-- `96-bit 8x12 Font, a shadertoy way <https://www.shadertoy.com/view/Mt2GWD>`_
   Using vec4 for each glyph, with the help of
   `Charset Extractor from Images online tool <http://www.massmind.org/techref/datafile/charset/extractor/charset_extractor.htm>`_

-- `Inigo Quilez - iq/2015, Parametric graph by curvature, Shadertoy. <https://www.shadertoy.com/view/Xlf3zl>`_,
   License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

   Try::

    color = smoothstep(0.0, 0.01, vec3( d ));

.. `Da Rasterizer , Created by TDM, 2014-08-20 <https://www.shadertoy.com/view/MsjSzz>`_
   An example of fragment shader matrix operation.

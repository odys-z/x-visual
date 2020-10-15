EnvMap
======

EnvMap for User
---------------

Three.js envMap is designed can be used by ShaderMaterial. Here are some example:

`JsFiddle Test <https://jsfiddle.net/p23rd7ft/10/>`_

which won't run without these lines:

.. code-block:: javascript

    materialShader.envMap = envMap;
    materialShader.combine = THREE.MultiplyOperation;
    materialShader.uniforms.envMap.value = envMap;
..

See `discussion here <https://discourse.threejs.org/t/solved-how-to-use-envmap-in-shadermaterial-based-on-meshphongmaterial/13003/7>`_.

Some Essential Parts
--------------------

- Shader of MeshLambertMaterial for the above example.

The fragment shader is::

    src/renderers/shaders/ShaderLib/meshlambert_frag.glsl.js

.. code-block:: glsl

    #include <common>
    ...
    #include <envmap_common_pars_fragment>
    #include <envmap_pars_fragment>

    void main() {
        ...
        vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
        #include <envmap_fragment>
        gl_FragColor = vec4( outgoingLight, diffuseColor.a );

        // include tonemapping and more
    }
..

- Env texture sampling

Light direction is done by vertex shader::

    src/renderers/shaders/ShaderChunk/envmap_vertex.glsl.js

.. code-block:: glsl

    vec3 cameraToVertex;
    if ( isOrthographic ) {
        cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
    } else {
        cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
    }
    vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );

    #ifdef ENVMAP_MODE_REFLECTION
        vReflect = reflect( cameraToVertex, worldNormal );
    #else
        vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
    #endif
..

Then env texture been sampled in fragment shader like::

    src/renderers/shaders/ShaderChunk/envmap_fragement.glsl.js

.. code-block:: glsl

    #ifdef ENVMAP_TYPE_CUBE
        vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
    #elif defined( ENVMAP_TYPE_CUBE_UV )
        vec4 envColor = textureCubeUV( envMap, reflectVec, 0.0 );
    #else
        vec4 envColor = vec4( 0.0 );
    #endif
..

The uniforms used is:

.. code-block:: glsl

    uniform float envMapIntensity;
    uniform float flipEnvMap;
    uniform int maxMipLevel;

    #ifdef ENVMAP_TYPE_CUBE
        uniform samplerCube envMap;
    #else
        uniform sampler2D envMap;
    #endif
..

See example of cube map: `Three.js example: envmap <https://threejs.org/examples/?q=env#webgl_materials_envmaps>`_.

- Uniforms

flipEnvMap is set by default with -1 in UniformsLib

.. code-block:: javascript

    const UniformsLib = {
        ...
        envmap: {
            envMap: { value: null },
            flipEnvMap: { value: - 1 },
            ...
        },
        ...
    }
..

flipEnvMap should be changed to '1' if not cube texture used, e.g. WebGlBackground will
change this according to backgound.isCubeTexture.

Revert normal vector
--------------------

To get reflected direction, transformed normal vector must been reverted [1] [2].

A normal vector can be got from reverting a transformed normal vector[2]. The
Three.js way breaks this into some separate parts.

::

    src/renderers/shaders/ShaderChunk/common.glsl.js
    - and [5] shows this is correct for normal vector.

.. code-block:: glsl

    vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
        return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
    }
..


::

    src/renderers/shaders/ShaderChunk/defaultnormal_vertex.glsl.js

.. code-block:: glsl

    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix * transformedNormal;
..

::

    src/renderers/shaders/ShaderChunk/envmap_vertex.glsl.js

.. code-block:: glsl

    vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
..

We want invert transpose normal,

.. math::

    n = (M_n ^ {-1}) ^ T \cdot n
..

which can be done by

.. math::

    n = M_n \cdot n \cdot (M_v)_{3x3}
..

where

:math:`M_n =` normalMatrix,

:math:`M_v =` viewmatrix.

Because :math:`(M_v)_{3x3} = M_n^{-1}` according to [3, 4, 5].

References

[1] `Transforming normals with the transpose of the inverse of the modelview matrix <https://stackoverflow.com/a/13654662>`_

[2] `Jason L. McKesson, Normal Transformation, Chapter 9. Lights On, Learning Modern 3D Graphics Programming <https://paroj.github.io/gltut/Illumination/Tut09%20Normal%20Transformation.html>`_

[3] `viewMatrix = camera.matrixWorldInverse, WebGLProgram, Three.js docs <https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram>`_

[4] `viewMatrix = camera.matrixWorldInverse, Stackoverflow <https://stackoverflow.com/a/26912790>`_

[5] `Inverse of transformation matrix, Mathematics, stackexchange <https://math.stackexchange.com/questions/152462/inverse-of-transformation-matrix>`_

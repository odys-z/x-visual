Three.js Gems
=============

ShaderLib
---------

When WebGLRenderer creating material in *initMaterial()*, the *programChange ==
true* branch will load the shader of *ShaderLib[ parameters.shaderID ]*.

.. code-block:: javascript

    function initMaterial( material, fog, object ) {
        if ( programChange )
            if ( parameters.shaderID )
                var shader = ShaderLib[ parameters.shaderID ];
        ...
    }
..

In ShaderLib.js, the lib is defined as

.. code-block:: javascript

    var ShaderLib = {
        ...

        phong: {
            uniforms: mergeUniforms( [
                UniformsLib.specularmap,
                ...
                UniformsLib.lights,
                {   emissive: { value: new Color( 0x000000 ) },
                    specular: { value: new Color( 0x111111 ) },
                    shininess: { value: 30 }
                }
            ] ),

            vertexShader: ShaderChunk.meshphong_vert,
            fragmentShader: ShaderChunk.meshphong_frag
        },
        ...

        shadow: {
            uniforms: mergeUniforms( [
                UniformsLib.lights,
                UniformsLib.fog,
                {   color: { value: new Color( 0x00000 ) },
                    opacity: { value: 1.0 }
                },
            ] ),

            vertexShader: ShaderChunk.shadow_vert,
            fragmentShader: ShaderChunk.shadow_frag
        }
    };
..

In UniformsLib.js

.. code-block:: javascript

    var UniformsLib = {
        common: {
            diffuse: { value: new Color( 0xeeeeee ) },
            ...
        },

        specularmap: { specularMap: { value: null }, },

        lights: {
            ambientLightColor: { value: [] },
            lightProbe: { value: [] },
            directionalLights: { value: [], properties: {
                direction: {},
                color: {},

                shadow: {},
                shadowBias: {},
                shadowRadius: {},
                shadowMapSize: {}
            } },

            directionalShadowMap: { value: [] },
            directionalShadowMatrix: { value: [] },

            spotLights: { ... },
            pointLights: { ... },

            ...

            hemisphereLights: { value: [], properties: {
                direction: {},
                skyColor: {},
                groundColor: {}
            } },
        },
    };
..

ShaderChunk is actually a boilerplate, e.g. Phong vertex shader:

.. code-block:: c++

    #define PHONG
    varying vec3 vViewPosition;

    #ifndef FLAT_SHADED
        varying vec3 vNormal;
    #endif

    #include <common>
    #include <uv_pars_vertex>
    #include <uv2_pars_vertex>
    #include <displacementmap_pars_vertex>
    #include <envmap_pars_vertex>
    #include <color_pars_vertex>
    #include <fog_pars_vertex>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    #include <shadowmap_pars_vertex>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>

    void main() {

        #include <uv_vertex>
        #include <uv2_vertex>
        #include <color_vertex>

        #include <beginnormal_vertex>
        #include <morphnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>

    #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
        vNormal = normalize( transformedNormal );
    #endif

        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        #include <displacementmap_vertex>
        #include <project_vertex>
        #include <logdepthbuf_vertex>
        #include <clipping_planes_vertex>

        vViewPosition = - mvPosition.xyz;

        #include <worldpos_vertex>
        #include <envmap_vertex>
        #include <shadowmap_vertex>
        #include <fog_vertex>
    }
..

Directional Lights Uniforms
---------------------------

When WebGLRenderer is rendering, it maintance it's current state, an instance of
*WebGLRenderState*.

::

    WebGLRenderer.render()
    ->  WebGLRenderState.setupLights( camera )
        ->  WebGLLights.setup( lights, shadows, camera )

The *setup()* function manage directional lights uniforms.

.. code-block:: javascript

    uniforms = {
        direction: new Vector3(),
        color: new Color(),

        shadow: false,
        shadowBias: 0,
        shadowRadius: 1,
        shadowMapSize: new Vector2()
    };

    if ( light.isDirectionalLight ) {
        var uniforms = cache.get( light );

        uniforms.color.copy( light.color ).multiplyScalar( light.intensity );
        uniforms.direction.setFromMatrixPosition( light.matrixWorld );
        vector3.setFromMatrixPosition( light.target.matrixWorld );
        uniforms.direction.sub( vector3 );
        uniforms.direction.transformDirection( viewMatrix );

        uniforms.shadow = light.castShadow;

        if ( light.castShadow ) {

            var shadow = light.shadow;

            uniforms.shadowBias = shadow.bias;
            uniforms.shadowRadius = shadow.radius;
            uniforms.shadowMapSize = shadow.mapSize;

            state.directionalShadowMap[ directionalLength ] = shadowMap;
            state.directionalShadowMatrix[ directionalLength ] = light.shadow.matrix;

            numDirectionalShadows ++;

        }

        state.directional[ array_length - 1 ] = uniforms;
    }
..

.. _three-gem-material-lights:

In *WebGLRenderer.initMaterial()*, the lights' state also updated into materials'
uniforms:

.. code-block:: javascript

    if ( materialProperties.needsLights ) {
        // wire up the material to this renderer's lighting state
        uniforms.ambientLightColor.value = lights.state.ambient;
        uniforms.lightProbe.value = lights.state.probe;
        uniforms.directionalLights.value = lights.state.directional;
        uniforms.spotLights.value = lights.state.spot;
        uniforms.rectAreaLights.value = lights.state.rectArea;
        uniforms.pointLights.value = lights.state.point;
        uniforms.hemisphereLights.value = lights.state.hemi;

        uniforms.directionalShadowMap.value = lights.state.directionalShadowMap;
        uniforms.directionalShadowMatrix.value = lights.state.directionalShadowMatrix;
        uniforms.spotShadowMap.value = lights.state.spotShadowMap;
        uniforms.spotShadowMatrix.value = lights.state.spotShadowMatrix;
        uniforms.pointShadowMap.value = lights.state.pointShadowMap;
        uniforms.pointShadowMatrix.value = lights.state.pointShadowMatrix;
    }
..

This section also shows that if a material receive directional lights, it must
has all the fields. In x-visual, this is been handled by *thrender.createXShaderMaterial()*.

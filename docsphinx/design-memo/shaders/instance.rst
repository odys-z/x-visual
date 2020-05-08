Shader Instance Pool
====================

Instance Management
-------------------

Reference
---------

1. discussion about sharing shader program,

see `Three.js issue 330 <https://github.com/mrdoob/three.js/issues/330>`_

2. Three.js WebGLRenderer.js updating programCache:

.. code-block:: javascript

    function initMaterial( material, fog, object ) {
        // ...
        if ( programChange ) {
            if ( parameters.shaderID ) {
                var shader = ShaderLib[ parameters.shaderID ];
                materialProperties.shader = {
                    name: material.type,
                    uniforms: cloneUniforms( shader.uniforms ),
                    vertexShader: shader.vertexShader,
                    fragmentShader: shader.fragmentShader
                };
            }
            else {
                materialProperties.shader = {
                    name: material.type,
                    uniforms: material.uniforms,
                    vertexShader: material.vertexShader,
                    fragmentShader: material.fragmentShader
                };
            }
        }
        // ...
    }
..

3. Three.js ShadderLib:

.. code-block:: javascript

    /**
     * @author alteredq / http://alteredqualia.com/
     * @author mrdoob / http://mrdoob.com/
     * @author mikael emtinger / http://gomo.se/
     */
    import { ShaderChunk } from './ShaderChunk.js';

    var ShaderLib = {
        basic: {
            uniforms: mergeUniforms( [ ... ] ),
            vertexShader: ShaderChunk.meshbasic_vert,
            fragmentShader: ShaderChunk.meshbasic_frag
        },

        lambert: {
            uniforms: mergeUniforms( [ ... ] ),
            vertexShader: ShaderChunk.meshlambert_vert,
            fragmentShader: ShaderChunk.meshlambert_frag
        },

        phong: {
            uniforms: mergeUniforms( [
                ...,
                {
                    emissive: { value: new Color( 0x000000 ) },
                    specular: { value: new Color( 0x111111 ) },
                    shininess: { value: 30 }
                }
            ] ),

            vertexShader: ShaderChunk.meshphong_vert,
            fragmentShader: ShaderChunk.meshphong_frag
        },

        standard: {
            uniforms: mergeUniforms( [
                UniformsLib.common,
                UniformsLib.envmap,
                ...,
                {
                    emissive: { value: new Color( 0x000000 ) },
                    roughness: { value: 0.5 },
                    metalness: { value: 0.5 },
                    envMapIntensity: { value: 1 } // temporary
                }
            ] ),

            vertexShader: ShaderChunk.meshphysical_vert,
            fragmentShader: ShaderChunk.meshphysical_frag
        },
        ...
    }

    export { ShaderLib };
..

ShaderChunk.js:

.. code-block:: javascript

    ...
    import meshbasic_vert from './ShaderLib/meshbasic_vert.glsl.js';
    ...

    export var ShaderChunk = {
        ...
        meshbasic_vert: meshbasic_vert,
        ...
    }
..

ShaderLib/meshbasic_vert.glsl.js

.. code-block:: javascript

    export default /* glsl */`
        uniform float scale;
        attribute float lineDistance;

        varying float vLineDistance;

        #include <common>
        #include <color_pars_vertex>
        #include <fog_pars_vertex>
        #include <logdepthbuf_pars_vertex>
        #include <clipping_planes_pars_vertex>

        void main() {

            #include <color_vertex>

            vLineDistance = scale * lineDistance;

            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;

            #include <logdepthbuf_vertex>
            #include <clipping_planes_vertex>
            #include <fog_vertex>
        }
    `;
..

ShaderChunk/common.glsl.js:

.. code-block:: javascript

    export default /* glsl */`
        #define PI 3.14159265359
        ...
        #define EPSILON 1e-6

        #ifndef saturate
        // <tonemapping_pars_fragment> may have defined saturate() already
        #define saturate(a) clamp( a, 0.0, 1.0 )
        #endif
        #define whiteComplement(a) ( 1.0 - saturate( a ) )

        float pow2( const in float x ) { return x*x; }
        float pow3( const in float x ) { return x*x*x; }
        float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
        float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
        // expects values in the range of [0,1]x[0,1], returns values in the [0,1] range.
        // do not collapse into a single function per: http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
        highp float rand( const in vec2 uv );

        struct IncidentLight {
            vec3 color;
            vec3 direction;
            bool visible;
        };

        struct ReflectedLight {
            vec3 directDiffuse;
            vec3 directSpecular;
            vec3 indirectDiffuse;
            vec3 indirectSpecular;
        };

        struct GeometricContext {
            vec3 position;
            vec3 normal;
            vec3 viewDir;
        #ifdef CLEARCOAT
            vec3 clearcoatNormal;
        #endif
        };

        vec3 transformDirection( in vec3 dir, in mat4 matrix );

        // http://en.wikibooks.org/wiki/GLSL_Programming/Applying_Matrix_Transformations
        vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix );

        vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal );

        float sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal );

        vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection,
                                 in vec3 pointOnPlane, in vec3 planeNormal );

        mat3 transposeMat3( const in mat3 m );

        // https://en.wikipedia.org/wiki/Relative_luminance
        float linearToRelativeLuminance( const in vec3 color );

        bool isPerspectiveMatrix( mat4 m );
    `;
..

ShaderChunk/color_vertex.glsl.js

.. code-block:: javascript

    export default /* glsl */`
    #ifdef USE_COLOR
        vColor.xyz = color.xyz;
    #endif
    `;
..

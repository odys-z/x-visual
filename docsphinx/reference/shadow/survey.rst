A Survey on Shadowing
=====================

References
----------

1. `Way introduced by Three.js Fundamental <https://threejsfundamentals.org/threejs/lessons/threejs-shadows.html>`_

Not affecting neighbouring objects?

2. The way of Claybook

`Presentation <https://www.dropbox.com/s/s9tzmyj0wqkymmz/Claybook_Simulation_Raytracing_GDC18.pptx?dl=0#>`_

3. Similar of Shadertoy

`Shadertoy Example <https://www.shadertoy.com/view/lsKcDD>`_

`Introduction <https://iquilezles.org/www/articles/rmshadows/rmshadows.htm>`_

4. Shadow texture baking of F4 ?

.. image:: ../imgs/002-f4-shadow.png

The Three.js way
----------------

**Use Case: Directional Light**

Trying Page::

    test/try/shadow-castonly.html

How it works
____________

The directional light shadow mapping process is similar to
`the typical process introduced here <https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping>`_.

- Casting Shadow (Directional)

Shadow map's bias, size & texture been set by *WebGLLights#setup( lights, shadows, camera )*.

source file::

    three/src/renderers/webgl/WebGLLights.js

Depth buffer is been rendered by *WebGLShadowMap#render()*::

    three/src/renderers/webgl/WebGLShadowMap.js

With light casting shadow, any mesh created by x-visual can cast shadow receivable
by Three.js materials. See test page::

    test/html/ecs-basics/shadow-castonly.html

- Receiving Shadow

For mesh receiveShadow = true, shaderProgram will create shader program with glsl
source handling shadow map.

source file::

    three/src/renderers/webgl/WebGLProgram.js

Code snippet setting glsl source in constructor:

.. code-block:: javascript

    function WebGLProgram( renderer, extensions, cacheKey, material, shader, parameters ) {
        // ...
        var glVertexShader = WebGLShader( gl, gl.VERTEX_SHADER, vertexGlsl );
        var glFragmentShader = WebGLShader( gl, gl.FRAGMENT_SHADER, fragmentGlsl );

        gl.attachShader( program, glVertexShader );
        gl.attachShader( program, glFragmentShader );
        // ...
    }
..

Glsl Source
___________

Three.js shadow map with directional light's shader likely source instance is
recorded here for reference.

-fs

.. code-block:: glsl

    precision highp float;
    precision highp int;
    #define HIGH_PRECISION
    #define SHADER_NAME MeshPhongMaterial
    #define SHADOWMAP_TYPE_PCF_SOFT

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;
    uniform mat3 normalMatrix;
    uniform vec3 cameraPosition;
    uniform bool isOrthographic;

    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    attribute vec3 color;

    varying vec3 vViewPosition;
    varying vec3 vNormal;

    #define PI 3.14159265359
    #define PI2 6.28318530718
    #define PI_HALF 1.5707963267949
    #define RECIPROCAL_PI 0.31830988618
    #define RECIPROCAL_PI2 0.15915494
    #define LOG2 1.442695
    #define EPSILON 1e-6

    #define saturate(a) clamp( a, 0.0, 1.0 )

    #define whiteComplement(a) ( 1.0 - saturate( a ) )

    float pow2( const in float x ) { return x*x; }
    float pow3( const in float x ) { return x*x*x; }
    float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
    float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }

    float max3( vec3 v ) { return max( max( v.x, v.y ), v.z ); }
    float precisionSafeLength( vec3 v ) {
        float maxComponent = max3( abs( v ) );
        return length( v / maxComponent ) * maxComponent;
    }

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
    };

    vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
        return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
    }
    // vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
    //      return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
    // }
    // vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
    //     float distance = dot( planeNormal, point - pointOnPlane );
    //     return - distance * planeNormal + point;
    // }
    // vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {
    //    return lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;
    // }
    // mat3 transposeMat3( const in mat3 m ) {
    //      mat3 tmp;
    //      tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
    //      tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
    //      tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
    //      return tmp;
    // }

    varying vec2 vUv;
    uniform mat3 uvTransform;

    varying vec3 vReflect;
    uniform float refractionRatio;

    varying vec3 vColor;

    // shadow map
    uniform mat4 directionalShadowMatrix[ 1 ];
    varying vec4 vDirectionalShadowCoord[ 1 ];

    void main() {
        vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
        vColor.xyz = color.xyz;
        vec3 objectNormal = vec3( normal );
        vec3 transformedNormal = objectNormal;
        transformedNormal = normalMatrix * transformedNormal;
        vNormal = normalize( transformedNormal );
        vec3 transformed = vec3( position );
        vec4 mvPosition = vec4( transformed, 1.0 );
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
        vViewPosition = - mvPosition.xyz;
        vec4 worldPosition = vec4( transformed, 1.0 );

        worldPosition = modelMatrix * worldPosition;
        vWorldPosition = worldPosition.xyz;

        vDirectionalShadowCoord[ 0 ] = directionalShadowMatrix[ 0 ] * worldPosition;
    }
..

:ref:`raw fragment glsl source<shadow-ground-frag-raw>`

-vs

.. code-block:: glsl

    #extension GL_OES_standard_derivatives : enable
    precision highp float;
    precision highp int;
    #define HIGH_PRECISION
    #define SHADER_NAME MeshPhongMaterial

    // #define DOUBLE_SIDED
    #define USE_SHADOWMAP
    #define SHADOWMAP_TYPE_PCF
    uniform mat4 viewMatrix;
    uniform vec3 cameraPosition;
    uniform bool isOrthographic;

    uniform float toneMappingExposure;
    vec3 toneMapping( vec3 color ) { return toneMappingExposure * color; }

    #define PHONG
    uniform vec3 diffuse;
    uniform vec3 emissive;
    uniform vec3 specular;
    uniform float shininess;
    uniform float opacity;
    #define PI 3.14159265359
    #define PI2 6.28318530718
    #define PI_HALF 1.5707963267949
    #define RECIPROCAL_PI 0.31830988618
    #define RECIPROCAL_PI2 0.15915494
    #define LOG2 1.442695
    #define EPSILON 1e-6

    #define saturate(a) clamp( a, 0.0, 1.0 )

    float pow2( const in float x ) { return x*x; }
    float pow3( const in float x ) { return x*x*x; }
    float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
    float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
    float precisionSafeLength( vec3 v ) { return length( v ); }

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
    };
    vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
        return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
    }
    vec3 packNormalToRGB( const in vec3 normal ) {
        return normalize( normal ) * 0.5 + 0.5;
    }
    vec3 unpackRGBToNormal( const in vec3 rgb ) {
        return 2.0 * rgb.xyz - 1.0;
    }
    const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
    const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
    const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
    const float ShiftRight8 = 1. / 256.;
    float unpackRGBAToDepth( const in vec4 v ) {
        return dot( v, UnpackFactors );
    }

    varying vec2 vUv;

    uniform sampler2D map;

    vec3 BRDF_Diffuse_Lambert( const in vec3 diffuseColor ) {
        return RECIPROCAL_PI * diffuseColor;
    }
    vec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {
        float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );
        return ( 1.0 - specularColor ) * fresnel + specularColor;
    }

    float D_BlinnPhong( const in float shininess, const in float dotNH ) {
        return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
    }
    vec3 BRDF_Specular_BlinnPhong( const in IncidentLight incidentLight,
            const in GeometricContext geometry, const in vec3 specularColor,
            const in float shininess ) {
        vec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );
        float dotNH = saturate( dot( geometry.normal, halfDir ) );
        float dotLH = saturate( dot( incidentLight.direction, halfDir ) );
        vec3 F = F_Schlick( specularColor, dotLH );
        float G = 0.25; // G_BlinnPhong_Implicit( );
        float D = D_BlinnPhong( shininess, dotNH );
        return F * ( G * D );
    }

    uniform bool receiveShadow;
    uniform vec3 ambientLightColor;
    uniform vec3 lightProbe[ 9 ];
    vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
        float x = normal.x, y = normal.y, z = normal.z;
        vec3 result = shCoefficients[ 0 ] * 0.886227;
        result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
        result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
        result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
        result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
        result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
        result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
        result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
        result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
        return result;
    }
    vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in GeometricContext geometry ) {
        vec3 worldNormal = inverseTransformDirection( geometry.normal, viewMatrix );
        vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
        return irradiance;
    }
    vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
        vec3 irradiance = ambientLightColor;

        irradiance *= PI;

        return irradiance;
    }

    struct DirectionalLight {
        vec3 direction;
        vec3 color;
        int shadow;
        float shadowBias;
        float shadowRadius;
        vec2 shadowMapSize;
    };
    uniform DirectionalLight directionalLights[ 1 ];
    void getDirectionalDirectLightIrradiance( const in DirectionalLight directionalLight,
                const in GeometricContext geometry, out IncidentLight directLight ) {
        directLight.color = directionalLight.color;
        directLight.direction = directionalLight.direction;
        directLight.visible = true;
    }

    varying vec3 vViewPosition;

    varying vec3 vNormal;

    struct BlinnPhongMaterial {
        vec3    diffuseColor;
        vec3    specularColor;
        float    specularShininess;
        float    specularStrength;
    };

    void RE_Direct( const in IncidentLight directLight, const in GeometricContext geometry,
                    const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
        float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
        vec3 irradiance = dotNL * directLight.color;

        irradiance *= PI;

        reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
        reflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong(
                directLight, geometry, material.specularColor, material.specularShininess )
                * material.specularStrength;
    }
    void RE_IndirectDiffuse( const in vec3 irradiance, const in GeometricContext geometry,
                    const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
        reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
    }

    // shadow map
    uniform sampler2D directionalShadowMap[ 1 ];
    varying vec4 vDirectionalShadowCoord[ 1 ];

    float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
        return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
    }

    float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias,
                    float shadowRadius, vec4 shadowCoord ) {
        float shadow = 1.0;
        shadowCoord.xyz /= shadowCoord.w;
        shadowCoord.z += shadowBias;
        bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0,
                                     shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
        bool inFrustum = all( inFrustumVec );
        bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
        bool frustumTest = all( frustumTestVec );
        if ( frustumTest ) {
            vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
            float dx0 = - texelSize.x * shadowRadius;
            float dy0 = - texelSize.y * shadowRadius;
            float dx1 = + texelSize.x * shadowRadius;
            float dy1 = + texelSize.y * shadowRadius;
            float dx2 = dx0 / 2.0;
            float dy2 = dy0 / 2.0;
            float dx3 = dx1 / 2.0;
            float dy3 = dy1 / 2.0;
            shadow = (
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
                texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
            ) * ( 1.0 / 17.0 );
        }
        return shadow;
    }

    void main() {
        vec4 diffuseColor = vec4( diffuse, opacity );
        ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ),
                                        vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
        vec3 totalEmissiveRadiance = emissive;

        vec4 texelColor = texture2D( map, vUv );
        diffuseColor *= texelColor;

        float specularStrength;

        specularStrength = 1.0;

        vec3 normal = normalize( vNormal );
        normal = normal * ( float( gl_FrontFacing ) * 2.0 - 1.0 ); // DOUBLE_SIDED

        vec3 geometryNormal = normal;

        BlinnPhongMaterial material;
        material.diffuseColor = diffuseColor.rgb;
        material.specularColor = specular;
        material.specularShininess = shininess;
        material.specularStrength = specularStrength;

        GeometricContext geometry;
        geometry.position = - vViewPosition;
        geometry.normal = normal;
        geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

        IncidentLight directLight;

        DirectionalLight directionalLight;

        directionalLight = directionalLights[ 0 ];
        getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );

        directLight.color *= all( bvec3( directionalLight.shadow, directLight.visible, receiveShadow ) )
                ? getShadow( directionalShadowMap[ 0 ], directionalLight.shadowMapSize,
                  directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ 0 ] )
                : 1.0;

        RE_Direct( directLight, geometry, material, reflectedLight ); // out: reflectedLight

        vec3 iblIrradiance = vec3( 0.0 );
        vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
        irradiance += getLightProbeIrradiance( lightProbe, geometry );

        RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );

        vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse
                + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

        gl_FragColor = vec4( outgoingLight, diffuseColor.a );

        gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
    }
..

.. https://stackoverflow.com/questions/14345922/how-to-do-a-link-to-a-file-in-rst-with-sphinx

:ref:`raw vertex glsl source<shadow-ground-vert-raw>`

GLTF Format
===========

city/scene.gltf representation
------------------------------

Some parts of low poly city gltf assets:

.. code-block:: json

  { "accessors": [
    { "bufferView": 2, "componentType": 5126, "count": 1762,
      "max": [ 25.192995071411133, 10.835280418395996, 27.863927841186523 ],
      "min": [ -18.667209625244141, -29.31907844543457, -72.12615966796875 ],
      "type": "VEC3" },
    { "bufferView": 2, "byteOffset": 21144, "componentType": 5126, "count": 1762,
      "max": [ 1, 1, 0.98781126737594604 ], "min": [ -1, -1, -1 ],
      "type": "VEC3" }, ],
    "asset": {
      "extras": { "author": "antonmoek (https://sketchfab.com/antonmoek)",
        "license": "CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)",
        "source": "https://sketchfab.com/models/edd1c604e1e045a0a2a552ddd9a293e6",
        "title": "Cartoon Lowpoly Small City Free Pack" },
        "generator": "Sketchfab-3.25.5", "version": "2.0" },
      "bufferViews": [
        { "buffer": 0, "byteLength": 443160, "byteOffset": 0, "name": "floatBufferViews", "target": 34963 },
        { "buffer": 0, "byteLength": 557656, "byteOffset": 443160, "byteStride": 8, "name": "floatBufferViews", "target": 34962 },
        { "buffer": 0, "byteLength": 1672968, "byteOffset": 1000816, "byteStride": 12, "name": "floatBufferViews", "target": 34962 },
        { "buffer": 0, "byteLength": 1115312, "byteOffset": 2673784, "byteStride": 16, "name": "floatBufferViews", "target": 34962 } ],
      "buffers": [ { "byteLength": 3789096, "uri": "scene.bin" } ],
      "images": [
        { "uri": "textures/World_ap.16_baseColor.jpeg" },
        ...
        { "uri": "textures/World_ap.11_baseColor.jpeg" } ],
      "materials": [
        { "doubleSided": true, "emissiveFactor": [ 0, 0, 0 ],
          "name": "World_ap",
          "pbrMetallicRoughness": { "baseColorFactor": [ 1, 1, 1, 1 ], "baseColorTexture": { "index": 4, "texCoord": 0 },
          "metallicFactor": 0, "roughnessFactor": 1 } },
        { "doubleSided": true, "emissiveFactor": [ 0, 0, 0 ], "name":
          "World_ap.8",
          "pbrMetallicRoughness": { "baseColorFactor": [ 1, 1, 1, 1 ], "baseColorTexture": { "index": 6, "texCoord": 0 },
          "metallicFactor": 0, "roughnessFactor": 0.59999999999999998 } },
        ...
    ],
    "meshes": [
        { "name": "CAR_03_1_World ap_0",
          "primitives": [
            { "attributes": { "NORMAL": 1, "POSITION": 0, "TANGENT": 2, "TEXCOORD_0": 3 },
              "indices": 4, "material": 0, "mode": 4 }
          ] },
        { "name": "CAR_03_World ap_0",
          "primitives": [
            { "attributes": { "NORMAL": 6, "POSITION": 5, "TANGENT": 7, "TEXCOORD_0": 8 },
              "indices": 9, "material": 0, "mode": 4 }
          ] },
        ...
    ],
    "nodes": [
        { "children": [ 1 ], "name": "RootNode (gltf orientation matrix)", "rotation": [ -0.70710678118654746, -0, -0, 0.70710678118654757 ] },
        { "children": [ 2 ], "name": "RootNode (model correction matrix)" },
        { "children": [ 3 ], "matrix": [ 1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1 ], "name": "4d4100bcb1c640e69699a87140df79d7.fbx" },
        { "children": [ 4, 6, 22, 65, 98, 134, 178, 227, 237 ], "name": "RootNode" },
        ...
        { "children": [ 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63 ], "matrix": [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -369.06906127929688, -90.703544616699219, -920.1591796875, 1 ],
          "name": "Cars" },
        { "children": [ 24 ], "matrix": [ -1.1161040868103447, 1.3668332938134597e-16, -1.002153514889434, 0, -1.8070770596253361e-08, 1.4999999999999998, 2.0125520511237016e-08, 0, 1.002153514889434, 2.7047907974381987e-08, -1.1161040868103445, 0, 22.131305694580078, 14.663174629211426, -475.07095336914062, 1 ],
          "name": "CAR_03_1" },
        { "mesh": 0, "name": "CAR_03_1_World ap_0" },
        { "children": [ 26 ], "matrix": [ -0.039509975088762972, 4.8385761910227429e-18, -1.4994795636715044, 0, 1.6096576513098873e-09, 1.5, -4.2413066498289683e-11, 0, 1.4994795636715044, -1.610216327898289e-09, -0.039509975088762972, 0, -281.15509033203125, 14.663183212280273, 108.45243835449219, 1 ],
          "name": "CAR_03" },
        { "mesh": 1, "name": "CAR_03_World ap_0" },
        ...
    ],
    "samplers": [ { "magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497 } ],
    "scene": 0,
    "scenes": [ { "name": "OSG_Scene", "nodes": [ 0 ] } ],
    "textures": [
        { "sampler": 0, "source": 0 },
        ...
    ]
..

Note: 21144 = 1762 x 12

Node Example
------------

The loaded node example (name = 'Tree-1-3')

::

    for city/scene.gltf, paras.nodes = ['Tree-1-3'],
    nodes[0].children[0].type == 'Mesh',
    nodes[0].children[0].geometry is a BufferGeometry, with array of
    BufferAttributes as 'attributes'.
    nodes[0].children[0].geometry.attributes['position'] ==
       length: 2772
       dynamic: false
       name: ""
       array: Float32Array(2772) [135.61163330078125, 31.193208694458008, -2.098475694656372, …]
       itemSize: 3
       count: 924
       normalized: false
       usage: 35044
       updateRange: {offset: 0, count: -1}
       version: 0


Three.js GLTFLoader
-------------------

The gltf loader processing can be simplify and clarified if with some basic gltf
knowledge.

.. code-block:: javascript

    function GLTFLoader( manager ) {
        parse: function ( data, path, onLoad, onError ) {
            var parser = new GLTFParser( json, extensions, { manager: this.manager } );
            parser.parse( onLoad, onError );
        }
    }

    function GLTFParser( json, extensions, options ) {
        this.json = json || {};
        this.extensions = extensions || {};
        this.options = options || {};

        this.parse = function ( onLoad, onError ) {
            var parser = this;
            var json = this.json;
            var extensions = this.extensions;
            Promise.all( [
                this.getDependencies( 'scene' ),
                this.getDependencies( 'animation' ),
                this.getDependencies( 'camera' ),
            ] ).then( function ( dependencies ) {
                var result = {
                    scene: dependencies[ 0 ][ json.scene || 0 ],
                    asset: json.asset,
                    ...
                };
                ...
                onLoad( result );
            } ).catch( onError );
        };

..

This loading and parsing is finished after multiple dependency like mesh, nodes,
etc. been parsed.

.. code-block:: javascript

    /**Ody: Load mesh with vertices accessing via accessors.
     * For a primitive.mode == WEBGL_CONSTANTS.TRIANGLES, it's
     * new Mesh( geometry, material )
     *
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
     * @param {number} meshIndex
     * @return {Promise<Group|Mesh|SkinnedMesh>}
     */
    GLTFParser.prototype.loadMesh = function ( meshIndex ) {
        var parser = this;
        var json = this.json;
        var meshDef = json.meshes[ meshIndex ];
        var primitives = meshDef.primitives;
        var pending = [];

        for ( var i = 0, il = primitives.length; i < il; i ++ ) {
            var material = primitives[ i ].material === undefined
                ? createDefaultMaterial()
                : this.getDependency( 'material', primitives[ i ].material );
            pending.push( material );
        }

        return Promise.all( pending ).then( function ( originalMaterials ) {
            return parser.loadGeometries( primitives )
              // Ody:
              // geometries must be BufferGeometry. See GLTFParser.loadGeometries()
              .then( function ( geometries ) {
                var meshes = [];
                for ( var i = 0, il = geometries.length; i < il; i ++ ) {
                    var geometry = geometries[ i ];
                    var primitive = primitives[ i ];
                    // 1. create Mesh
                    var mesh;
                    var material = originalMaterials[ i ];
                    if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES ) {
                        mesh = meshDef.isSkinnedMesh === true
                            ? new SkinnedMesh( geometry, material )
                            : new Mesh( geometry, material );
                    } else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {
                        mesh = new LineSegments( geometry, material );
                    }
                    else ...
                    mesh.name = meshDef.name || ( 'mesh_' + meshIndex );
                    if ( geometries.length > 1 ) mesh.name += '_' + i;
                    ...
                    meshes.push( mesh );
                }
                return meshes[ 0 ];
            } );
        } );
    };

    /**Requests the specified dependency asynchronously, with caching.
     * Ody:
     * Dependency means scene, node, mesh, materail etc., except scenes.
     * Anything that can be dependend by others.
     * @param {string} type
     * @param {number} index
     * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
     */
    GLTFParser.prototype.getDependency = function ( type, index ) {
        var cacheKey = type + ':' + index;
        var dependency = this.cache.get( cacheKey );

        if ( ! dependency ) {
            switch ( type ) {
                case 'scene':
                    dependency = this.loadScene( index );
                    break;
                case 'camera':
                    dependency = this.loadCamera( index );
                    break;
                ...
                default:
                    throw new Error( 'Unknown type: ' + type );
            }
            this.cache.add( cacheKey, dependency );
        }
        return dependency;
    };
..

.. _xv-gltf-loader:

The X-visual Edition
--------------------

Which is an x-visual vision of GLTF loader modified from There.js GLTFLoader.

Source: x-visual/packages/three/GLTFLoader

The modification includes:

Exposing Raw Nodes/Geometry Buffer
++++++++++++++++++++++++++++++++++

1. Add the scope (GLTFLoader stack) as the argument of GLTFParser constructor,
which makes the GLTFLoader instance can be accessed while parsing nodes.

.. code-block:: javascript

    function GLTFLoader( manager ) {
        this.nodeMap = {};

        load: function ( url, onLoad, onProgress, onError ) {
            var scope = this;
            var loader = new FileLoader( scope.manager );
            loader.load( url, function ( data ) {
                try {
                    scope.parse( data, resourcePath, function ( gltf ) {
                        onLoad( gltf, scope.nodeMap );
                    }, _onError, scope );
                } catch ( e ) {
                    _onError( e );
                }
            }, onProgress, _onError );
        },

        parse: function ( data, path, onLoad, onError, loaderScope ) {
            var parser = new GLTFParser( json, extensions,
                { ... },
                loaderScope );

            parser.parse( onLoad, onError );
    }

    function GLTFParser( json, extensions, options, scope ) {
        this.loaderScope = scope;
        this.json = json || {};
        ...
    }

    GLTFParser.prototype.parse = function ( onLoad, onError ) {
        var parser = this;
        var json = this.json;
        var extensions = this.extensions;

        Promise.all( [
            this.getDependencies( 'scene' ),
            this.getDependencies( 'animation' ),
            this.getDependencies( 'camera' ),
            // modification
            // nodes[ix].children.geometry.attributes.position is a BufferAttribute
            // nodes[ix].children.geometry.attributes.position.array is a Float32Array
            this.getDependencies( 'node' ),
        ] ).then( function ( dependencies ) {
                ...
            }
    }
..

2. When parsing nodes, update a map in 'scope' so nodes name - index can be found
out.

.. code-block:: javascript

    GLTFParser.prototype.loadNode = function ( nodeIndex ) {
            ...
        }()
            // then build node (Object3D etc.) with the objects
            .then( function ( objects ) {
                return ( function () {
                        ...
                        if (!node.name) {
                            node.name = String(nodeDef.idx);
                        }
                        scope.nodeMap[node.name] = nodeDef.idx;
                        return node;
                    } );
            });
..

3. After every thing done, the nodes array also been taken out in gltf results.

.. code-block:: javascript

    GLTFParser.prototype.parse = function ( onLoad, onError ) {
        Promise.all(
            ...    // see 2.
        ).then( function ( dependencies ) {
            var result = {
                    scene: dependencies[ 0 ][ json.scene || 0 ],
                    scenes: dependencies[ 0 ],
                    animations: dependencies[ 1 ],
                    cameras: dependencies[ 2 ],
                    // odys-z
                    nodes: dependencies[3],
                    asset: json.asset,
                    parser: parser,
                    userData: {}
                };
            onLoad( result ); // callback reporting results to caller
    };
..

References
----------

- `GLTF Home Page <https://www.khronos.org/gltf/>`_

- `GLTF Github <https://github.com/KhronosGroup/glTF-Tutorials>`_

- `GLTF Tutorial, Github <https://github.com/KhronosGroup/glTF-Tutorials/blob/master/gltfTutorial/README.md>`_

Geometries
==========

Frenet Frame & Dir Tube
-----------------------

In three.js, `Frenet Frame <https://en.wikipedia.org/wiki/Frenet%E2%80%93Serret_formulas>`_
is used for generating `TubeGeometry <https://threejs.org/docs/#api/en/geometries/TubeBufferGeometry>`_.

To generate a tube, the TubeGeomerty calling Curve.computeFrenetFrames() to create
parallel curves, then build mesh points with indecis.

.. code-block:: javascript

    function TubeBufferGeometry( path, tubularSegments, radius, radialSegments, closed ) {
        BufferGeometry.call( this );
        this.type = 'TubeBufferGeometry';
        this.parameters = {
            path: path,
            tubularSegments: tubularSegments,
            radius: radius,
            radialSegments: radialSegments,
            closed: closed
        };

        tubularSegments = tubularSegments || 64;
        radius = radius || 1;
        radialSegments = radialSegments || 8;
        closed = closed || false;

        var frames = path.computeFrenetFrames( tubularSegments, closed );

        // expose internals
        this.tangents = frames.tangents;
        this.normals = frames.normals;
        this.binormals = frames.binormals;

        // helper variables
        var vertex = new Vector3();
        var normal = new Vector3();
        var uv = new Vector2();
        var P = new Vector3();

        var i, j;

        // buffer
        var vertices = [];
        var normals = [];
        var uvs = [];
        var indices = [];

        // create buffer data
        generateBufferData();

        // build geometry
        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

        function generateBufferData() {
            for ( i = 0; i < tubularSegments; i ++ ) {
                generateSegment( i );
            }
            generateSegment( ( closed === false ) ? tubularSegments : 0 );
            generateUVs();
            generateIndices();
        }
    }
..

DirTubeGeometry of x-visual
___________________________

TODO ...

Reference
_________

1. Three.js class: *TubeGeometry* `docs <https://threejs.org/docs/#api/en/geometries/TubeBufferGeometry>`_
& `src <https://github.com/mrdoob/three.js/blob/79edf22a345079dc6cf5d8c6ad38ee22e9edab3c/src/geometries/TubeGeometry.js#L55>`_.

2. Three.js class: `*Curve* <https://github.com/mrdoob/three.js/blob/master/src/extras/core/Curve.js#L270>`_

3. `Andrew J. Hanson and Hui Ma, *Parallel Transport Approach to Curve Framing* <https://legacy.cs.indiana.edu/ftp/techreports/TR425.pdf>`_,
   Department of Computer Science, Indiana University

4. `*Frenet–Serret formulas*, wikipedia <https://en.wikipedia.org/wiki/Frenet%E2%80%93Serret_formulas>`_

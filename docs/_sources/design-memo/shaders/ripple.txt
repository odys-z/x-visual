Ripples
=======

Ripple by distance displacement
-------------------------------

`Shock Wave <https://www.shadertoy.com/view/XsXGR7>`_ way of distance can be
optimized.

.. code-block:: glsl

    /* The original way
    void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
         float t = mod(iTime, 3.);
         vec3 waveParams = vec3( 10.0, 0.8, 0.1 );
         vec2 uv = fragCoord.xy / iResolution.xy;
         uv = uv * 2. - 1.;
         vec2 texCoord = uv;
         float distance = length(uv);

         if ( distance <= t + waveParams.z && distance >= t - waveParams.z )
         {
                float diff = distance - t;
                float powDiff = 1.0 - pow(abs(diff*waveParams.x), waveParams.y);

                float diffTime = diff  * powDiff;
                vec2 diffUV = normalize(uv);
                texCoord = uv + (diffUV * diffTime);

         }
         vec4 original = texture( iChannel0, texCoord);
         fragColor = original;
    }
    */
    void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
         float t = mod(iTime, 3.);
         vec3 waveParams = vec3( 10.0, 0.8, 0.1 );
         vec2 uv = fragCoord.xy / iResolution.xy;
         // uv = uv * 2. - 1.;
         vec2 texCoord = uv;
         float distance = length(uv * 2. -1.);

         float d = smoothstep(t - 0.06, t, distance);
              d -= smoothstep(t, t + 0.03, distance);
         texCoord = uv * (1. + 0.0125 * d / pow(distance, 1.6));

         vec4 original = texture( iChannel0, texCoord);
         fragColor = original;
    }
..

`Rainy mood <https://www.shadertoy.com/view/XslcWn>`_

Ripple distortion by triangle functions.
----------------------------------------

`RippleEffectFragmentShader  <https://www.shadertoy.com/view/ldBXDD>`_

.. code-block:: glsl

    // Ref: http://adrianboeing.blogspot.in/2011/02/ripple-effect-in-webgl.html
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        // pixel position normalised to [-1, 1]
        vec2 cPos = -.5 + 2.0 * fragCoord.xy / iResolution.xy;

        // distance of current pixel from center
        float cLength = length(cPos);

        // vec2 uv = fragCoord.xy/iResolution.xy+(cPos/pow(cLength, 2.))*cos(cLength*12.0-iTime*4.0) * 0.03;

        vec2 uv = fragCoord.xy/iResolution.xy;
        // abs(0.75*sin(2*x)/x + 1*sin(0.5*x)/x) / 1.75
        float s = iTime * 0.125;
        uv += (cPos/pow(cLength, 2.))*cos(cLength*12.0-iTime*14.0) * 0.03
              * abs(0.75*sin(s)/s + sin(0.5*s)/(0.5*s)) / 1.75;
        vec3 col = texture(iChannel0,uv).xyz;

        fragColor = vec4(col,1.0);
    }
..

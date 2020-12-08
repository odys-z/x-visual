import { glx, glConfig } from './glx.glsl';

export function colorLine(vparas) {
    return {
        vertexShader: `
            out vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`.replaceAll(/ {12}/g, ''),
        fragmentShader: `
            uniform float u_alpha;
            uniform vec3 u_color;

            varying vec2 vUv;
            void main() {
                gl_FragColor = vec4(u_color, u_alpha);
            }`.replaceAll(/ {12}/g, ''),
        };
}

export function colorLine(vparas) {
 return {
  vertexShader: `
    varying vec2 vUv;
      void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
  fragmentShader: `
    uniform float u_alpha;
    uniform vec3 u_color;

    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(u_color, u_alpha);
    }` };
}

precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
attribute vec3 translate;
attribute vec3 position;
attribute vec3 color;
attribute float radius;
attribute vec2 uv;
varying vec2 vUv;
varying vec3 vColor;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(translate, 1.0);
  mvPosition.xyz += position * radius + radius * 0.5;
  vColor = color;
  vUv = uv;
  gl_Position = projectionMatrix * mvPosition;
}
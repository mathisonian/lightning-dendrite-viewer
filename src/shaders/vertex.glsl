attribute vec3 position;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

attribute vec2 texturePosition;
varying vec2 texCoord;

void main() {
  gl_Position = projection * view * model * vec4(position, 1);
  texCoord = texturePosition;
}

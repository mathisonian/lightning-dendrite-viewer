precision highp float;
uniform sampler2D texture;
varying vec2 texCoord;
void main() {

  vec4 c = texture2D(texture, texCoord);

  // if (c.r < 0.01) {
  //   c.a = 0.0;
  // }

  gl_FragColor = c;
}

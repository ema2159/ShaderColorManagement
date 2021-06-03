precision highp float;
uniform sampler2D image;
uniform sampler2D srcLUT;
uniform sampler2D dstLUT;
uniform vec2 resolution;
uniform float scale;
uniform int interpolation;

varying vec2 vUv;

void main(void) {

  vec2 cellSize = 1.0 / resolution.xy;
  vec2 uv = vUv.xy;
  vec3 lutSize = vec3(63.0, 64.0, 4095.0);
  float stepR = 1.0/lutSize.r;
  float stepG = lutSize.g/lutSize.b;
  float stepB = 1.0/lutSize.b;
  vec3 srcCoords = vec3(0.0, 0.0, 0.0);
  vec2 coords;
  coords.x = clamp(srcCoords.b, 0.0, 63.0)*stepB + (srcCoords.g*stepG);
  coords.y = 1.0-srcCoords.r*stepR;

  vec3 textureValue;
  if (interpolation == 0) {
    textureValue = texture2D(srcLUT, coords).rgb;
  } else if (interpolation == 1) {
    textureValue = texture2D(image, uv).rgb;
  } else if (interpolation == 2) {
    textureValue = texture2D(image, uv).rgb;
  }

  gl_FragColor = vec4(textureValue, 1.0);
}

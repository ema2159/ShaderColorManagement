precision highp float;
uniform sampler2D image;
uniform sampler2D srcLUT;
uniform sampler2D dstLUT;
uniform vec2 resolution;
uniform float scale;
uniform int interpolation;

varying vec2 vUv;

const vec3 lutSize = vec3(63.0, 64.0, 4095.0);
const float stepR = 1.0/lutSize.r;
const float stepG = lutSize.g/lutSize.b;
const float stepB = 1.0/lutSize.b;

vec3 trilinear_helper(vec3 pix, sampler2D LUT, vec3 shift) {
  vec2 coords;
  coords.x = clamp(pix.b+shift.b, 0.0, 63.0)*stepB + (pix.g+shift.g)*stepG;
  coords.y = 1.0-(pix.r+shift.r)*stepR;

  return texture2D(LUT, coords).rgb;
}

vec3 trilinear_interpolation(vec3 pix, sampler2D LUT) {
  // LUT
  pix *= 63.0;
  vec3 interp = modf(pix, pix);
  vec3 C_000, C_100, C_010, C_110, C_001, C_101, C_011, C_111, C_00, C_01, C_10,
       C_11, C_0, C_1, C;
  vec2 coords;
  // C_00
  // C_000
  C_000 = trilinear_helper(pix, LUT, vec3(0.0));
  // C_100
  C_100 = trilinear_helper(pix, LUT, vec3(0.0, 0.0, 1.0));

  C_00 = mix(C_000, C_100, interp.b);

  // C_10
  // C_010
  C_010 = trilinear_helper(pix, LUT, vec3(1.0, 0.0, 0.0));
  // C_110
  C_110 = trilinear_helper(pix, LUT, vec3(1.0, 0.0, 1.0));

  C_10 = mix(C_010, C_110, interp.b);

  // C_01
  // C_001
  C_001 = trilinear_helper(pix, LUT, vec3(0.0, 1.0, 0.0));
  // C_101
  C_101 = trilinear_helper(pix, LUT, vec3(0.0, 1.0, 1.0));

  C_01 = mix(C_001, C_101, interp.b);

  // C_11
  // C_011
  C_011 = trilinear_helper(pix, LUT, vec3(1.0, 1.0, 0.0));
  // C_111
  C_111 = trilinear_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

  C_11 = mix(C_011, C_111, interp.b);

  // C_0, C_1
  C_0 = mix(C_00, C_10, interp.r);
  C_1 = mix(C_01, C_11, interp.r);

  // C
  C = mix(C_0, C_1, interp.g);

  return C;
}

void main(void) {

  vec2 cellSize = 1.0 / resolution.xy;
  vec2 uv = vUv.xy;

  // vec3 srcCoords = vec3(63.0, 0.0, 63.0);
  // vec2 coords;
  // coords.x = clamp(srcCoords.b, 0.0, 63.0)*stepB + (srcCoords.g*stepG);
  // coords.y = 1.0-srcCoords.r*stepR;

  vec3 textureValue;
  if (interpolation == 0) {
    // textureValue = texture2D(srcLUT, coords).rgb;
    // textureValue = texture2D(image, uv).rgb;
    vec3 pix = texture2D(image, uv).rgb;
    textureValue = trilinear_interpolation(pix, srcLUT);
  } else if (interpolation == 1) {
    textureValue = texture2D(image, uv).rgb;
  } else if (interpolation == 2) {
    textureValue = texture2D(image, uv).rgb;
  }

  gl_FragColor = vec4(textureValue, 1.0);
}

const vertexShader = `
uniform float scaleX;
uniform float scaleY;

varying vec2 vUv;

vec2 scale_coord(vec2 pt, float scaleX, float scaleY) {
  mat2 scale_mat = mat2(scaleX, 0, 0, scaleY);
  return scale_mat * pt;
}

void main() {
  vUv = vec2( uv.x, uv.y );
  
  vec3 pos = position;
  pos.xy = scale_coord(pos.xy, scaleX, scaleY);
  
  gl_Position = projectionMatrix *
    modelViewMatrix * vec4(pos, 1.0 );
}
`
const fragmentShader = `
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
  vec2 lutSize = vec2(64, 4095);
  float stepG = lutSize.x/lutSize.y;
  vec3 srcCoords = vec3(0.0, 0.0, 0.0);
  vec2 coords;
  coords.x = (srcCoords.b/4096.0) + (srcCoords.g*stepG);
  coords.y = 1.0;

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
`
export {vertexShader, fragmentShader}

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

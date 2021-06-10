precision highp float;
uniform sampler2D u_image;
uniform int u_LUTChoice;
uniform sampler2D u_srcLUT;
uniform sampler2D u_dstLUT;
uniform vec2 resolution;
uniform int u_interpolation;

varying vec2 vUv;

const vec3 lutSize = vec3(63.0, 64.0, 4095.0);
const float stepR = 1.0/lutSize.r;
const float stepG = lutSize.g/lutSize.b;
const float stepB = 1.0/lutSize.b;

vec3 intp_helper(vec3 pix, sampler2D LUT, vec3 shift) {
  vec2 coords;
  coords.x = clamp(pix.b+shift.b, 0.0, 63.0)*stepB + (pix.g+shift.g)*stepG;
  coords.y = 1.0-(pix.r+shift.r)*stepR;

  return texture2D(LUT, coords).rgb;
}

vec3 trilinear_interpolation(vec3 pix, sampler2D LUT) {
  // Represent the current image pixel color coordinates in the interval [0, 63]
  pix *= 63.0;
  // Store integer part of color coordinates in pix and fractional part in interp
  vec3 interp = modf(pix, pix);
  vec3 C_000, C_100, C_010, C_110, C_001, C_101, C_011, C_111, C_00, C_01, C_10,
       C_11, C_0, C_1, C;

  // C_00
  // C_000
  C_000 = intp_helper(pix, LUT, vec3(0.0));
  // C_100
  C_100 = intp_helper(pix, LUT, vec3(0.0, 0.0, 1.0));

  C_00 = mix(C_000, C_100, interp.b);

  // C_10
  // C_010
  C_010 = intp_helper(pix, LUT, vec3(1.0, 0.0, 0.0));
  // C_110
  C_110 = intp_helper(pix, LUT, vec3(1.0, 0.0, 1.0));

  C_10 = mix(C_010, C_110, interp.b);

  // C_01
  // C_001
  C_001 = intp_helper(pix, LUT, vec3(0.0, 1.0, 0.0));
  // C_101
  C_101 = intp_helper(pix, LUT, vec3(0.0, 1.0, 1.0));

  C_01 = mix(C_001, C_101, interp.b);

  // C_11
  // C_011
  C_011 = intp_helper(pix, LUT, vec3(1.0, 1.0, 0.0));
  // C_111
  C_111 = intp_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

  C_11 = mix(C_011, C_111, interp.b);

  // C_0, C_1
  C_0 = mix(C_00, C_10, interp.r);
  C_1 = mix(C_01, C_11, interp.r);

  // C
  C = mix(C_0, C_1, interp.g);

  return C;
}

vec3 nn_interpolation(vec3 pix, sampler2D LUT) {
  // Represent the current image pixel color coordinates in the interval [0, 63]
  pix *= 63.0;
  // Store integer part of color coordinates in pix and fractional part in interp
  modf(pix, pix);

  vec2 coords;
  coords.x = clamp(pix.b, 0.0, 63.0)*stepB + (pix.g)*stepG;
  coords.y = 1.0-pix.r*stepR;

  return texture2D(LUT, coords).rgb;
}

vec3 prism_interpolation(vec3 pix, sampler2D LUT) {
  // Represent the current image pixel color coordinates in the interval [0, 63]
  pix *= 63.0;
  // Store integer part of color coordinates in pix and fractional part in interp
  vec3 interp = modf(pix, pix);

  float deltaB = interp.b;
  float deltaR = interp.r;
  float deltaG = interp.g;

  vec3 return_pix;

  // Common points bewteen two cases
  vec3 P_000, P_110, P_001, P_111;

  P_000 = intp_helper(pix, LUT, vec3(0.0));
  P_110 = intp_helper(pix, LUT, vec3(1.0, 0.0, 1.0));
  P_001 = intp_helper(pix, LUT, vec3(0.0, 1.0, 0.0));
  P_111 = intp_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

  if (deltaB > deltaR) {
    vec3 P_100, P_101;

    P_100 = intp_helper(pix, LUT, vec3(0.0, 0.0, 1.0));
    P_101 = intp_helper(pix, LUT, vec3(0.0, 1.0, 1.0));

    return_pix = P_000 + (P_100-P_000)*deltaB + (P_110-P_100)*deltaR \
      + (P_001-P_000)*deltaG + (P_101-P_001-P_100+P_000)*deltaB*deltaG \
      + (P_111-P_101-P_110+P_100)*deltaR*deltaG;
  } else {
    vec3 P_010, P_011;

    P_010 = intp_helper(pix, LUT, vec3(1.0, 0.0, 0.0));
    P_011 = intp_helper(pix, LUT, vec3(1.0, 1.0, 0.0));

    return_pix = P_000 + (P_110-P_010)*deltaB + (P_010-P_000)*deltaR \
      + (P_001-P_000)*deltaG + (P_111-P_011-P_110+P_010)*deltaB*deltaG \
      + (P_011-P_001-P_010+P_000)*deltaR*deltaG;
  }

  return return_pix;
}

vec3 tetra_interpolation(vec3 pix, sampler2D LUT) {
  // Represent the current image pixel color coordinates in the interval [0, 63]
  pix *= 63.0;
  // Store integer part of color coordinates in pix and fractional part in interp
  vec3 interp = modf(pix, pix);

  float deltaB = interp.b;
  float deltaR = interp.r;
  float deltaG = interp.g;

  vec3 return_pix;

  // Common points bewteen two cases
  vec3 P_000, P_110, P_001, P_111, P_100, P_101, P_010, P_011;

  if (deltaB > deltaR && deltaR > deltaG) {
    // P1
    P_000 = intp_helper(pix, LUT, vec3(0.0));
    P_100 = intp_helper(pix, LUT, vec3(0.0, 0.0, 1.0));
    P_110 = intp_helper(pix, LUT, vec3(1.0, 0.0, 1.0));
    P_111 = intp_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

    return_pix = P_000 + (P_100-P_000)*deltaB + (P_110-P_100)*deltaR \
      + (P_111-P_110)*deltaG;
  } else if (deltaB > deltaG && deltaG > deltaR) {
    // P2
    P_000 = intp_helper(pix, LUT, vec3(0.0));
    P_100 = intp_helper(pix, LUT, vec3(0.0, 0.0, 1.0));
    P_101 = intp_helper(pix, LUT, vec3(0.0, 1.0, 1.0));
    P_111 = intp_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

    return_pix = P_000 + (P_100-P_000)*deltaB + (P_111-P_101)*deltaR \
      + (P_101-P_100)*deltaG;
  } else if (deltaG > deltaB && deltaB > deltaR) {
    // P3
    P_000 = intp_helper(pix, LUT, vec3(0.0));
    P_001 = intp_helper(pix, LUT, vec3(0.0, 1.0, 0.0));
    P_101 = intp_helper(pix, LUT, vec3(0.0, 1.0, 1.0));
    P_111 = intp_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

    return_pix = P_000 + (P_101-P_001)*deltaB + (P_111-P_101)*deltaR \
      + (P_001-P_000)*deltaG;
  } else if (deltaR > deltaB && deltaB > deltaG) {
    // P4
    P_000 = intp_helper(pix, LUT, vec3(0.0));
    P_110 = intp_helper(pix, LUT, vec3(1.0, 0.0, 1.0));
    P_010 = intp_helper(pix, LUT, vec3(1.0, 0.0, 0.0));
    P_111 = intp_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

    return_pix = P_000 + (P_110-P_010)*deltaB + (P_010-P_000)*deltaR \
      + (P_111-P_110)*deltaG;
  } else if (deltaR > deltaG && deltaG > deltaB) {
    // P5
    P_000 = intp_helper(pix, LUT, vec3(0.0));
    P_011 = intp_helper(pix, LUT, vec3(1.0, 1.0, 0.0));
    P_010 = intp_helper(pix, LUT, vec3(1.0, 0.0, 0.0));
    P_111 = intp_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

    return_pix = P_000 + (P_111-P_011)*deltaB + (P_010-P_000)*deltaR \
      + (P_011-P_010)*deltaG;
  } else {
    // P6
    P_000 = intp_helper(pix, LUT, vec3(0.0));
    P_011 = intp_helper(pix, LUT, vec3(1.0, 1.0, 0.0));
    P_001 = intp_helper(pix, LUT, vec3(0.0, 1.0, 0.0));
    P_111 = intp_helper(pix, LUT, vec3(1.0, 1.0, 1.0));

    return_pix = P_000 + (P_111-P_011)*deltaB + (P_011-P_001)*deltaR \
      + (P_001-P_000)*deltaG;
  }

  return return_pix;
}

void main(void) {

  vec2 cellSize = 1.0 / resolution.xy;
  vec2 uv = vUv.xy;

  vec3 textureValue;
  vec3 pix = texture2D(u_image, uv).rgb;

  if (u_LUTChoice == 0) {
    if (u_interpolation == 0) {
      textureValue = nn_interpolation(pix, u_srcLUT);
    } else if (u_interpolation == 1) {
      textureValue = trilinear_interpolation(pix, u_srcLUT);
    } else if (u_interpolation == 2) {
      textureValue = prism_interpolation(pix, u_srcLUT);
    } else if (u_interpolation == 3) {
      textureValue = tetra_interpolation(pix, u_srcLUT);
    }
  } else {
    if (u_interpolation == 0) {
      textureValue = nn_interpolation(pix, u_dstLUT);
    } else if (u_interpolation == 1) {
      textureValue = trilinear_interpolation(pix, u_dstLUT);
    } else if (u_interpolation == 2) {
      textureValue = prism_interpolation(pix, u_dstLUT);
    } else if (u_interpolation == 3) {
      textureValue = tetra_interpolation(pix, u_dstLUT);
    }
  }

  gl_FragColor = vec4(textureValue, 1.0);
}

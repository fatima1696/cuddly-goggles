/**
 * The puddle surface. Every pixel gets an oil-film thickness (a drifting noise
 * field, in nanometres) and its colour is computed from real thin-film
 * interference: for each wavelength the two reflections add or cancel
 * depending on 4*pi*n*h/lambda, and the wavelengths are summed back into RGB.
 *
 * uPhase    loops the swirl exactly once per video (seamless loop)
 * uContour  0 = smooth rainbow, 1 = thickness map (banded, with contour lines)
 */
export const thinFilmVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const thinFilmFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uPhase;
  uniform float uContour;
  uniform float uStep;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return v;
  }

  vec3 spectral(float l) {
    vec3 c = vec3(0.0);
    if (l < 440.0) c = vec3(-(l - 440.0) / 60.0, 0.0, 1.0);
    else if (l < 490.0) c = vec3(0.0, (l - 440.0) / 50.0, 1.0);
    else if (l < 510.0) c = vec3(0.0, 1.0, -(l - 510.0) / 20.0);
    else if (l < 580.0) c = vec3((l - 510.0) / 70.0, 1.0, 0.0);
    else if (l < 645.0) c = vec3(1.0, -(l - 645.0) / 65.0, 0.0);
    else c = vec3(1.0, 0.0, 0.0);
    float f = 1.0;
    if (l < 420.0) f = 0.3 + 0.7 * (l - 380.0) / 40.0;
    else if (l > 700.0) f = 0.3 + 0.7 * (780.0 - l) / 80.0;
    return c * f;
  }

  vec3 filmColor(float h) {
    vec3 acc = vec3(0.0);
    vec3 w = vec3(0.0);
    for (int i = 0; i < 22; i++) {
      float l = 400.0 + float(i) * 14.0;
      vec3 s = spectral(l);
      float I = 0.5 - 0.5 * cos(12.566370614 * 1.5 * h / l);
      acc += s * I;
      w += s;
    }
    vec3 c = acc / w;
    c = 0.5 + (c - 0.5) * 2.3;
    return clamp(c, 0.0, 1.0);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);

    // Thickness field: domain-warped noise drifting on a closed loop in time.
    vec2 o1 = 0.55 * vec2(cos(uPhase), sin(uPhase));
    vec2 o2 = 0.55 * vec2(cos(uPhase + 2.1), sin(uPhase + 2.1));
    vec2 q = p * 1.7 + o1;
    vec2 w = vec2(
      fbm(q * 1.3 + vec2(3.1, 1.7) + o2),
      fbm(q * 1.3 + vec2(8.2, 4.4) - o2)
    );
    float n = fbm(q + 1.6 * (w - 0.5));
    n = smoothstep(0.18, 0.82, n);
    float h = 80.0 + 880.0 * n + 120.0 * (1.0 - r); // nanometres

    // Optional "map" mode: snap thickness to bands and draw contour lines.
    float g = h / uStep;
    float band = (floor(g) + 0.5) * uStep;
    float hq = mix(h, band, uContour);

    vec3 film = filmColor(hq);
    vec3 col = mix(vec3(0.02, 0.03, 0.07), film, 0.94);
    col *= mix(1.0, 0.35, smoothstep(0.82, 1.0, r));

    float fw = max(fwidth(g), 0.0001);
    float e = min(fract(g), 1.0 - fract(g)) / fw;
    float line = 1.0 - smoothstep(0.7, 1.7, e);
    float soft = 1.0 - smoothstep(1.7, 7.0, e);
    col = mix(col, vec3(0.75, 0.9, 1.0), line * uContour * 0.95);
    col += vec3(0.25, 0.45, 0.7) * soft * uContour * 0.18;

    gl_FragColor = vec4(col, 1.0);
  }
`;

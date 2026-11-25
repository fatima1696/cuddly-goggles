export const NAVY = "#04040a";
export const ICE = "#bfe6ff";
export const AMBER = "#f5b73a";
export const PALE_AMBER = "#ffe3a3";
export const WARM_WHITE = "#fff4d9";
export const OIL = "#b97a1c";
export const WATER_DEEP = "#0b2142";
export const WATER_LIGHT = "#1f5a94";

type RGB = [number, number, number];

/** Approximate RGB (0-1) for a visible wavelength in nm. */
const spectral = (l: number): RGB => {
  let r = 0;
  let g = 0;
  let b = 0;
  if (l < 440) {
    r = -(l - 440) / 60;
    b = 1;
  } else if (l < 490) {
    g = (l - 440) / 50;
    b = 1;
  } else if (l < 510) {
    g = 1;
    b = -(l - 510) / 20;
  } else if (l < 580) {
    r = (l - 510) / 70;
    g = 1;
  } else if (l < 645) {
    r = 1;
    g = -(l - 645) / 65;
  } else {
    r = 1;
  }
  let f = 1;
  if (l < 420) f = 0.3 + (0.7 * (l - 380)) / 40;
  else if (l > 700) f = 0.3 + (0.7 * (780 - l)) / 80;
  return [r * f, g * f, b * f];
};

/**
 * The colour a thin oil film shows when it is hNm nanometres thick.
 * Light bouncing off the top and bottom of the film meets again; for each
 * wavelength the two reflections add or cancel depending on 4*pi*n*h/lambda.
 * This is the same maths as the shader in three/thinFilmShader.ts.
 */
export const thinFilmRGB = (hNm: number, n = 1.5): RGB => {
  let r = 0;
  let g = 0;
  let b = 0;
  let wr = 0;
  let wg = 0;
  let wb = 0;
  for (let i = 0; i < 22; i++) {
    const l = 400 + i * 14;
    const [sr, sg, sb] = spectral(l);
    const intensity = 0.5 - 0.5 * Math.cos((4 * Math.PI * n * hNm) / l);
    r += sr * intensity;
    g += sg * intensity;
    b += sb * intensity;
    wr += sr;
    wg += sg;
    wb += sb;
  }
  const boost = (v: number) => Math.min(1, Math.max(0, 0.5 + (v - 0.5) * 2.3));
  return [boost(r / wr), boost(g / wg), boost(b / wb)];
};

export const thinFilmHex = (hNm: number): string => {
  const [r, g, b] = thinFilmRGB(hNm);
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
};

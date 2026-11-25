export type V3 = [number, number, number];
export type Pt = [number, number];

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const lerp3 = (a: V3, b: V3, t: number): V3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Quadratic Bezier between a and b, pulled toward control point c. */
export const bez3 = (a: V3, c: V3, b: V3, u: number): V3 => {
  const k0 = (1 - u) * (1 - u);
  const k1 = 2 * (1 - u) * u;
  const k2 = u * u;
  return [
    a[0] * k0 + c[0] * k1 + b[0] * k2,
    a[1] * k0 + c[1] * k1 + b[1] * k2,
    a[2] * k0 + c[2] * k1 + b[2] * k2,
  ];
};

/** 0..1 progress of p between a and b. */
export const seg = (p: number, a: number, b: number): number =>
  clamp01((p - a) / (b - a));

export const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number): number => t * t * t;

/** Smooth 0 -> 1 -> 0 pulse between a and b. */
export const bump = (p: number, a: number, b: number): number =>
  Math.sin(Math.PI * seg(p, a, b));

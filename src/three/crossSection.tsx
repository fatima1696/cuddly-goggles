import React from "react";
import {
  AMBER,
  ICE,
  OIL,
  WARM_WHITE,
  WATER_DEEP,
  WATER_LIGHT,
} from "../colors";
import type { Pt } from "../math";
import { Glow, GlowLine, Rect, partial, pointAt } from "./primitives";

// Side-on view of a thin oil film (a slab) floating on water.
// The surface of the water is y = 0, the film fills 0 < y < FILM_T.

export const FILM_T = 0.8;

// Light path, worked out with Snell's law (n_oil = 1.5), so the picture is
// physically consistent: one ray reflects off the top, one goes through,
// reflects off the bottom and leaves parallel to the first.
export const A: Pt = [-1.8, 2.6]; // where the sunlight comes from
export const P: Pt = [-0.4, 0.8]; // hits the top of the film
export const B: Pt = [1.0, 2.6]; // first reflection leaves
export const Q: Pt = [-0.0416, 0]; // reaches the bottom of the film
export const R: Pt = [0.317, 0.8]; // comes back up to the top
export const B2: Pt = [1.718, 2.6]; // second reflection leaves

export const INCIDENT: Pt[] = [A, P];
export const REFLECT_TOP: Pt[] = [P, B];
export const TRANSMIT: Pt[] = [P, Q];
export const INNER_UP: Pt[] = [Q, R];
export const EXIT: Pt[] = [R, B2];

const WATER_LINE: Pt[] = [
  [-9, 0],
  [9, 0],
];
const FILM_TOP: Pt[] = [
  [-9, FILM_T],
  [9, FILM_T],
];

/** Water below, a warm translucent slab of oil on top, glowing outlines. */
export const FilmStage: React.FC<{ pulse?: number }> = ({ pulse = 0 }) => (
  <>
    <Rect x0={-9} x1={9} y0={-8} y1={0} color={WATER_DEEP} opacity={0.9} order={0} />
    <Rect x0={-9} x1={9} y0={-1.2} y1={0} color={WATER_LIGHT} opacity={0.28} order={0.1} />
    <Rect x0={-9} x1={9} y0={0} y1={FILM_T} color={OIL} opacity={0.3 + 0.08 * pulse} order={1} />
    <GlowLine points={WATER_LINE} width={0.03} color={ICE} opacity={0.95} order={2} />
    <GlowLine points={FILM_TOP} width={0.03} color={ICE} opacity={0.95} order={2} />
  </>
);

/** A light ray drawn up to fraction t of its length, with a bright head. */
export const RayLine: React.FC<{
  path: Pt[];
  t: number;
  opacity?: number;
  width?: number;
  color?: string;
  head?: boolean;
}> = ({ path, t, opacity = 1, width = 0.05, color = AMBER, head = true }) => {
  if (t <= 0) return null;
  const pts = partial(path, t);
  const tip = pointAt(path, t);
  return (
    <>
      <GlowLine points={pts} width={width} color={color} opacity={opacity} order={4} />
      {head && t < 1 && (
        <Glow
          position={[tip[0], tip[1], 0.02]}
          size={0.5}
          color={WARM_WHITE}
          opacity={0.9 * opacity}
          order={5}
        />
      )}
    </>
  );
};

/** A burst of light where a ray bounces. strength is 0..1. */
export const Flare: React.FC<{ at: Pt; strength: number }> = ({ at, strength }) => {
  if (strength <= 0.01) return null;
  return (
    <>
      <Glow
        position={[at[0], at[1], 0.03]}
        size={0.5 + 1.5 * strength}
        color={AMBER}
        opacity={0.85 * strength}
        order={5}
      />
      <Glow
        position={[at[0], at[1], 0.04]}
        size={0.25 + 0.55 * strength}
        color={WARM_WHITE}
        opacity={strength}
        order={5.1}
      />
    </>
  );
};

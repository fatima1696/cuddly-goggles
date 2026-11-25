import React from "react";
import { AMBER, ICE, WATER_DEEP, WATER_LIGHT, thinFilmHex } from "../colors";
import { SceneTiming, useClock } from "../clock";
import { Pt, V3, easeInOut, easeOut, lerp, lerp3, seg } from "../math";
import {
  Fill,
  GlowLine,
  Rect,
  Ribbon,
  capsulePoints,
} from "../three/primitives";
import { Stage3D } from "../three/Stage3D";

// True scale: the film is 0.02 units thick, the hair 2.0 units wide (100x).
const FILM_T = 0.02;
const HAIR = capsulePoints(0.0, 2.0, -1.6, 3.8);
const HAIR_SHINE = capsulePoints(0.28, 0.58, -1.2, 3.3, 10);

// The film as a strip of slightly different colours (thickness wobbles).
const FILM_SEGMENTS: { pts: Pt[]; color: string }[] = Array.from({ length: 36 }, (_, i) => {
  const x0 = -4 + i * (8 / 36);
  const x1 = x0 + 8 / 36 + 0.002;
  const h = 330 + 260 * Math.sin(i * 0.55) + 90 * Math.sin(i * 1.7);
  return {
    pts: [
      [x0, FILM_T / 2],
      [x1, FILM_T / 2],
    ] as Pt[],
    color: thinFilmHex(h),
  };
});

export const HairScene: React.FC<SceneTiming> = (timing) => {
  const { p, sec } = useClock(timing);

  // Start tight on the hairline of oil, then pull back and slide right to
  // reveal how huge a hair is next to it.
  const e = easeInOut(p);
  const pos: V3 = lerp3([-0.9, 0.05, 2.6], [0.6, 1.1, 9.4], e);
  const look: V3 = lerp3([-0.9, 0.0, 0], [0.6, 1.0, 0], e);
  const roll = lerp(0.06, 0, easeOut(p));
  const pulse = 0.5 + 0.5 * Math.sin(sec * 5);
  const hairIn = easeOut(seg(p, 0.15, 0.7));

  return (
    <Stage3D pose={{ position: pos, lookAt: look, fov: 40, roll }}>
      <Rect x0={-9} x1={9} y0={-8} y1={0} color={WATER_DEEP} opacity={0.9} order={0} />
      <Rect x0={-9} x1={9} y0={-1.2} y1={0} color={WATER_LIGHT} opacity={0.28} order={0.1} />

      {/* the oil film, drawn at true scale */}
      {FILM_SEGMENTS.map((s, i) => (
        <Ribbon key={i} points={s.pts} width={FILM_T * 1.4} color={s.color} order={3} />
      ))}
      <GlowLine
        points={[
          [-9, FILM_T],
          [9, FILM_T],
        ]}
        width={0.02}
        color={AMBER}
        opacity={0.35 + 0.25 * pulse}
        order={2}
      />
      <GlowLine
        points={[
          [-9, 0],
          [9, 0],
        ]}
        width={0.02}
        color={ICE}
        opacity={0.7}
        order={2}
      />

      {/* the giant hair, 100x thicker */}
      <group position={[0, (1 - hairIn) * -1.2, 0]}>
        <Fill points={HAIR} color={ICE} opacity={0.13 * hairIn} order={1} />
        <Fill points={HAIR_SHINE} color="#ffffff" opacity={0.12 * hairIn} order={1.1} />
        <GlowLine points={HAIR} width={0.045} color={ICE} opacity={hairIn} closed order={4} />
      </group>
    </Stage3D>
  );
};

import React from "react";
import { AMBER } from "../colors";
import { SceneTiming, useClock } from "../clock";
import { V3, bump, easeInOut, lerp3, seg } from "../math";
import { Glow } from "../three/primitives";
import { Stage3D } from "../three/Stage3D";
import {
  EXIT,
  FilmStage,
  Flare,
  INCIDENT,
  INNER_UP,
  P,
  Q,
  R,
  RayLine,
  REFLECT_TOP,
  TRANSMIT,
} from "../three/crossSection";
import { pointAt } from "../three/primitives";

/**
 * Line 4: light hits the top of the film, some of it reflects.
 * Line 5: the rest goes through and reflects off the bottom.
 */
export const ReflectionScene: React.FC<SceneTiming & { part: "top" | "bottom" }> = ({
  part,
  ...timing
}) => {
  const { p, sec } = useClock(timing);
  const shimmer = 0.9 + 0.1 * Math.sin(sec * 9);

  if (part === "top") {
    const e = easeInOut(p);
    const pos = lerp3([-1.0, 2.4, 9.0], [-0.3, 1.3, 5.4], e);
    const look = lerp3([-0.6, 1.2, 0], [-0.15, 1.0, 0], e);
    pos[0] += 0.07 * Math.sin(p * Math.PI * 2);
    const roll = 0.05 * Math.sin(p * Math.PI * 1.5);

    return (
      <Stage3D pose={{ position: pos, lookAt: look, fov: 40, roll }}>
        <FilmStage />
        <RayLine path={INCIDENT} t={seg(p, 0, 0.3)} opacity={shimmer} />
        <Flare at={P} strength={bump(p, 0.28, 0.62)} />
        <RayLine path={REFLECT_TOP} t={seg(p, 0.3, 0.6)} opacity={shimmer} />
        <RayLine path={TRANSMIT} t={seg(p, 0.32, 0.62)} opacity={0.6 * shimmer} width={0.04} />
      </Stage3D>
    );
  }

  // part === "bottom"
  const e1 = easeInOut(seg(p, 0, 0.5));
  const e2 = easeInOut(seg(p, 0.5, 1));
  const pos = lerp3(lerp3([-0.3, 1.3, 5.4], [0.0, 0.6, 4.4], e1), [0.3, 1.6, 8.4], e2) as V3;
  const look = lerp3(lerp3([-0.15, 1.0, 0], [0.0, 0.45, 0], e1), [0.4, 1.4, 0], e2) as V3;
  const roll = -0.04 * Math.sin(p * Math.PI);

  const dotT = seg(p, 0, 0.3);
  const dot = pointAt(TRANSMIT, Math.max(dotT, 0.001));

  return (
    <Stage3D pose={{ position: pos, lookAt: look, fov: 40, roll }}>
      <FilmStage pulse={bump(p, 0.3, 0.6)} />
      {/* everything from the previous beat stays, dimmed */}
      <RayLine path={INCIDENT} t={1} opacity={0.45} head={false} />
      <RayLine path={REFLECT_TOP} t={1} opacity={0.45} head={false} />
      <RayLine path={TRANSMIT} t={1} opacity={0.85 * shimmer} head={false} />
      {dotT > 0 && dotT < 1 && (
        <Glow position={[dot[0], dot[1], 0.05]} size={0.7} color={AMBER} opacity={0.9} order={5} />
      )}
      <Flare at={Q} strength={bump(p, 0.28, 0.58)} />
      <RayLine path={INNER_UP} t={seg(p, 0.32, 0.56)} opacity={shimmer} />
      <Flare at={R} strength={0.6 * bump(p, 0.52, 0.75)} />
      <RayLine path={EXIT} t={seg(p, 0.54, 0.86)} opacity={shimmer} />
    </Stage3D>
  );
};

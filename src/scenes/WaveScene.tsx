import React from "react";
import { AMBER, ICE, PALE_AMBER, WARM_WHITE } from "../colors";
import { FPS } from "../config";
import { SceneTiming, useClock } from "../clock";
import { Pt, V3, bump, easeInOut, easeOut, lerp, lerp3, seg } from "../math";
import { Glow, GlowLine } from "../three/primitives";
import { Stage3D } from "../three/Stage3D";

export type WavePart = "overlap" | "add" | "cancel";

const AMP = 0.3;
const K = (2 * Math.PI) / 0.95; // wavelength 0.95 units
const SPEED = 2 * Math.PI * 0.7; // radians per second
const X0 = -2.6;
const X1 = 2.6;
const SAMPLES = 150;

const wave = (
  y0: number,
  phase: number,
  t: number,
  reveal = 1,
  scale = 1,
): Pt[] => {
  const pts: Pt[] = [];
  const last = Math.max(2, Math.round(SAMPLES * reveal));
  for (let i = 0; i < last; i++) {
    const x = X0 + ((X1 - X0) * i) / (SAMPLES - 1);
    pts.push([x, y0 + AMP * scale * Math.sin(K * x - t + phase)]);
  }
  return pts;
};

const sumWave = (t: number, delta: number, reveal = 1): Pt[] => {
  const pts: Pt[] = [];
  const last = Math.max(2, Math.round(SAMPLES * reveal));
  for (let i = 0; i < last; i++) {
    const x = X0 + ((X1 - X0) * i) / (SAMPLES - 1);
    pts.push([
      x,
      AMP * (Math.sin(K * x - t) + Math.sin(K * x - t + delta)),
    ]);
  }
  return pts;
};

/**
 * Lines 6-9: two reflected waves travel together, overlap, and then either
 * add up (in step) or cancel out (out of step).
 */
export const WaveScene: React.FC<SceneTiming & { part: WavePart }> = ({
  part,
  ...timing
}) => {
  const { p, g } = useClock(timing);
  const t = (g / FPS) * SPEED; // continuous across the three wave scenes

  let sep = 0; // vertical gap between the two waves
  let delta = 0; // how far out of step wave B is (radians)
  let reveal = 1; // how much of the wave is drawn
  let sumOpacity = 1;
  let ghost = 0.4;
  let pos: V3;
  let roll = 0;
  let glowSize = 0;
  let glowOpacity = 0;

  if (part === "overlap") {
    reveal = easeOut(seg(p, 0, 0.3));
    sep = 0.62 * (1 - easeInOut(seg(p, 0.45, 0.95)));
    delta = 1.3;
    sumOpacity = 0.55 * seg(p, 0.6, 0.9);
    ghost = 1;
    pos = lerp3([0, 0, 7.4], [0, 0, 6.3], easeInOut(p));
    roll = lerp(-0.06, 0.06, p);
  } else if (part === "add") {
    delta = lerp(1.3, 0, easeInOut(seg(p, 0, 0.4)));
    sumOpacity = 1;
    ghost = 0.4;
    pos = lerp3([0, 0, 6.3], [0, 0, 4.6], easeInOut(p));
    roll = lerp(0.06, -0.03, easeInOut(p));
    glowSize = 2.2 + 3.4 * bump(p, 0.3, 1) + 0.6 * easeInOut(seg(p, 0, 0.4));
    glowOpacity = 0.25 + 0.55 * easeInOut(seg(p, 0.15, 0.5));
  } else {
    delta = lerp(0, Math.PI, easeInOut(seg(p, 0, 0.45)));
    sumOpacity = 1 - 0.55 * easeInOut(seg(p, 0.25, 0.6));
    ghost = 0.9;
    // whip in, then a slow pull-back
    pos = lerp3([0, 0, 4.6], [0, 0, 8.8], easeOut(p));
    roll = lerp(-0.28, 0, easeOut(seg(p, 0, 0.7)));
    glowSize = 3.5 * (1 - easeInOut(seg(p, 0, 0.5)));
    glowOpacity = 0.6 * (1 - easeInOut(seg(p, 0, 0.5)));
  }

  const amplitudeLeft = Math.abs(Math.cos(delta / 2)); // 1 = full, 0 = flat
  const sumColor = part === "cancel" && amplitudeLeft < 0.3 ? ICE : WARM_WHITE;
  const sumWidth = part === "add" ? 0.13 : 0.085;

  return (
    <Stage3D pose={{ position: pos, lookAt: [0, 0, 0], fov: 40, roll }}>
      {glowOpacity > 0.01 && (
        <Glow position={[0, 0, -0.1]} size={[glowSize * 1.6, glowSize]} color={AMBER} opacity={glowOpacity} order={0.5} />
      )}

      <GlowLine points={wave(sep, 0, t, reveal)} width={0.05} color={AMBER} opacity={ghost} order={3} />
      <GlowLine points={wave(-sep, delta, t, reveal)} width={0.05} color={PALE_AMBER} opacity={ghost} order={3.2} />

      {sumOpacity > 0.01 && (
        <GlowLine
          points={sumWave(t, delta, reveal)}
          width={sumWidth}
          color={sumColor}
          opacity={sumOpacity}
          halo={part === "cancel" ? 0.5 : 1.4}
          order={4}
        />
      )}
    </Stage3D>
  );
};

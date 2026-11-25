import React, { useMemo } from "react";
import { AMBER, ICE, WARM_WHITE } from "../colors";
import { SceneTiming, useClock } from "../clock";
import {
  V3,
  Pt,
  bez3,
  easeIn,
  easeInOut,
  easeOut,
  lerp,
  lerp3,
  seg,
} from "../math";
import { Glow, GlowLine, Ribbon, ellipsePoints } from "../three/primitives";
import { Stage3D } from "../three/Stage3D";
import { thinFilmFragment, thinFilmVertex } from "../three/thinFilmShader";

export type PuddleMode = "open" | "pullback" | "map";

// Puddle half-sizes (world units). It lies flat on the ground, y = 0.
const HALF_W = 1.35;
const HALF_D = 1.9;

// Camera poses. WIDE is both the first and the last frame of the video, which
// is what makes the loop seamless.
type Pose = { pos: V3; look: V3 };
const WIDE: Pose = { pos: [0, 6.6, 7.0], look: [0, 0, 0.9] };
const MID: Pose = { pos: [0, 4.6, 4.9], look: [0, 0, 0.5] };
const DIVE: Pose = { pos: [0.25, 0.55, 1.1], look: [0.35, 0, -0.5] };
const LOW: Pose = { pos: [-0.3, 0.7, 1.5], look: [0, 0, -0.2] };
const HIGH: Pose = { pos: [0, 7.4, 6.0], look: [0, 0, 0.6] };
const TOP: Pose = { pos: [0, 8.6, 3.4], look: [0, 0, 0.3] };
const SWING: V3 = [0, 11.5, 2.0]; // control point that lifts the map-scene arc

const RIPPLES: Pt[] = [
  [-0.5, 0.8],
  [0.6, -0.4],
  [0.1, 1.2],
  [-0.8, -0.9],
  [0.7, 0.9],
  [-0.2, -0.3],
];

const EDGE = ellipsePoints(HALF_W, HALF_D, 140);
const EDGE_OUTER = ellipsePoints(HALF_W * 1.16, HALF_D * 1.12, 140);

const circle = (cx: number, cy: number, r: number, steps = 48): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
};

const PuddleSurface: React.FC<{ phase: number; contour: number }> = ({
  phase,
  contour,
}) => {
  const uniforms = useMemo(
    () => ({
      uPhase: { value: 0 },
      uContour: { value: 0 },
      uStep: { value: 95 },
    }),
    [],
  );
  return (
    <mesh scale={[HALF_W, HALF_D, 1]} renderOrder={1}>
      <circleGeometry args={[1, 128]} />
      <shaderMaterial
        uniforms={uniforms}
        uniforms-uPhase-value={phase}
        uniforms-uContour-value={contour}
        vertexShader={thinFilmVertex}
        fragmentShader={thinFilmFragment}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
};

export const PuddleScene: React.FC<SceneTiming & { mode: PuddleMode }> = ({
  mode,
  ...timing
}) => {
  const { p, loop } = useClock(timing);

  // --- camera -------------------------------------------------------------
  let pos: V3;
  let look: V3;
  let roll = 0;
  if (mode === "open") {
    const e1 = easeInOut(seg(p, 0, 0.55));
    const e2 = easeIn(seg(p, 0.55, 1));
    pos = lerp3(lerp3(WIDE.pos, MID.pos, e1), DIVE.pos, e2);
    look = lerp3(lerp3(WIDE.look, MID.look, e1), DIVE.look, e2);
    pos = [pos[0] + Math.sin(loop * Math.PI * 2) * 0.35 * (1 - e2), pos[1], pos[2]];
    roll = -0.1 * e2;
  } else if (mode === "pullback") {
    const e = easeOut(p);
    pos = lerp3(LOW.pos, HIGH.pos, e);
    look = lerp3(LOW.look, HIGH.look, e);
    roll = lerp(-0.1, 0, e);
  } else {
    const u = easeInOut(p);
    pos = bez3(HIGH.pos, SWING, WIDE.pos, u);
    look = lerp3(lerp3(HIGH.look, TOP.look, easeInOut(seg(p, 0, 0.5))), WIDE.look, easeInOut(seg(p, 0.5, 1)));
  }

  // --- puddle state -------------------------------------------------------
  const phase = loop * Math.PI * 2;
  const contour =
    mode === "map"
      ? easeInOut(seg(p, 0, 0.3)) * (1 - easeInOut(seg(p, 0.72, 1)))
      : 0;

  // Rain ripples: period = 1/8 of the video, so they loop perfectly too.
  const ripples = RIPPLES.map(([cx, cy], i) => {
    const ph = (loop * 8 + i / RIPPLES.length) % 1;
    const radius = 0.08 + 0.55 * ph;
    const alpha = Math.pow(1 - ph, 1.4) * 0.75;
    return { cx, cy, radius, alpha };
  });

  // Amber scanner that sweeps over the puddle in map mode.
  const s = mode === "map" ? seg(p, 0.1, 0.78) : 0;
  const scanY = lerp(-HALF_D * 1.05, HALF_D * 1.05, easeInOut(s));
  const scanAlpha = s > 0 && s < 1 ? Math.pow(Math.sin(Math.PI * s), 0.5) : 0;
  const chord =
    Math.abs(scanY) < HALF_D
      ? HALF_W * Math.sqrt(1 - (scanY / HALF_D) * (scanY / HALF_D))
      : 0;

  return (
    <Stage3D pose={{ position: pos, lookAt: look, fov: 38, roll }}>
      {/* the puddle lies flat: local XY becomes the ground plane */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Glow
          position={[0, 0, -0.02]}
          size={[HALF_W * 4.4, HALF_D * 3.6]}
          color="#3a6fb0"
          opacity={0.32}
          order={0}
        />
        <PuddleSurface phase={phase} contour={contour} />
        <GlowLine points={EDGE} width={0.03} color={ICE} opacity={0.9} closed order={2} z={0.01} />
        <Ribbon points={EDGE_OUTER} width={0.016} color={ICE} opacity={0.22} closed order={2} z={0.01} />

        {ripples.map((r, i) =>
          r.alpha > 0.02 ? (
            <React.Fragment key={i}>
              <GlowLine
                points={circle(r.cx, r.cy, r.radius)}
                width={0.018}
                color={ICE}
                opacity={r.alpha}
                halo={0.6}
                closed
                order={3}
                z={0.012}
              />
              <Ribbon
                points={circle(r.cx, r.cy, r.radius * 0.62)}
                width={0.012}
                color={ICE}
                opacity={r.alpha * 0.5}
                closed
                order={3}
                z={0.012}
              />
            </React.Fragment>
          ) : null,
        )}

        {scanAlpha > 0.01 && chord > 0.01 && (
          <>
            <Glow
              position={[0, scanY, 0.03]}
              size={[chord * 2.6, 0.9]}
              color={AMBER}
              opacity={0.55 * scanAlpha}
              order={5}
            />
            <GlowLine
              points={[
                [-chord, scanY],
                [chord, scanY],
              ]}
              width={0.035}
              color={AMBER}
              opacity={scanAlpha}
              order={4}
              z={0.03}
            />
            <Glow
              position={[0, scanY, 0.04]}
              size={[chord * 1.2, 0.25]}
              color={WARM_WHITE}
              opacity={0.6 * scanAlpha}
              order={5.1}
            />
          </>
        )}
      </group>
    </Stage3D>
  );
};

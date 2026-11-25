import React, { useMemo } from "react";
import * as THREE from "three";
import { AMBER, ICE, OIL, WATER_DEEP, WATER_LIGHT, thinFilmHex } from "../colors";
import { SceneTiming, useClock } from "../clock";
import { Pt, V3, easeInOut, easeOut, lerp, seg } from "../math";
import { Glow, GlowLine, M, Rect, Ribbon } from "../three/primitives";
import { Stage3D } from "../three/Stage3D";

// An oil film that is thick on the left and thin on the right, side-on.
const X_LEFT = -2.4;
const X_RIGHT = 2.4;
const T_LEFT = 1.3;
const T_RIGHT = 0.2;
const NM_PER_UNIT = 600;
const DEPTH = 1.4;

const topAt = (x: number): number =>
  lerp(T_LEFT, T_RIGHT, (x - X_LEFT) / (X_RIGHT - X_LEFT));
const nmAt = (x: number): number => topAt(x) * NM_PER_UNIT;

const BEAMS = 9;
const STRIP = 40;

const Prism: React.FC = () => {
  const geo = useMemo(() => {
    const shape = new THREE.Shape([
      new THREE.Vector2(X_LEFT, 0),
      new THREE.Vector2(X_RIGHT, 0),
      new THREE.Vector2(X_RIGHT, T_RIGHT),
      new THREE.Vector2(X_LEFT, T_LEFT),
    ]);
    const g = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false });
    g.translate(0, 0, -DEPTH / 2);
    return g;
  }, []);
  return (
    <mesh geometry={geo} renderOrder={1}>
      <M color={OIL} opacity={0.26} />
    </mesh>
  );
};

/** Line 10: the film's thickness decides which colours survive. */
export const WedgeScene: React.FC<SceneTiming> = (timing) => {
  const { p, sec } = useClock(timing);

  // Slow orbit around the film, easing in and out.
  const az = lerp(-0.45, 0.45, easeInOut(p));
  const dist = lerp(7.2, 6.0, easeInOut(p));
  const target: V3 = [0, 0.9, 0];
  const pos: V3 = [
    target[0] + dist * Math.sin(az),
    target[1] + 0.5 + 0.5 * p,
    target[2] + dist * Math.cos(az),
  ];

  const front = DEPTH / 2;
  const top: Pt[] = [
    [X_LEFT, T_LEFT],
    [X_RIGHT, T_RIGHT],
  ];
  const bottom: Pt[] = [
    [X_LEFT, 0],
    [X_RIGHT, 0],
  ];

  const sweep = easeOut(seg(p, 0, 0.55));

  return (
    <Stage3D pose={{ position: pos, lookAt: target, fov: 40, roll: 0.03 * Math.sin(p * Math.PI) }}>
      <Rect x0={-9} x1={9} y0={-8} y1={0} color={WATER_DEEP} opacity={0.9} order={0} />
      <Rect x0={-9} x1={9} y0={-1.2} y1={0} color={WATER_LIGHT} opacity={0.28} order={0.1} />
      <Prism />

      <GlowLine points={top} width={0.03} color={ICE} opacity={0.95} order={2} z={front} />
      <GlowLine points={bottom} width={0.03} color={ICE} opacity={0.95} order={2} z={front} />
      <GlowLine points={top} width={0.02} color={ICE} opacity={0.35} halo={0} order={2} z={-front} />

      {/* the top of the film glows a different colour wherever it is a different thickness */}
      {Array.from({ length: STRIP }, (_, i) => {
        const xa = X_LEFT + ((X_RIGHT - X_LEFT) * i) / STRIP;
        const xb = X_LEFT + ((X_RIGHT - X_LEFT) * (i + 1)) / STRIP + 0.01;
        if (i / STRIP > sweep) return null;
        const xm = (xa + xb) / 2;
        return (
          <Ribbon
            key={i}
            points={[
              [xa, topAt(xa) + 0.04],
              [xb, topAt(xb) + 0.04],
            ]}
            width={0.09}
            color={thinFilmHex(nmAt(xm))}
            order={3}
            z={front + 0.01}
          />
        );
      })}

      {/* reflected light leaving each spot, in the colour that survives there */}
      {Array.from({ length: BEAMS }, (_, i) => {
        const x = X_LEFT + 0.3 + ((X_RIGHT - X_LEFT - 0.6) * i) / (BEAMS - 1);
        const start = 0.1 + i * 0.055;
        const grow = easeOut(seg(p, start, start + 0.22));
        if (grow <= 0) return null;
        const y = topAt(x) + 0.04;
        const length = 1.7 * grow;
        const color = thinFilmHex(nmAt(x));
        const flicker = 0.85 + 0.15 * Math.sin(sec * 7 + i);
        return (
          <React.Fragment key={i}>
            <GlowLine
              points={[
                [x, y],
                [x + 0.42 * grow, y + length],
              ]}
              width={0.07}
              color={color}
              opacity={flicker}
              order={4}
            />
            <Glow
              position={[x + 0.42 * grow, y + length, 0.05]}
              size={0.55}
              color={color}
              opacity={0.8 * grow}
              order={5}
            />
          </React.Fragment>
        );
      })}

      <Glow position={[0, 0.5, -0.3]} size={[6, 3]} color={AMBER} opacity={0.12} order={0.5} />
    </Stage3D>
  );
};

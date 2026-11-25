import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { ICE } from "../colors";
import type { Pt } from "../math";

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Flat ribbon (a "thick line") following a polyline in the XY plane. */
export const buildRibbon = (
  pts: Pt[],
  width: number,
  closed = false,
): THREE.BufferGeometry => {
  const geo = new THREE.BufferGeometry();
  const n = pts.length;
  if (n < 2) {
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(9), 3),
    );
    return geo;
  }
  const pos = new Float32Array(n * 2 * 3);
  for (let i = 0; i < n; i++) {
    const prev = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)];
    const next = pts[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
    let tx = next[0] - prev[0];
    let ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const nx = (-ty * width) / 2;
    const ny = (tx * width) / 2;
    pos[i * 6] = pts[i][0] + nx;
    pos[i * 6 + 1] = pts[i][1] + ny;
    pos[i * 6 + 2] = 0;
    pos[i * 6 + 3] = pts[i][0] - nx;
    pos[i * 6 + 4] = pts[i][1] - ny;
    pos[i * 6 + 5] = 0;
  }
  const idx: number[] = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    const b = ((i + 1) % n) * 2;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geo;
};

const lengthOf = (pts: Pt[]): number => {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return total;
};

/** The first fraction t (0..1) of a polyline, by length. */
export const partial = (pts: Pt[], t: number): Pt[] => {
  if (t <= 0 || pts.length < 2) return [];
  if (t >= 1) return pts;
  const target = lengthOf(pts) * t;
  const out: Pt[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= target) {
      const k = seg === 0 ? 0 : (target - acc) / seg;
      out.push([
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k,
      ]);
      return out;
    }
    acc += seg;
    out.push(pts[i]);
  }
  return out;
};

/** The point a fraction t along a polyline. */
export const pointAt = (pts: Pt[], t: number): Pt => {
  const p = partial(pts, Math.max(0.0001, t));
  return p[p.length - 1] ?? pts[0];
};

/** A capsule (rounded rectangle with fully round ends), as a closed outline. */
export const capsulePoints = (
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  steps = 28,
): Pt[] => {
  const r = (x1 - x0) / 2;
  const cx = (x0 + x1) / 2;
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI;
    pts.push([cx + r * Math.cos(a), y1 - r + r * Math.sin(a)]);
  }
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (i / steps) * Math.PI;
    pts.push([cx + r * Math.cos(a), y0 + r + r * Math.sin(a)]);
  }
  return pts;
};

export const ellipsePoints = (a: number, b: number, steps = 120): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push([a * Math.cos(t), b * Math.sin(t)]);
  }
  return pts;
};

const useGeometry = <T extends THREE.BufferGeometry>(
  factory: () => T,
  deps: React.DependencyList,
): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(factory, deps);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
};

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

type MProps = {
  color?: string;
  opacity?: number;
  additive?: boolean;
  map?: THREE.Texture;
};

/** Flat, unlit, no depth test: draw order is controlled with renderOrder. */
export const M: React.FC<MProps> = ({
  color = "#ffffff",
  opacity = 1,
  additive = false,
  map,
}) => (
  <meshBasicMaterial
    color={color}
    opacity={opacity}
    transparent
    depthTest={false}
    depthWrite={false}
    toneMapped={false}
    side={THREE.DoubleSide}
    blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
    map={map}
  />
);

let glowTexture: THREE.CanvasTexture | null = null;
const getGlowTexture = (): THREE.CanvasTexture => {
  if (glowTexture) return glowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(0.6, "rgba(255,255,255,0.1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
};

// ---------------------------------------------------------------------------
// Drawing components (all live in the XY plane unless rotated by a parent)
// ---------------------------------------------------------------------------

export const Rect: React.FC<{
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  color: string;
  opacity?: number;
  order?: number;
  additive?: boolean;
}> = ({ x0, x1, y0, y1, color, opacity = 1, order = 0, additive = false }) => (
  <mesh
    position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]}
    scale={[x1 - x0, y1 - y0, 1]}
    renderOrder={order}
  >
    <planeGeometry args={[1, 1]} />
    <M color={color} opacity={opacity} additive={additive} />
  </mesh>
);

export const Fill: React.FC<{
  points: Pt[];
  color: string;
  opacity?: number;
  order?: number;
  z?: number;
}> = ({ points, color, opacity = 1, order = 1, z = 0 }) => {
  const geo = useGeometry(
    () =>
      new THREE.ShapeGeometry(
        new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y))),
      ),
    [points],
  );
  return (
    <mesh geometry={geo} position={[0, 0, z]} renderOrder={order}>
      <M color={color} opacity={opacity} />
    </mesh>
  );
};

/** A single flat ribbon, no glow. */
export const Ribbon: React.FC<{
  points: Pt[];
  width?: number;
  color?: string;
  opacity?: number;
  closed?: boolean;
  order?: number;
  z?: number;
  additive?: boolean;
}> = ({
  points,
  width = 0.03,
  color = ICE,
  opacity = 1,
  closed = false,
  order = 3,
  z = 0,
  additive = false,
}) => {
  const geo = useGeometry(
    () => buildRibbon(points, width, closed),
    [points, width, closed],
  );
  return (
    <mesh geometry={geo} position={[0, 0, z]} renderOrder={order}>
      <M color={color} opacity={opacity} additive={additive} />
    </mesh>
  );
};

/** A luminous line: crisp core plus two soft halos (the "bloom" of the style). */
export const GlowLine: React.FC<{
  points: Pt[];
  width?: number;
  color?: string;
  opacity?: number;
  halo?: number;
  closed?: boolean;
  order?: number;
  z?: number;
}> = ({
  points,
  width = 0.03,
  color = ICE,
  opacity = 1,
  halo = 1,
  closed = false,
  order = 3,
  z = 0,
}) => {
  if (points.length < 2 || opacity <= 0) return null;
  return (
    <>
      {halo > 0 && (
        <Ribbon
          points={points}
          width={width * 8}
          color={color}
          opacity={0.07 * opacity * halo}
          closed={closed}
          order={order}
          z={z}
          additive
        />
      )}
      {halo > 0 && (
        <Ribbon
          points={points}
          width={width * 3.2}
          color={color}
          opacity={0.2 * opacity * halo}
          closed={closed}
          order={order + 0.01}
          z={z}
          additive
        />
      )}
      <Ribbon
        points={points}
        width={width}
        color={color}
        opacity={opacity}
        closed={closed}
        order={order + 0.02}
        z={z}
      />
    </>
  );
};

/** Soft additive light blob. */
export const Glow: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  size?: number | [number, number];
  color?: string;
  opacity?: number;
  order?: number;
}> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = 1,
  color = "#ffffff",
  opacity = 1,
  order = 5,
}) => {
  const tex = useMemo(getGlowTexture, []);
  if (opacity <= 0) return null;
  const sx = Array.isArray(size) ? size[0] : size;
  const sy = Array.isArray(size) ? size[1] : size;
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={[sx, sy, 1]}
      renderOrder={order}
    >
      <planeGeometry args={[1, 1]} />
      <M color={color} opacity={opacity} additive map={tex} />
    </mesh>
  );
};

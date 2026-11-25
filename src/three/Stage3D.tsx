import React, { useLayoutEffect, useRef } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import type { V3 } from "../math";

export type CameraPose = {
  position: V3;
  lookAt: V3;
  fov?: number;
  /** Roll in radians (positive tilts the horizon clockwise on screen). */
  roll?: number;
};

const CameraRig: React.FC<CameraPose & { aspect: number }> = ({
  position,
  lookAt,
  fov = 40,
  roll = 0,
  aspect,
}) => {
  const ref = useRef<THREE.PerspectiveCamera>(null);
  useLayoutEffect(() => {
    const cam = ref.current;
    if (!cam) return;
    cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    cam.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  });
  return (
    <perspectiveCamera
      ref={ref}
      makeDefault
      position={position}
      fov={fov}
      aspect={aspect}
      near={0.05}
      far={200}
    />
  );
};

/** One Three.js canvas with a camera that is driven entirely by props. */
export const Stage3D: React.FC<{
  pose: CameraPose;
  children: React.ReactNode;
}> = ({ pose, children }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      flat
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <CameraRig {...pose} aspect={width / height} />
      {children}
    </ThreeCanvas>
  );
};

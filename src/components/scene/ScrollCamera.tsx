import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

type ScrollCameraProps = {
  progress: { current: number };
  enabled?: boolean;
  start?: [number, number, number];
  end?: [number, number, number];
  lookAtStart?: [number, number, number];
  lookAtEnd?: [number, number, number];
};

function ScrollCamera({
  progress,
  enabled = true,
  start = [0, 2.8, 20],
  end = [0, 3.4, -500],
  lookAtStart = [0, 2.6, -180],
  lookAtEnd = [0, 3.2, -560],
}: ScrollCameraProps) {
  const { camera } = useThree();

  const startVec = useMemo(
    () => new THREE.Vector3(start[0], start[1], start[2]),
    [start],
  );
  const endVec = useMemo(
    () => new THREE.Vector3(end[0], end[1], end[2]),
    [end],
  );
  const lookAtStartVec = useMemo(
    () => new THREE.Vector3(lookAtStart[0], lookAtStart[1], lookAtStart[2]),
    [lookAtStart],
  );
  const lookAtEndVec = useMemo(
    () => new THREE.Vector3(lookAtEnd[0], lookAtEnd[1], lookAtEnd[2]),
    [lookAtEnd],
  );
  const tempLookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!enabled) return;
    const t = THREE.MathUtils.clamp(progress.current, 0, 1);
    camera.position.lerpVectors(startVec, endVec, t);
    tempLookAt.lerpVectors(lookAtStartVec, lookAtEndVec, t);
    camera.lookAt(tempLookAt);
  });

  return null;
}

export default ScrollCamera;

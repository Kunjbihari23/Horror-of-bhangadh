import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { ASSETS } from "../../utils/assets";

type WallProps = {
  position: [number, number, number];
  yRotationOffset?: number;
  WALL_SCALE?: [number, number, number];
  BASE_WALL_ROTATION?: [number, number, number];
};

function Wall({
  position,
  yRotationOffset = 0,
  WALL_SCALE = [30, 30, 30],
  BASE_WALL_ROTATION = [-1.6, 0.0, -4.72],
}: WallProps) {
  const { scene } = useGLTF(ASSETS.Wall);
  const clone = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.renderOrder = 3;
        if (child.material instanceof THREE.Material) {
          child.material.polygonOffset = true;
          child.material.polygonOffsetFactor = -0.5;
          child.material.polygonOffsetUnits = -1;
        } else if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.polygonOffset = true;
            mat.polygonOffsetFactor = -0.5;
            mat.polygonOffsetUnits = -1;
          });
        }
      }
    });
    return cloned;
  }, [scene]);

  const normalizedOffset = useMemo<[number, number, number]>(() => {
    const box = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return [-center.x, -box.min.y, -center.z];
  }, [clone]);

  const rotation: [number, number, number] = [
    BASE_WALL_ROTATION[0],
    BASE_WALL_ROTATION[1] + yRotationOffset,
    BASE_WALL_ROTATION[2],
  ];

  return (
    <group position={position} rotation={rotation} scale={WALL_SCALE}>
      <primitive object={clone} position={normalizedOffset} />
    </group>
  );
}

export default Wall;
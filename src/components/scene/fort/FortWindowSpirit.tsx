import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { ASSETS } from "../../../utils/assets";
import { FORT_WINDOW_SPIRIT_TRANSFORM } from "./fortLayout";

function FortWindowSpirit() {
  const { scene } = useGLTF(ASSETS.mohini);

  const spirit = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse(
      (child: { castShadow: boolean; receiveShadow: boolean }) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      },
    );

    return cloned;
  }, [scene]);

  const groundOffset = useMemo<[number, number, number]>(() => {
    const box = new THREE.Box3().setFromObject(spirit);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return [-center.x, -box.min.y, -center.z];
  }, [spirit]);

  return (
    <group
      position={FORT_WINDOW_SPIRIT_TRANSFORM.position}
      rotation={FORT_WINDOW_SPIRIT_TRANSFORM.rotation}
      scale={FORT_WINDOW_SPIRIT_TRANSFORM.scale}
    >
      <primitive object={spirit} position={groundOffset} />
    </group>
  );
}

useGLTF.preload(ASSETS.mohini);

export default FortWindowSpirit;

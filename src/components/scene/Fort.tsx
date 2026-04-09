import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ASSETS } from "../../utils/assets";
import { FORT_TRANSFORM, FORT_WINDOW_GLOW } from "./fort/fortLayout";
import FortWindowSpirit from "./fort/FortWindowSpirit";
import FortWindowSpiritsMohini from "./fort/FortWindowSpiritMohini";
import BhangadhBoard from "./BhangadhBoard";

type FortProps = {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

const Fort = ({
  scale = FORT_TRANSFORM.scale,
  position = FORT_TRANSFORM.position,
  rotation = FORT_TRANSFORM.rotation,
}: FortProps) => {
  const { scene } = useGLTF(ASSETS.fort);
  const rectLightRef = useRef<THREE.RectAreaLight>(null);
  const [x, y, z] = position;
  const fortKeyLight = useMemo<[number, number, number]>(
    () => [x + 6, y + 38, z + 30],
    [x, y, z],
  );

  useEffect(() => {
    if (rectLightRef.current) {
      rectLightRef.current.lookAt(new THREE.Vector3(x, y + 12, z));
    }
  }, [x, y, z]);

  return (
    <>
     <BhangadhBoard />
      <rectAreaLight
        ref={rectLightRef}
        position={fortKeyLight}
        width={70}
        height={45}
        intensity={1.5}
        color="#c7dcff"
      />
      <primitive
        object={scene}
        scale={scale}
        position={position}
        rotation={rotation}
      />
      <group scale={scale} position={position} rotation={rotation}>
        <FortWindowSpirit />
        <FortWindowSpiritsMohini />
        <pointLight
          position={FORT_WINDOW_GLOW.position}
          color={FORT_WINDOW_GLOW.color}
          intensity={FORT_WINDOW_GLOW.intensity}
          distance={FORT_WINDOW_GLOW.distance}
        />
      </group>
    </>
  );
};

useGLTF.preload(ASSETS.fort);

export default Fort;

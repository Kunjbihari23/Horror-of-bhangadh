/* eslint-disable react-hooks/immutability */
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { ASSETS } from "../../utils/assets";

type FloorProps = {
  size?: [number, number];
  position?: [number, number, number];
};

const Floor = ({ size = [50, 950], position = [0, 0, -240] }: FloorProps) => {
  // Load all textures
  const [alphaMap, colorMap, armMap, normalMap, displacementMap] = useLoader(
    THREE.TextureLoader,
    [
      ASSETS.floor.alpha,
      ASSETS.floor.diff,
      ASSETS.floor.arm,
      ASSETS.floor.normal,
      ASSETS.floor.displacement,
    ],
  );

  // Configure textures
  useMemo(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;

    const textures = [colorMap, armMap, normalMap, displacementMap];

    const repeatX = size[0] / 10;
    const repeatY = size[1] / 10;

    textures.forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
    });
  }, [colorMap, armMap, normalMap, displacementMap, size]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={[size[0], size[1], 100, 100]} />

      <meshStandardMaterial
        transparent
        alphaMap={alphaMap}
        map={colorMap}
        aoMap={armMap}
        roughnessMap={armMap}
        metalnessMap={armMap}
        normalMap={normalMap}
        displacementMap={displacementMap}
        displacementScale={0.3}
        displacementBias={-0.2}
      />
    </mesh>
  );
};

export default Floor;

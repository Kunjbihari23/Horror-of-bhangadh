/* eslint-disable react-hooks/immutability */
import { useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { ASSETS } from "../../utils/assets";

type PathProps = {
  position: [number, number, number];
  size: [number, number];
  color?: string;
  roughness?: number;
};

function Path({
  position,
  size,
  color = "#ffffff",
  roughness = 0.85,
}: PathProps) {
  const { gl } = useThree();
  const colorMap = useLoader(
    THREE.TextureLoader,
    ASSETS.path.color,
  );
  const displacementMap = useLoader(
    THREE.TextureLoader,
    ASSETS.path.displacement,
  );
  const normalMap = useLoader(
    EXRLoader,
    ASSETS.path.normal,
  );
  const roughnessMap = useLoader(
    EXRLoader,
    ASSETS.path.roughness,
  );

  const repeat = useMemo<[number, number]>(() => {
    const repeatX = Math.max(1, size[0] / 4);
    const repeatY = Math.max(1, size[1] / 12);
    return [repeatX, repeatY];
  }, [size]);

  const segments = useMemo<[number, number]>(() => {
    const segX = Math.min(200, Math.max(20, Math.floor(size[0] * 3)));
    const segY = Math.min(400, Math.max(80, Math.floor(size[1] / 2)));
    return [segX, segY];
  }, [size]);

  useEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const maps = [colorMap, displacementMap, normalMap, roughnessMap];

    maps.forEach((map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(repeat[0], repeat[1]);
      map.anisotropy = anisotropy;
      map.needsUpdate = true;
    });

    colorMap.colorSpace = THREE.SRGBColorSpace;
    displacementMap.colorSpace = THREE.NoColorSpace;
    normalMap.colorSpace = THREE.NoColorSpace;
    roughnessMap.colorSpace = THREE.NoColorSpace;
  }, [colorMap, displacementMap, normalMap, roughnessMap, repeat, gl]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      receiveShadow
      renderOrder={2}
    >
      <planeGeometry args={[size[0], size[1], segments[0], segments[1]]} />
      <meshStandardMaterial
        color={color}
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        displacementMap={displacementMap}
        displacementScale={0.06}
        displacementBias={-0.01}
        roughness={roughness}
        metalness={0}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}

export default Path;
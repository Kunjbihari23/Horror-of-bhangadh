import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type StarsProps = {
  count?: number;
  radiusRange?: [number, number];
  minHeight?: number;
  rotationSpeedX?: number;
};

const Stars = ({
  count = 700,
  radiusRange = [900, 1400],
  minHeight = 160,
  rotationSpeedX = 0.0008,
}: StarsProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const [minR, maxR] = radiusRange;
    const data: number[] = [];

    while (data.length < count * 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = THREE.MathUtils.lerp(minR, maxR, Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      if (y < minHeight) {
        continue;
      }

      data.push(x, y, z);
    }

    return new Float32Array(data);
  }, [count, radiusRange, minHeight]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x += rotationSpeedX * delta;
    }
  });

  return (
    <group ref={groupRef}>
      <points renderOrder={-5}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={positions.length / 3}
            itemSize={3} args={[positions, 3]}          />
        </bufferGeometry>
        <pointsMaterial
          color="#c8d6ff"
          size={2.2}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

export default Stars;

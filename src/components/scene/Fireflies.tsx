import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type FirefliesProps = {
  count?: number;
  center?: [number, number, number];
  spread?: [number, number, number];
  size?: [number, number];
  speed?: [number, number];
  color?: string;
};

type FireflyData = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  phase: number;
  pulseSpeed: number;
  bobSpeed: number;
  bobAmp: number;
  size: number;
};

function Fireflies({
  count = 990,
  center = [0, 0, -530],
  spread = [60, 30, 30],
  size = [0.022, 0.07],
  speed = [0.25, 0.95],
  color = "#dce543",
}: FirefliesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);

  const [sx, sy, sz] = spread;
  const [minSize, maxSize] = size;
  const [minSpeed, maxSpeed] = speed;

  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const tempGlowColor = useMemo(() => new THREE.Color(), []);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const glowObject = useMemo(() => new THREE.Object3D(), []);

  const glowTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.85)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }, []);

  const data = useMemo<FireflyData[]>(
    () =>
      Array.from({ length: count }, () => {
        const position = new THREE.Vector3(
          (Math.random() - 0.5) * sx,
          (Math.random() - 0.5) * sy,
          (Math.random() - 0.5) * sz,
        );

        const velocity = new THREE.Vector3(
          Math.random() - 0.5,
          (Math.random() - 0.5) * 0.6,
          Math.random() - 0.5,
        )
          .normalize()
          .multiplyScalar(
            THREE.MathUtils.lerp(minSpeed, maxSpeed, Math.random()),
          );

        return {
          position,
          velocity,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: THREE.MathUtils.lerp(0.4, 1.6, Math.random()),
          bobSpeed: THREE.MathUtils.lerp(0.35, 0.9, Math.random()),
          bobAmp: THREE.MathUtils.lerp(0.7, 3.0, Math.random()),
          size: THREE.MathUtils.lerp(minSize, maxSize, Math.random()),
        };
      }),
    [count, sx, sy, sz, minSize, maxSize, minSpeed, maxSpeed],
  );

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }
    if (glowMeshRef.current) {
      glowMeshRef.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }
  }, []);

  useFrame(({ clock, camera }, delta) => {
    const mesh = meshRef.current;
    const glowMesh = glowMeshRef.current;
    if (!mesh) return;

    const time = clock.getElapsedTime();
    const halfX = sx * 0.5;
    const halfY = sy * 0.5;
    const halfZ = sz * 0.5;

    for (let i = 0; i < data.length; i += 1) {
      const firefly = data[i];

      firefly.velocity.x += (Math.random() - 0.5) * delta * 0.35;
      firefly.velocity.y += (Math.random() - 0.5) * delta * 0.2;
      firefly.velocity.z += (Math.random() - 0.5) * delta * 0.35;

      const speedNow = firefly.velocity.length();
      if (speedNow > maxSpeed) {
        firefly.velocity.multiplyScalar(maxSpeed / speedNow);
      } else if (speedNow < minSpeed) {
        firefly.velocity.multiplyScalar(minSpeed / Math.max(speedNow, 0.0001));
      }

      firefly.position.addScaledVector(firefly.velocity, delta);

      if (firefly.position.x < -halfX) firefly.position.x = halfX;
      if (firefly.position.x > halfX) firefly.position.x = -halfX;
      if (firefly.position.y < -halfY) firefly.position.y = halfY;
      if (firefly.position.y > halfY) firefly.position.y = -halfY;
      if (firefly.position.z < -halfZ) firefly.position.z = halfZ;
      if (firefly.position.z > halfZ) firefly.position.z = -halfZ;

      const pulseRaw =
        0.5 + 0.5 * Math.sin(time * firefly.pulseSpeed + firefly.phase);
      const pulse = 0.05 + 0.95 * Math.pow(pulseRaw, 2.8);
      const shimmer =
        0.92 +
        0.08 *
          Math.sin(time * (8 + firefly.pulseSpeed * 2.2) + firefly.phase * 3.1);
      const bob =
        Math.sin(time * firefly.bobSpeed + firefly.phase * 0.8) *
        firefly.bobAmp;

      tempObject.position.copy(firefly.position);
      tempObject.position.y += bob;
      tempObject.scale.setScalar(firefly.size * (0.45 + pulse * 0.7));
      tempObject.updateMatrix();

      mesh.setMatrixAt(i, tempObject.matrix);
      tempColor.copy(baseColor).multiplyScalar((0.12 + pulse * 4.75) * shimmer);
      mesh.setColorAt(i, tempColor);

      if (glowMesh) {
        const glowScale = firefly.size * (1.4 + pulse * 4.2);
        glowObject.position.copy(tempObject.position);
        glowObject.quaternion.copy(camera.quaternion);
        glowObject.scale.setScalar(glowScale);
        glowObject.updateMatrix();

        glowMesh.setMatrixAt(i, glowObject.matrix);
        tempGlowColor
          .copy(baseColor)
          .multiplyScalar((0.35 + pulse * 2.2) * shimmer);
        glowMesh.setColorAt(i, tempGlowColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (glowMesh) {
      glowMesh.instanceMatrix.needsUpdate = true;
      if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={center}>
      {glowTexture && (
        <instancedMesh
          ref={glowMeshRef}
          args={[null as any, null as any, count]}
          frustumCulled={false}
          renderOrder={1}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glowTexture}
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            fog={false}
            vertexColors
          />
        </instancedMesh>
      )}
      <instancedMesh
        ref={meshRef}
        args={[null as any, null as any, count]}
        frustumCulled={false}
        renderOrder={2}
      >
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </instancedMesh>
    </group>
  );
}

export default Fireflies;

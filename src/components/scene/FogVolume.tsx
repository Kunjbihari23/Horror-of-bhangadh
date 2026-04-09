import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type FogVolumeProps = {
  count?: number;
  areaWidth?: number;
  zRange?: [number, number];
  heightRange?: [number, number];
  speedRange?: [number, number];
  scaleRange?: [number, number];
  opacityRange?: [number, number];
};

type FogSlice = {
  position: THREE.Vector3;
  baseY: number;
  scale: number;
  aspect: number;
  speed: number;
  opacity: number;
  rotation: number;
  bobPhase: number;
};

const createFogTexture = () => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.Texture();
  }

  ctx.clearRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  for (let i = 0; i < 28; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size * 0.65 + size * 0.15;
    const radius = THREE.MathUtils.lerp(32, 96, Math.random());

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.32)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.18)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

const FogVolume = ({
  count = 110,
  areaWidth = 240,
  zRange = [-40, -760],
  heightRange = [0.8, 14],
  speedRange = [0.08, 0.28],
  scaleRange = [20, 48],
  opacityRange = [0.12, 0.28],
}: FogVolumeProps) => {
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const { camera } = useThree();
  const texture = useMemo(() => createFogTexture(), []);

  const fogSlices = useMemo<FogSlice[]>(() => {
    const minZ = Math.min(zRange[0], zRange[1]);
    const maxZ = Math.max(zRange[0], zRange[1]);
    const data: FogSlice[] = [];

    for (let i = 0; i < count; i += 1) {
      const scale = THREE.MathUtils.lerp(scaleRange[0], scaleRange[1], Math.random());
      const aspect = THREE.MathUtils.lerp(1.6, 3.2, Math.random());
      const opacity = THREE.MathUtils.lerp(opacityRange[0], opacityRange[1], Math.random());
      const speed = THREE.MathUtils.lerp(speedRange[0], speedRange[1], Math.random());
      const baseY = THREE.MathUtils.lerp(heightRange[0], heightRange[1], Math.random());

      data.push({
        position: new THREE.Vector3(
          THREE.MathUtils.lerp(-areaWidth / 2, areaWidth / 2, Math.random()),
          baseY,
          THREE.MathUtils.lerp(minZ, maxZ, Math.random()),
        ),
        baseY,
        scale,
        aspect,
        speed,
        opacity,
        rotation: THREE.MathUtils.lerp(-0.3, 0.3, Math.random()),
        bobPhase: Math.random() * Math.PI * 2,
      });
    }

    return data;
  }, [count, areaWidth, zRange, heightRange, speedRange, scaleRange, opacityRange]);

  useFrame(({ clock }, delta) => {
    const wrap = areaWidth / 2 + 18;
    const t = clock.getElapsedTime();

    for (let i = 0; i < fogSlices.length; i += 1) {
      const mesh = meshRefs.current[i];
      const fog = fogSlices[i];
      if (!mesh || !fog) {
        continue;
      }

      mesh.position.x -= fog.speed * delta;
      if (mesh.position.x < -wrap) {
        mesh.position.x = wrap;
      }

      mesh.position.y = fog.baseY + Math.sin(t * 0.25 + fog.bobPhase) * 0.6;
      mesh.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group>
      {fogSlices.map((fog, i) => (
        <mesh
          key={`fog-${i}`}
          ref={(el) => {
            if (el) {
              meshRefs.current[i] = el;
            }
          }}
          position={[fog.position.x, fog.position.y, fog.position.z]}
          rotation={[0, 0, fog.rotation]}
          scale={[fog.scale * fog.aspect, fog.scale, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={fog.opacity}
            depthWrite={false}
            alphaTest={0.02}
            color="#c6d3e6"
            fog
          />
        </mesh>
      ))}
    </group>
  );
};

export default FogVolume;

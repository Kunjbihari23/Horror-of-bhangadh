import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type CloudsProps = {
  count?: number;
  areaWidth?: number;
  zRange?: [number, number];
  heightRange?: [number, number];
  speedRange?: [number, number];
  scaleRange?: [number, number];
  opacityRange?: [number, number];
};

type CloudData = {
  position: THREE.Vector3;
  scale: number;
  aspect: number;
  speed: number;
  opacity: number;
  rotation: number;
  textureIndex: number;
};

const createCloudTexture = () => {
  const size = 512;
  const noiseSize = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.Texture();
  }

  ctx.clearRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "blur(10px)";

  for (let i = 0; i < 36; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size * 0.7 + size * 0.1;
    const radius = THREE.MathUtils.lerp(50, 160, Math.random());

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.45)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.filter = "none";

  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = noiseSize;
  noiseCanvas.height = noiseSize;
  const noiseCtx = noiseCanvas.getContext("2d");
  if (noiseCtx) {
    const imageData = noiseCtx.createImageData(noiseSize, noiseSize);
    const smoothstep = (edge0: number, edge1: number, x: number) => {
      const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    };
    const rand = (x: number, y: number) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };
    const noise2D = (x: number, y: number) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const a = rand(ix, iy);
      const b = rand(ix + 1, iy);
      const c = rand(ix, iy + 1);
      const d = rand(ix + 1, iy + 1);
      const ux = smoothstep(0, 1, fx);
      const uy = smoothstep(0, 1, fy);
      const ab = a + (b - a) * ux;
      const cd = c + (d - c) * ux;
      return ab + (cd - ab) * uy;
    };
    const fbm = (x: number, y: number) => {
      let value = 0;
      let amp = 0.55;
      let freq = 1;
      for (let i = 0; i < 4; i += 1) {
        value += amp * noise2D(x * freq, y * freq);
        amp *= 0.5;
        freq *= 2;
      }
      return value;
    };

    for (let y = 0; y < noiseSize; y += 1) {
      for (let x = 0; x < noiseSize; x += 1) {
        const nx = x / noiseSize;
        const ny = y / noiseSize;
        const n = fbm(nx * 3.5, ny * 3.5);
        const alpha = smoothstep(0.35, 0.85, n) * 255;
        const idx = (y * noiseSize + x) * 4;
        imageData.data[idx] = 255;
        imageData.data[idx + 1] = 255;
        imageData.data[idx + 2] = 255;
        imageData.data[idx + 3] = alpha;
      }
    }

    noiseCtx.putImageData(imageData, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(noiseCanvas, 0, 0, size, size);
  }

  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createRadialGradient(
    size * 0.5,
    size * 0.55,
    size * 0.12,
    size * 0.5,
    size * 0.55,
    size * 0.6,
  );
  mask.addColorStop(0, "rgba(255,255,255,1)");
  mask.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
};

const Clouds = ({
  count = 52,
  areaWidth = 820,
  zRange = [-650, -1300],
  heightRange = [150, 180],
  speedRange = [0.08, 0.4],
  scaleRange = [18, 46],
  opacityRange = [0.2, 0.48],
}: CloudsProps) => {
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const { camera } = useThree();
  const textures = useMemo(
    () => [createCloudTexture(), createCloudTexture(), createCloudTexture()],
    [],
  );

  const clouds = useMemo<CloudData[]>(() => {
    const minZ = Math.min(zRange[0], zRange[1]);
    const maxZ = Math.max(zRange[0], zRange[1]);
    const data: CloudData[] = [];

    for (let i = 0; i < count; i += 1) {
      const scale = THREE.MathUtils.lerp(
        scaleRange[0],
        scaleRange[1],
        Math.random(),
      );
      const aspect = THREE.MathUtils.lerp(2.0, 3.8, Math.random());
      const opacity = THREE.MathUtils.lerp(
        opacityRange[0],
        opacityRange[1],
        Math.random(),
      );
      const speed = THREE.MathUtils.lerp(
        speedRange[0],
        speedRange[1],
        Math.random(),
      );

      data.push({
        position: new THREE.Vector3(
          THREE.MathUtils.lerp(-areaWidth / 2, areaWidth / 2, Math.random()),
          THREE.MathUtils.lerp(heightRange[0], heightRange[1], Math.random()),
          THREE.MathUtils.lerp(minZ, maxZ, Math.random()),
        ),
        scale,
        aspect,
        speed,
        opacity,
        rotation: THREE.MathUtils.lerp(-0.2, 0.2, Math.random()),
        textureIndex: Math.floor(Math.random() * textures.length),
      });
    }

    return data;
  }, [
    count,
    areaWidth,
    zRange,
    heightRange,
    speedRange,
    scaleRange,
    opacityRange,
    textures.length,
  ]);

  useFrame((_, delta) => {
    const wrap = areaWidth / 2 + 12;

    for (let i = 0; i < clouds.length; i += 1) {
      const mesh = meshRefs.current[i];
      const cloud = clouds[i];
      if (!mesh || !cloud) {
        continue;
      }

      mesh.position.x -= cloud.speed * delta;
      if (mesh.position.x < -wrap) {
        mesh.position.x = wrap;
      }

      mesh.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group>
      {clouds.map((cloud, i) => (
        <mesh
          key={`cloud-${i}`}
          ref={(el) => {
            if (el) {
              meshRefs.current[i] = el;
            }
          }}
          position={[cloud.position.x, cloud.position.y, cloud.position.z]}
          rotation={[0, 0, cloud.rotation]}
          scale={[cloud.scale * cloud.aspect, cloud.scale, 1]}
          renderOrder={-1}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={textures[cloud.textureIndex]}
            transparent
            opacity={cloud.opacity}
            depthWrite={false}
            color="#b7c6e3"
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Clouds;

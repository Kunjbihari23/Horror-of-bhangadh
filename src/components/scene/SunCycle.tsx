import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const SKY_VERTEX = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const SKY_FRAGMENT = `
  varying vec3 vWorldPosition;
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform vec3 hazeColor;
  uniform vec3 moonColor;
  uniform vec3 moonDir;
  uniform float moonIntensity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

    vec3 sky = mix(bottomColor, topColor, smoothstep(0.0, 1.0, h));
    float haze = smoothstep(0.0, 0.35, h);
    sky = mix(hazeColor, sky, haze);

    vec2 starCoord = dir.xz * 180.0;
    float starNoise = hash(floor(starCoord));
    float star = smoothstep(0.992, 1.0, starNoise);
    float starMask = smoothstep(0.45, 1.0, h);
    sky += vec3(0.35, 0.45, 0.7) * star * starMask;

    float moonAmount = max(dot(dir, normalize(moonDir)), 0.0);
    float moonGlow = pow(moonAmount, 220.0) + pow(moonAmount, 720.0) * 0.45;
    sky += moonColor * moonGlow * moonIntensity;

    gl_FragColor = vec4(sky, 1.0);
  }
`;

type SunCycleProps = {
  cycleSeconds?: number;
  radius?: number;
};

function SunCycle({
  cycleSeconds: _cycleSeconds = 140,
  radius: _radius = 90,
}: SunCycleProps) {
  const { scene } = useThree();
  const moonRef = useRef<THREE.Mesh>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  const skyMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const colors = useMemo(
    () => ({
      skyTop: new THREE.Color("#0a1329"),
      skyBottom: new THREE.Color("#020308"),
      haze: new THREE.Color("#0b1425"),
      fog: new THREE.Color("#0b0f1a"),
      moon: new THREE.Color("#b7d7ff"),
      lightCool: new THREE.Color("#9bb8ff"),
      lightDeep: new THREE.Color("#5a6ea5"),
    }),
    [],
  );

  const tempColor = useMemo(() => new THREE.Color(), []);
  const tempFog = useMemo(() => new THREE.Color(), []);
  const moonDirection = useMemo(() => new THREE.Vector3(), []);

  const skyUniforms = useMemo(
    () => ({
      topColor: { value: colors.skyTop.clone() },
      bottomColor: { value: colors.skyBottom.clone() },
      hazeColor: { value: colors.haze.clone() },
      moonColor: { value: colors.moon.clone() },
      moonDir: { value: new THREE.Vector3(0, 1, 0) },
      moonIntensity: { value: 0.0 },
    }),
    [colors],
  );

  useEffect(() => {
    if (sunLightRef.current && targetRef.current) {
      sunLightRef.current.target = targetRef.current;
    }
    if (sunLightRef.current) {
      sunLightRef.current.shadow.mapSize.set(2048, 2048);
      sunLightRef.current.shadow.bias = -0.0006;
      const camera = sunLightRef.current.shadow
        .camera as THREE.OrthographicCamera;
      camera.near = 1;
      camera.far = 420;
      camera.left = -80;
      camera.right = 80;
      camera.top = 80;
      camera.bottom = -80;
    }

    if (!scene.background || !(scene.background instanceof THREE.Color)) {
      scene.background = colors.skyBottom.clone();
    }
    scene.fog = null;
  }, [colors, scene]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const drift = Math.sin(time * 0.05) * 1.2;
    const moonX = -28 + drift;
    const moonY = 245 + Math.sin(time * 0.03) * 0.8;
    const moonZ = -900;

    sunLightRef.current?.position.set(moonX, moonY, moonZ);
    moonRef.current?.position.set(moonX, moonY, moonZ);

    const pulse = 0.9 + Math.sin(time * 0.2) * 0.05;

    if (sunLightRef.current) {
      sunLightRef.current.intensity = 1.6 * pulse;
    }

    tempColor.copy(colors.lightDeep).lerp(colors.lightCool, 0.65);
    sunLightRef.current?.color.copy(tempColor);

    tempFog.copy(colors.fog).lerp(colors.haze, 0.35);

    if (scene.background && scene.background instanceof THREE.Color) {
      scene.background.copy(tempFog);
    }

    if (skyMaterialRef.current) {
      moonDirection.set(moonX, moonY, moonZ).normalize();
      skyMaterialRef.current.uniforms.moonDir.value.copy(moonDirection);
    }

    if (sunLightRef.current?.target) {
      sunLightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <group>
      <mesh ref={moonRef} position={[-28, 68, -900]} renderOrder={-2}>
        <sphereGeometry args={[11, 32, 32]} />
        <meshBasicMaterial
          color="#dce9ff"
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={320} rotation={[0, Math.PI, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={skyMaterialRef}
          args={[
            {
              uniforms: skyUniforms,
              vertexShader: SKY_VERTEX,
              fragmentShader: SKY_FRAGMENT,
            },
          ]}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <directionalLight
        ref={sunLightRef}
        position={[-28, 68, -900]}
        intensity={1.0}
        color="#9bb8ff"
        castShadow
      />

      <object3D ref={targetRef} position={[0, 2, -60]} />
    </group>
  );
}

export default SunCycle;

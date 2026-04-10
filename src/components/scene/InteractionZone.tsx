/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Billboard, Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useInteraction } from "../../context/InteractionContext";

// Ring data for the upward cone hologram tower
// Each ring is wider + higher than the last → cone silhouette
const CONE_RINGS = [
  { y: 0.06, r: 0.04, tube: 0.01 }, // origin dot
  { y: 0.2, r: 0.16, tube: 0.014 },
  { y: 0.4, r: 0.34, tube: 0.016 },
  { y: 0.65, r: 0.54, tube: 0.017 },
  { y: 0.95, r: 0.76, tube: 0.018 },
  { y: 1.3, r: 0.98, tube: 0.019 },
  { y: 1.7, r: 1.2, tube: 0.019 },
  { y: 2.15, r: 1.4, tube: 0.018 },
];

type InteractionZoneProps = {
  position: [number, number, number];
  label: string;
  color: string;
  subtitle?: string;
  colliderRef?: (obj: THREE.Object3D | null) => void;
  /** Uniform scale for the entire effect. Default: 1 */
  scale?: number;
};

export default function InteractionZone({
  position,
  label,
  color,
  subtitle,
  colliderRef,
  scale = 1,
}: InteractionZoneProps) {
  const { camera } = useThree();
  const { nearestZone } = useInteraction();

  const groupRef = useRef<THREE.Group | null>(null);
  const outerRingRef = useRef<THREE.Mesh | null>(null);
  const outerRimRef = useRef<THREE.Mesh | null>(null);
  const innerRing2Ref = useRef<THREE.Mesh | null>(null);
  const innerCircleRef = useRef<THREE.Mesh | null>(null);
  const scanRingGroupRef = useRef<THREE.Group | null>(null);
  const coneGroupRef = useRef<THREE.Group | null>(null);
  const spotRef = useRef<THREE.SpotLight | null>(null);
  const colliderMeshRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  const zonePosRef = useRef(new THREE.Vector3(...position));
  const iconsDivRef = useRef<HTMLDivElement | null>(null);
  const labelDivRef = useRef<HTMLDivElement | null>(null);
  const coneScaleRef = useRef(1); // lerp target for cone fade
  const showHologramRef = useRef(false); // state mirror safe for useFrame

  const [showHologram, setShowHologram] = useState(false);
  const holoTimeoutRef = useRef<number | null>(null);

  const hexColor = useMemo(() => new THREE.Color(color), [color]);

  // Keep showHologramRef in sync
  useEffect(() => {
    showHologramRef.current = showHologram;
  }, [showHologram]);

  // ─── Rim shader ───────────────────────────────────────────────────────────
  const rimShader = useMemo(() => {
    const uniforms = {
      uColor: { value: hexColor.clone() },
      uTime: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
    } as any;
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec3 vNormal; varying vec3 vWorldPosition;
        void main(){
          vNormal=normalize(normalMatrix*normal);
          vWorldPosition=(modelMatrix*vec4(position,1.0)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uTime; uniform vec3 uCameraPos;
        varying vec3 vNormal; varying vec3 vWorldPosition;
        void main(){
          vec3 viewDir=normalize(uCameraPos-vWorldPosition);
          float fresnel=1.0-max(0.0,dot(viewDir,normalize(vNormal)));
          float rim=pow(fresnel,2.5);
          float pulse=0.7+0.3*sin(uTime*3.0+length(vWorldPosition)*0.5);
          gl_FragColor=vec4(uColor*pulse,rim*0.9);
        }`,
      transparent: true,
      depthWrite: false,
      
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, [hexColor]);

  // ─── Inner portal shader ──────────────────────────────────────────────────
  const innerShader = useMemo(() => {
    const uniforms = {
      uColor: { value: hexColor.clone() },
      uTime: { value: 0 },
    } as any;
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv;
        void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uTime; varying vec2 vUv;
        float hexGrid(vec2 p,float s){
          p/=s; vec2 h=vec2(1.0,1.7320508);
          vec2 a=mod(p,h)-h*0.5; vec2 b=mod(p-h*0.5,h)-h*0.5;
          float da=max(abs(a.x)*1.1547,abs(a.y)); float db=max(abs(b.x)*1.1547,abs(b.y));
          return min(da,db);
        }
        void main(){
          vec2 uv=vUv-0.5; float dist=length(uv);
          float mask=1.0-smoothstep(0.42,0.5,dist);
          if(mask<=0.0) discard;
          float center=(1.0-smoothstep(0.0,0.42,dist))*0.88;
          float rings=sin(dist*28.0-uTime*2.5)*0.5+0.5;
          rings*=smoothstep(0.42,0.05,dist)*0.30;
          float edgeRing=smoothstep(0.36,0.42,dist)*(1.0-smoothstep(0.42,0.5,dist));
          float edgePulse=0.5+0.5*sin(uTime*2.0-dist*10.0);
          float angle=atan(uv.y,uv.x);
          float sweep=mod(angle+uTime*2.0,6.28318)/6.28318;
          float beam=pow(1.0-sweep,6.0)*(1.0-smoothstep(0.0,0.42,dist))*0.7;
          float hex=hexGrid(vUv,0.09);
          float hexEdge=1.0-smoothstep(0.04,0.09,hex);
          float hexA=hexEdge*0.18*mask*smoothstep(0.08,0.35,dist);
          vec3 col=vec3(0.0,0.0,0.015);
          col+=uColor*rings; col+=uColor*edgeRing*edgePulse*0.6;
          col+=uColor*beam;  col+=uColor*hexA;
          float alpha=center*0.9;
          alpha=max(alpha,rings); alpha=max(alpha,edgeRing*edgePulse*0.55);
          alpha=max(alpha,beam*0.65); alpha=max(alpha,hexA);
          alpha*=mask;
          gl_FragColor=vec4(col,alpha);
        }`,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    });
  }, [hexColor]);

  // ─── Cone ring shader (phase-shifted upward wave on each ring) ────────────
  const coneRingShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: hexColor.clone() },
        uTime: { value: 0 },
        uPhase: { value: 0 },
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vWorldPosition;
        void main(){
          vNormal=normalize(normalMatrix*normal);
          vWorldPosition=(modelMatrix*vec4(position,1.0)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uTime;
        uniform float uPhase; uniform float uOpacity;
        varying vec3 vNormal; varying vec3 vWorldPosition;
        void main(){
          float pulse=0.5+0.5*sin(uTime*4.0-uPhase);
          float flicker=0.85+0.15*sin(uTime*13.0+uPhase*2.0);
          vec3 col=uColor*(1.2+pulse*0.5)*flicker;
          gl_FragColor=vec4(col,(0.6+0.4*pulse)*uOpacity*flicker);
        }`,
      transparent: true,
      depthWrite: false,
       depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, [hexColor]);

  // Clone one material per ring so each has its own uPhase
  const coneRingMaterials = useMemo(
    () =>
      CONE_RINGS.map((_, i) => {
        const mat = coneRingShader.clone();
        mat.uniforms.uPhase.value = i * ((Math.PI * 2) / CONE_RINGS.length);
        return mat;
      }),
    [coneRingShader],
  );

  // ─── Particles ────────────────────────────────────────────────────────────
  const { particleGeo, particleMeta } = useMemo(() => {
    const COUNT = 55;
    const positions = new Float32Array(COUNT * 3);
    const angles = new Float32Array(COUNT);
    const radii = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    const yPh = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      angles[i] = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      radii[i] = 1.05 + Math.random() * 0.65;
      speeds[i] =
        (0.35 + Math.random() * 0.65) * (Math.random() < 0.5 ? 1 : -1);
      yPh[i] = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angles[i]) * radii[i];
      positions[i * 3 + 1] = 0.08 + Math.random() * 0.25;
      positions[i * 3 + 2] = Math.sin(angles[i]) * radii[i];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { particleGeo: geo, particleMeta: { angles, radii, speeds, yPh } };
  }, []);

  const particleMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: hexColor,
        size: 0.065,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [hexColor],
  );

  // ─── Disposal ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      try {
        rimShader.dispose();
        innerShader.dispose();
        coneRingShader.dispose();
        coneRingMaterials.forEach((m) => m.dispose());
        particleGeo.dispose();
        particleMat.dispose();
      } catch (e) {
        console.error(e);
      }
    };
  }, [
    rimShader,
    innerShader,
    coneRingShader,
    coneRingMaterials,
    particleGeo,
    particleMat,
  ]);

  // ─── Collider ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (colliderRef && colliderMeshRef.current)
      colliderRef(colliderMeshRef.current);
    return () => {
      if (colliderRef) colliderRef(null);
    };
  }, [colliderRef]);

  // ─── Frame loop ───────────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (outerRingRef.current) outerRingRef.current.rotation.z += 0.012;
    if (innerRing2Ref.current) innerRing2Ref.current.rotation.z -= 0.008;

    if (rimShader && camera) {
      rimShader.uniforms.uTime.value = t;
      rimShader.uniforms.uCameraPos.value.copy(camera.position);
      rimShader.uniforms.uColor.value.copy(hexColor);
    }
    if (innerShader) {
      innerShader.uniforms.uTime.value = t;
      innerShader.uniforms.uColor.value.copy(hexColor);
    }

    // ── Cone tower: lerp scale to 0 when hologram label is visible ──
    if (coneGroupRef.current) {
      const target = showHologramRef.current ? 0.0 : 1.0;
      coneScaleRef.current = THREE.MathUtils.lerp(
        coneScaleRef.current,
        target,
        0.09,
      );
      coneGroupRef.current.scale.setScalar(coneScaleRef.current);

      // Animate each ring
      coneGroupRef.current.children.forEach((child, i) => {
        if (i >= CONE_RINGS.length) return; // skip cone body mesh
        const mat = coneRingMaterials[i];
        if (!mat) return;
        mat.uniforms.uTime.value = t;
        mat.uniforms.uColor.value.copy(hexColor);
        mat.uniforms.uOpacity.value = coneScaleRef.current;
        // Subtle per-ring vertical bob
        (child as THREE.Mesh).position.y =
          CONE_RINGS[i].y + Math.sin(t * 1.8 + i * 0.6) * 0.018;
      });
    }

    // Scan ring
    if (scanRingGroupRef.current) {
      const scanT = (t * 0.55) % 1;
      const s = 0.1 + scanT * 0.9;
      scanRingGroupRef.current.scale.set(s, 1, s);
      const mat = (scanRingGroupRef.current.children[0] as THREE.Mesh)
        .material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - scanT) * 0.55;
    }

    if (spotRef.current) {
      spotRef.current.intensity = 1.0 + Math.sin(t * 1.2) * 0.2;
      spotRef.current.color = hexColor;
    }

    // Particles
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position;
      const { angles, radii, speeds, yPh } = particleMeta;
      for (let i = 0; i < angles.length; i++) {
        angles[i] += speeds[i] * 0.009;
        pos.setX(i, Math.cos(angles[i]) * radii[i]);
        pos.setZ(i, Math.sin(angles[i]) * radii[i]);
        pos.setY(
          i,
          0.06 +
            Math.abs(Math.sin(t * Math.abs(speeds[i]) * 1.2 + yPh[i])) * 0.38,
        );
      }
      pos.needsUpdate = true;
    }
    if (particleMat) particleMat.color.copy(hexColor);

    // Label HUD fade
    if (iconsDivRef.current || labelDivRef.current) {
      const camDist = camera.position.distanceTo(zonePosRef.current);
      const nearHUD = showHologramRef.current && camDist < 12.0;
      const tr =
        "opacity 360ms cubic-bezier(0.34,1.56,0.64,1), transform 360ms cubic-bezier(0.34,1.56,0.64,1)";
      for (const el of [iconsDivRef.current, labelDivRef.current]) {
        if (!el) continue;
        el.style.transition = tr;
        el.style.opacity = nearHUD ? "1" : "0";
        el.style.transform = nearHUD ? "translateY(0px)" : "translateY(12px)";
        el.style.pointerEvents = nearHUD ? "auto" : "none";
      }
    }
  });

  // ─── Nearest zone state ───────────────────────────────────────────────────
  useEffect(() => {
    if (nearestZone === label) {
      if (holoTimeoutRef.current) window.clearTimeout(holoTimeoutRef.current);
      holoTimeoutRef.current = window.setTimeout(
        () => setShowHologram(true),
        180,
      ) as unknown as number;
    } else {
      if (holoTimeoutRef.current) {
        window.clearTimeout(holoTimeoutRef.current);
        holoTimeoutRef.current = null;
      }
      setShowHologram(false);
    }
    return () => {
      if (holoTimeoutRef.current) {
        window.clearTimeout(holoTimeoutRef.current);
        holoTimeoutRef.current = null;
      }
    };
  }, [nearestZone, label]);

  const isNearest = nearestZone === label;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* ════════════════════════════════════════════════════════════════
          FLOOR PORTAL — all y values raised + polygonOffset applied
          to stop z-fighting with your floor texture
          ════════════════════════════════════════════════════════════════ */}

      {/* Soft wide ground halo — rendered first (lowest renderOrder) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
        renderOrder={1}
      >
        <ringGeometry args={[1.0, 2.4, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Dark void center disk */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.055, 0]}
        renderOrder={2}
      >
        <circleGeometry args={[1.45, 64]} />
        <meshStandardMaterial
          color={0x000000}
          transparent
          opacity={0.82}
          metalness={0}
          roughness={1}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      {/* Inner holographic portal (hex-grid + sweep scan) */}
      <mesh
        ref={innerCircleRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.065, 0]}
        renderOrder={3}
      >
        <circleGeometry args={[1.5, 64]} />
        <primitive object={innerShader as any} attach="material" />
      </mesh>

      {/* Outer rotating base ring */}
      <mesh
        ref={outerRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.07, 0]}
        renderOrder={4}
      >
        <torusGeometry args={[1.5, 0.08, 16, 200]} />
        <meshStandardMaterial
          color={hexColor}
          emissive={hexColor}
          emissiveIntensity={isNearest ? 4.5 : 3.2}
          metalness={0.6}
          roughness={0.25}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
        />
      </mesh>

      {/* Fresnel rim overlay */}
      <mesh
        ref={outerRimRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.075, 0]}
        renderOrder={5}
      >
        <torusGeometry args={[1.5, 0.08, 12, 200]} />
        <primitive object={rimShader as any} attach="material" />
      </mesh>

      {/* Second counter-rotating inner ring */}
      <mesh
        ref={innerRing2Ref}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 0]}
        renderOrder={4}
      >
        <torusGeometry args={[1.1, 0.035, 12, 120]} />
        <meshStandardMaterial
          color={hexColor}
          emissive={hexColor}
          emissiveIntensity={isNearest ? 3.5 : 2.5}
          metalness={0.5}
          roughness={0.3}
          transparent
          opacity={0.75}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
        />
      </mesh>

      {/* Expanding scan pulse ring */}
      <group
        ref={scanRingGroupRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.09, 0]}
      >
        <mesh renderOrder={6}>
          <torusGeometry args={[1.5, 0.025, 8, 100]} />
          <meshBasicMaterial
            color={hexColor}
            transparent
            opacity={0.55}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* ════════════════════════════════════════════════════════════════
          CONE HOLOGRAM TOWER
          • 8 stacked torus rings, each wider + higher → cone shape
          • Upward-wave pulse via per-ring uPhase offset
          • Fades out (scale → 0) when label/HUD is visible
          ════════════════════════════════════════════════════════════════ */}
      <group ref={coneGroupRef} renderOrder={10}>
        {CONE_RINGS.map((ring, i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, ring.y, 0]}
          >
            <torusGeometry args={[ring.r, ring.tube, 12, 100]} />
            <primitive object={coneRingMaterials[i] as any} attach="material" />
          </mesh>
        ))}
        {/* Ghost cone body for subtle volume */}
        <mesh position={[0, 1.1, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[1.42, 2.2, 32, 1, true]} />
          <meshBasicMaterial
            color={hexColor}
            transparent
            opacity={0.035}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Orbiting spark particles */}
      <points
        ref={particlesRef}
        geometry={particleGeo}
        material={particleMat}
      />

      {/* Spot light */}
      <spotLight
        ref={spotRef}
        position={[0, 4, 0]}
        angle={0.6}
        penumbra={0.9}
        distance={12}
        decay={2}
        intensity={1.0}
        castShadow={false}
        color={hexColor}
      />

      {/* ════════════════════════════════════════════════════════════════
          LABEL HUD
          Moved higher (y=2.8) so it sits well above the cone tower,
          with text-shadow glow matching the zone color
          ════════════════════════════════════════════════════════════════ */}
      <Billboard position={[0, 2.8, 0]} follow={false}>
        <Html center zIndexRange={[10, 0]}>
          <div
            ref={labelDivRef as any}
            style={{
              textAlign: "center",
              color: color,
              fontWeight: 800,
              letterSpacing: "0.15em",
              opacity: 0,
              transform: "translateY(12px)",
              pointerEvents: "none",
              textShadow: `0 0 10px ${color}, 0 0 22px ${color}90, 0 2px 4px #000a`,
            }}
          >
            <div style={{ fontSize: 48, textTransform: "uppercase" }}>
              {label}
            </div>
            {subtitle && (
              <div style={{ fontSize: 36, opacity: 0.85, marginTop: 4 }}>
                {subtitle}
              </div>
            )}
          </div>
        </Html>
      </Billboard>

      {/* Invisible collider */}
      <mesh ref={colliderMeshRef} position={[0, 0.25, 0]} visible={false}>
        <cylinderGeometry args={[4, 4, 0.5, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

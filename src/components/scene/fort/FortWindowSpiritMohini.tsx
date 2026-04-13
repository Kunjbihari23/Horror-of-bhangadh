import { useAnimations, useEnvironment, useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ASSETS } from "../../../utils/assets";
import { FORT_WINDOW_SPIRIT_MOHINI } from "./fortLayout";

function FortWindowSpiritsMohini() {
  // 1. Log immediately to track loading state

  const soundRef = useRef<THREE.PositionalAudio | null>(null);
  const listenerRef = useRef<THREE.AudioListener | null>(null);

  const fbx = useFBX(ASSETS.mohiniComplete);
  // 'city' provides neutral, crisp lighting suitable for a horror night scene
  const reflectionTexture = useEnvironment({ preset: "city" });

  const group = useRef<THREE.Group | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isGone, setIsGone] = useState(false);

  const { actions, mixer } = useAnimations(fbx.animations, group);

  // 2. Proximity Jump Scare Trigger & Follow Behavior
  useFrame((state, delta) => {
    if (!group.current || isGone) return;

    const ghostWorldPos = new THREE.Vector3();
    group.current.getWorldPosition(ghostWorldPos);

    const distanceToPlayer = state.camera.position.distanceTo(ghostWorldPos);

    // Trigger proximity
    if (!hasTriggered && distanceToPlayer < 15) {
      console.log("🔥 Mohini Proximity Triggered!");
      setIsVisible(true);
      setHasTriggered(true);
    }

    // After trigger, make her smoothly face the camera
    if (hasTriggered && isVisible) {
      // Create a position for her to look at (ignoring Y for upright pivot)
      const targetPos = state.camera.position.clone();
      targetPos.y = ghostWorldPos.y;

      // Create a temporary object to calculate the look-at rotation
      const dummy = new THREE.Object3D();
      dummy.position.copy(ghostWorldPos);
      dummy.lookAt(targetPos);

      // Smoothly rotate toward player
      group.current.quaternion.slerp(dummy.quaternion, delta * 3.0);
    }
  });

  // 3. Apply Environment and Ghostly Materials
  // ... (Lines 62-113 remain unchanged)
  useEffect(() => {
    if (!fbx || !reflectionTexture) return;

    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        let mat = child.material;

        if (!(mat instanceof THREE.MeshStandardMaterial)) {
          const oldMat = mat as
            | THREE.MeshPhongMaterial
            | THREE.MeshBasicMaterial;
          mat = new THREE.MeshStandardMaterial({
            color: oldMat.color,
            map: oldMat.map || null,
          });
        } else {
          mat = mat.clone();
        }

        const standardMat = mat as THREE.MeshStandardMaterial;

        // Apply environment light
        standardMat.envMap = reflectionTexture;
        standardMat.envMapIntensity = 1.2;

        // Ghostly properties (balanced)
        standardMat.metalness = 0.05; // Almost no metalness
        standardMat.roughness = 0.45; // Soft silk-like reflections
        standardMat.transparent = true;
        standardMat.opacity = 0.75; // More solid but still ghostly

        // Subtle cold glow instead of solid blue
        standardMat.emissive = new THREE.Color("#051020");
        standardMat.emissiveIntensity = 0.8;

        standardMat.needsUpdate = true;
        child.material = standardMat;
      }
    });

    console.log("✨ Mohini material setup complete");
  }, [actions, fbx, reflectionTexture]);

  // 4. Play animation ONLY when she becomes visible
  useEffect(() => {
    if (isVisible && !isGone) {
      const walkAction = Object.values(actions)[0];

      // 🎵 PLAY SOUND
      // 🎵 PLAY SOUND (safe)
      if (
        soundRef.current &&
        soundRef.current.buffer &&
        !soundRef.current.isPlaying
      ) {
        soundRef.current.play();
      }

      if (walkAction) {
        walkAction.setLoop(THREE.LoopOnce, 1);
        walkAction.clampWhenFinished = true;
        walkAction.fadeIn(0.2).play();

        const onFinished = () => {
          console.log("💨 Mohini vanished!");

          // 🔇 STOP SOUND
          if (soundRef.current?.isPlaying) {
            soundRef.current.stop();
          }

          setIsGone(true);
        };

        mixer.addEventListener("finished", onFinished);
        return () => mixer.removeEventListener("finished", onFinished);
      }
    }
  }, [isVisible, actions, mixer, isGone]);

  useEffect(() => {
    const listener = new THREE.AudioListener();
    listenerRef.current = listener;

    // attach listener to camera
    const camera = group.current?.parent as THREE.Object3D;
    if (camera) {
      camera.add(listener);
    }

    const sound = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load(ASSETS.sounds.mohini, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true); // loop while visible
      sound.setVolume(10);
      sound.setRefDistance(10);
    });
    group.current?.add(sound);
    soundRef.current = sound;

    return () => {
      sound.stop();
    };
  }, []);

  return (
    <group
      ref={group}
      position={FORT_WINDOW_SPIRIT_MOHINI.position}
      rotation={[0, 0, 0]}
      scale={isVisible && !isGone ? FORT_WINDOW_SPIRIT_MOHINI.scale : 0}
    >
      <primitive object={fbx} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

useFBX.preload(ASSETS.mohiniComplete);

export default FortWindowSpiritsMohini;

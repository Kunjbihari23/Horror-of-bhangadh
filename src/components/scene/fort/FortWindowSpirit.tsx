import { useGLTF } from "@react-three/drei";
import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ASSETS } from "../../../utils/assets";
import {
  FORT_WINDOW_SPIRIT_POSITIONS,
  FORT_WINDOW_SPIRIT_TRANSFORM,
} from "./fortLayout";

function FortWindowSpirit() {
  const { scene } = useGLTF(ASSETS.mohini);
  const group = useRef<THREE.Group>(null);

  const spirit = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse(
      (child: { castShadow: boolean; receiveShadow: boolean }) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      },
    );

    return cloned;
  }, [scene]);

  const groundOffset = useMemo<[number, number, number]>(() => {
    const box = new THREE.Box3().setFromObject(spirit);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return [-center.x, -box.min.y, -center.z];
  }, [spirit]);

  useEffect(() => {
    if (!group.current || FORT_WINDOW_SPIRIT_POSITIONS.length === 0) {
      return;
    }

    const target = group.current;
    const timeline = gsap.timeline({ repeat: -1 });

    gsap.set(target.position, {
      x: FORT_WINDOW_SPIRIT_POSITIONS[0][0],
      y: FORT_WINDOW_SPIRIT_POSITIONS[0][1],
      z: FORT_WINDOW_SPIRIT_POSITIONS[0][2],
    });
    target.visible = true;

    FORT_WINDOW_SPIRIT_POSITIONS.forEach((_, index) => {
      const nextPosition =
        FORT_WINDOW_SPIRIT_POSITIONS[
          (index + 1) % FORT_WINDOW_SPIRIT_POSITIONS.length
        ];

      timeline
        .to({}, { duration: 3 })
        .call(() => {
          target.visible = false;
        })
        .to({}, { duration: 0.3 })
        .call(() => {
          target.position.set(...nextPosition);
          target.visible = true;
        });
    });

    return () => {
      timeline.kill();
      target.visible = true;
    };
  }, []);

  return (
    <group
      ref={group}
      position={FORT_WINDOW_SPIRIT_TRANSFORM.position}
      rotation={FORT_WINDOW_SPIRIT_TRANSFORM.rotation}
      scale={FORT_WINDOW_SPIRIT_TRANSFORM.scale}
    >
      <primitive object={spirit} position={groundOffset} />
    </group>
  );
}

useGLTF.preload(ASSETS.mohini);

export default FortWindowSpirit;

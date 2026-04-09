import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { ASSETS } from "../../../utils/assets";
import { FORT_WINDOW_SPIRIT_MOHINI } from "./fortLayout";

function FortWindowSpiritsMohini() {
  const { scene } = useGLTF(ASSETS.mohini3);
  const animation = useFBX(ASSETS.mohiniWalking);
  const group = useRef<THREE.Group>(null);

  const spirit = useMemo(() => {
    const cloned = clone(scene);

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

  const clips = useMemo(() => {
    return animation.animations.map((clip, index) => {
      const clonedClip = clip.clone();

      if (index === 0) {
        clonedClip.name = "mohini-walk";
      }

      return clonedClip;
    });
  }, [animation.animations]);

  const { actions } = useAnimations(clips, group);

  useEffect(() => {
    const walkAction = actions["mohini-walk"];

    if (!walkAction) {
      return;
    }

    walkAction.reset();
    walkAction.setLoop(THREE.LoopRepeat, Infinity);
    walkAction.fadeIn(0.4);
    walkAction.play();

    return () => {
      walkAction.fadeOut(0.2);
      walkAction.stop();
    };
  }, [actions]);

  const groundOffset = useMemo<[number, number, number]>(() => {
    const box = new THREE.Box3().setFromObject(spirit);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return [-center.x, -box.min.y, -center.z];
  }, [spirit]);

  return (
    <group
      ref={group}
      position={FORT_WINDOW_SPIRIT_MOHINI.position}
      rotation={FORT_WINDOW_SPIRIT_MOHINI.rotation}
      scale={FORT_WINDOW_SPIRIT_MOHINI.scale}
    >
      <primitive object={spirit} position={groundOffset} />
    </group>
  );
}
useGLTF.preload(ASSETS.mohini3);
useFBX.preload(ASSETS.mohiniWalking);

export default FortWindowSpiritsMohini;

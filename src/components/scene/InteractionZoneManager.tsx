/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useInteraction } from "../../context/InteractionContext";
import InteractionZone from "./InteractionZone";
import { CompanyEmail } from "../../utils/assets";

function InteractionZoneManager() {
  const { updateZones, updateNearestZone } = useInteraction();

  const collidersRef = useRef<THREE.Object3D[]>([]);
  const lastHitRef = useRef<string | null>(null);
  const raycaster = useRef(new THREE.Raycaster());

  const registerCollider = (obj: THREE.Object3D | null, label: string) => {
    if (obj) {
      obj.userData.zoneLabel = label;
      // ensure no duplicates
      collidersRef.current = collidersRef.current.filter(
        (o) => o !== obj && o.userData.zoneLabel !== label,
      );
      collidersRef.current.push(obj);
    } else {
      collidersRef.current = collidersRef.current.filter(
        (o) => o.userData.zoneLabel !== label,
      );
    }
  };

  useFrame(({ camera }) => {
    if (!camera) return;
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera as any);
    const intersects = raycaster.current.intersectObjects(
      collidersRef.current,
      true,
    );

    if (intersects.length > 0 && intersects[0].distance < 12) {
      const hit = intersects[0].object;
      const label = hit.userData.zoneLabel as string | undefined;
      if (label) {
        if (label !== lastHitRef.current) {
          if (lastHitRef.current) updateZones(lastHitRef.current, false);
          updateZones(label, true);
          lastHitRef.current = label;
        }
        updateNearestZone(label);
      }
    } else {
      // Fallback: if camera is simply near a ring (within proximity), activate it even if not looking down
      const tmp = new THREE.Vector3();
      let nearestObj: THREE.Object3D | null = null;
      let nearestDist = Infinity;

      for (const obj of collidersRef.current) {
        obj.getWorldPosition(tmp);
        const d = tmp.distanceTo(camera.position);
        if (d < nearestDist) {
          nearestDist = d;
          nearestObj = obj;
        }
      }

      const PROXIMITY_THRESHOLD = 5; // units
      if (nearestObj && nearestDist < PROXIMITY_THRESHOLD) {
        const label = nearestObj.userData.zoneLabel as string | undefined;
        if (label) {
          if (label !== lastHitRef.current) {
            if (lastHitRef.current) updateZones(lastHitRef.current, false);
            updateZones(label, true);
            lastHitRef.current = label;
          }
          updateNearestZone(label);
        }
      } else {
        if (lastHitRef.current) {
          updateZones(lastHitRef.current, false);
          lastHitRef.current = null;
        }
        updateNearestZone(null);
      }
    }
  });

  return (
    <>
      <InteractionZone
        position={[-2, 0.5, -508]}
        label="Contact Us"
        color="#FFD700"
        subtitle={CompanyEmail}
        colliderRef={(obj: any) => registerCollider(obj, "Contact Us")}
      />

      <InteractionZone
        position={[2, 0.5, -508]}
        label="Download Now"
        color="#00E5FF"
        subtitle=""
        colliderRef={(obj: any) => registerCollider(obj, "Download Now")}
      />
    </>
  );
}

export default InteractionZoneManager;

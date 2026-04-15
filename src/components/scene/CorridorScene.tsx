import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { ASSETS } from "../../utils/assets";
import Clouds from "./Clouds";
import Fireflies from "./Fireflies";
import Floor from "./Floor";
import FortScene from "./Fort";
import InteractionZoneManager from "./InteractionZoneManager";
import Lights from "./Lights";
import Path from "./Path";
import PlayerControls from "./PlayerControls";
import ScrollCamera from "./ScrollCamera";
import Stars from "./Stars";
import StartTagline from "./StartTagline";
import SunCycle from "./SunCycle";
import TrailPathText from "./TrailPathText";
import Wall from "./Wall";

type CorridorSceneProps = {
  scrollProgress: { current: number };
  canMove: boolean;
  onMoveStart?: () => void;
  entered: boolean;
  useJoystick?: boolean;
};

function CorridorScene({
  scrollProgress,
  canMove,
  onMoveStart,
  entered,
  useJoystick,
}: CorridorSceneProps) {
  const { scene } = useGLTF(ASSETS.Wall);

  const fortPosition = useMemo<[number, number, number]>(
    () => [-20, 18.4, -550],
    [],
  );

  const wallSize = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    return size;
  }, [scene]);

  const targetHeight = 3;
  const scaleFactor = targetHeight / wallSize.y;

  const scaledWidth = wallSize.x * scaleFactor;
  const scaledDepth = wallSize.z * scaleFactor;
  // Tight corridor like the reference: smaller gap, uniform alignment.
  const corridorHalfWidth = scaledWidth * 0.44;
  const COUNT = 18;
  const spacing = scaledDepth * 5.85;
  const pathWidth = corridorHalfWidth * 1.08;
  const totalPathLength = COUNT * spacing + spacing;
  const moveBounds = useMemo(
    () => ({
      minX: -corridorHalfWidth * 0.9,
      maxX: corridorHalfWidth * 0.9,
      // Change `+ 10` to adjust how close you can get to the fort. Right now it stops 10 units away (previously 25).
      minZ: fortPosition[2] + 20,
      maxZ: 0,
    }),
    [corridorHalfWidth, fortPosition],
  );

  return (
    <>
      <ScrollCamera progress={scrollProgress} enabled={!canMove} />
      <PlayerControls
        enabled={canMove}
        bounds={moveBounds}
        onMoveStart={onMoveStart}
        useJoystick={useJoystick}
      />
      <SunCycle />
      <Lights />
      <Stars />
      <Clouds />
      {entered && <StartTagline />}

      {/* <Ground /> */}
      <Floor />
      <Path
        position={[0, 0.07, -totalPathLength * 0.47]}
        size={[pathWidth / 1.2, totalPathLength]}
      />
      <TrailPathText enabled={entered} />

      {/* Interaction zones (Contact Us, Download Now) */}
      {canMove && <InteractionZoneManager />}

      {/* fort scene */}
      <FortScene position={fortPosition} />

      <Fireflies />

      {Array.from({ length: COUNT }).map((_, i) => (
        <Wall
          key={`left-${i}`}
          position={[-corridorHalfWidth, 1.6, -i * spacing]}
        />
      ))}

      {Array.from({ length: COUNT }).map((_, i) => (
        <Wall
          key={`right-${i}`}
          position={[corridorHalfWidth, 1.6, -i * spacing]}
          BASE_WALL_ROTATION={[Math.PI - 1.55, Math.PI, -4.72]}
        />
      ))}
    </>
  );
}

export default CorridorScene;

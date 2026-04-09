import { Html } from "@react-three/drei";
import "./StartTagline.css";

type StartTaglineProps = {
  position?: [number, number, number];
};

function StartTagline({ position = [0, 3.45, 12] }: StartTaglineProps) {
  return (
    <group position={position}>
      <Html center transform sprite distanceFactor={7}>
        <div className="start-tagline">
          <h1 className="start-tagline__title">Horror Of Bhangarh Fort</h1>
          <p className="start-tagline__subtitle">
          Survive the Night Inside India's Most Haunted Fort
          </p>
        </div>
      </Html>
    </group>
  );
}

export default StartTagline;

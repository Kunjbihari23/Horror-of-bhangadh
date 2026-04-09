import { useGLTF } from "@react-three/drei";
import { ASSETS } from "../../utils/assets";

interface Props {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}
const BhangadhBoard = ({
  scale =7,
  position = [-11, 4, -518],
  rotation = [0,-1,0],
}: Props) => {
  const { scene } = useGLTF(ASSETS.fortBoard);

  return (
    <primitive
      object={scene}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
};

export default BhangadhBoard;
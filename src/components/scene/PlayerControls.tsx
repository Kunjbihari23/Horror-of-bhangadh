import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type MoveBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type PlayerControlsProps = {
  enabled: boolean;
  bounds: MoveBounds;
  speed?: number;
  onMoveStart?: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PlayerControls({
  enabled,
  bounds,
  speed = 14,
  onMoveStart,
}: PlayerControlsProps) {
  const { camera, gl } = useThree();
  const baseY = useRef<number | null>(null);
  const hasMoved = useRef(false);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const isPointerLocked = useRef(false);
  const isMouseDown = useRef(false);

  const keys = useRef({
    forward: false,
    back: false,
    left: false,
    right: false,
  });

  const direction = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const gravity = 26;
  const jumpVelocity = 7.5;
  const lookSensitivity = 0.0022;

  useEffect(() => {
    if (!enabled) return;

    const domElement = gl.domElement;

    camera.rotation.order = "YXZ";
    yaw.current = camera.rotation.y;
    pitch.current = camera.rotation.x;

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === domElement;
    };

    const handlePointerDown = () => {
      isMouseDown.current = true;
      if (document.pointerLockElement !== domElement) {
        domElement.requestPointerLock?.();
      }
    };

    const handlePointerUp = () => {
      isMouseDown.current = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current && !isMouseDown.current) return;
      yaw.current -= event.movementX * lookSensitivity;
      pitch.current -= event.movementY * lookSensitivity;
      const limit = Math.PI / 2 - 0.08;
      pitch.current = clamp(pitch.current, -limit, limit);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (isGrounded.current) {
          isGrounded.current = false;
          velocityY.current = jumpVelocity;
          if (!hasMoved.current) {
            hasMoved.current = true;
            onMoveStart?.();
          }
        }
        return;
      }

      switch (event.key.toLowerCase()) {
        case "w":
        case "arrowup":
          event.preventDefault();
          keys.current.forward = true;
          break;
        case "s":
        case "arrowdown":
          event.preventDefault();
          keys.current.back = true;
          break;
        case "a":
        case "arrowleft":
          event.preventDefault();
          keys.current.left = true;
          break;
        case "d":
        case "arrowright":
          event.preventDefault();
          keys.current.right = true;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "w":
        case "arrowup":
          keys.current.forward = false;
          break;
        case "s":
        case "arrowdown":
          keys.current.back = false;
          break;
        case "a":
        case "arrowleft":
          keys.current.left = false;
          break;
        case "d":
        case "arrowright":
          keys.current.right = false;
          break;
        default:
          break;
      }
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    domElement.addEventListener("pointerdown", handlePointerDown);
    domElement.addEventListener("pointerup", handlePointerUp);
    domElement.addEventListener("pointerleave", handlePointerUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      if (document.pointerLockElement === domElement) {
        document.exitPointerLock?.();
      }
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange,
      );
      domElement.removeEventListener("pointerdown", handlePointerDown);
      domElement.removeEventListener("pointerup", handlePointerUp);
      domElement.removeEventListener("pointerleave", handlePointerUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, camera, gl.domElement, onMoveStart]);

  useFrame((_, delta) => {
    if (!enabled) return;

    if (baseY.current === null) {
      baseY.current = camera.position.y;
    }

    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");

    direction.set(0, 0, 0);
    if (keys.current.forward) direction.z += 1;
    if (keys.current.back) direction.z -= 1;
    if (keys.current.left) direction.x -= 1;
    if (keys.current.right) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const step = speed * delta;

      forward.set(0, 0, -1).applyAxisAngle(up, yaw.current);
      right.set(1, 0, 0).applyAxisAngle(up, yaw.current);

      camera.position.x +=
        (forward.x * direction.z + right.x * direction.x) * step;
      camera.position.z +=
        (forward.z * direction.z + right.z * direction.x) * step;

      camera.position.x = clamp(camera.position.x, bounds.minX, bounds.maxX);
      camera.position.z = clamp(camera.position.z, bounds.minZ, bounds.maxZ);

      if (!hasMoved.current) {
        hasMoved.current = true;
        onMoveStart?.();
      }
    }

    if (!isGrounded.current) {
      velocityY.current -= gravity * delta;
      camera.position.y += velocityY.current * delta;
      if (camera.position.y <= baseY.current) {
        camera.position.y = baseY.current;
        velocityY.current = 0;
        isGrounded.current = true;
      }
    }
  });

  return null;
}

export default PlayerControls;

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
  useJoystick?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PlayerControls({
  enabled,
  bounds,
  speed = 14,
  onMoveStart,
  useJoystick,
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

  const keys = useRef({ forward: false, back: false, left: false, right: false });
  const joystick = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });

  const direction = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const gravity = 26;
  const jumpVelocity = 7.5;
  const lookSensitivity = 0.0022;
  const touchSensitivity = 0.0035;

  // Clear stuck keys when switching to joystick mode
  useEffect(() => {
    if (useJoystick) {
      keys.current = { forward: false, back: false, left: false, right: false };
    }
  }, [useJoystick]);

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

    const handleTouchStart = (event: TouchEvent) => {
      // Right side of screen only — left side is the joystick zone
      const touch = Array.from(event.touches).find(
        (t) => t.clientX > window.innerWidth * 0.35,
      );
      if (touch) {
        lastTouch.current.x = touch.pageX;
        lastTouch.current.y = touch.pageY;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = Array.from(event.touches).find(
        (t) => t.clientX > window.innerWidth * 0.35,
      );
      if (!touch) return;

      const movementX = touch.pageX - lastTouch.current.x;
      const movementY = touch.pageY - lastTouch.current.y;

      yaw.current -= movementX * touchSensitivity;
      pitch.current -= movementY * touchSensitivity;

      const limit = Math.PI / 2 - 0.08;
      pitch.current = clamp(pitch.current, -limit, limit);

      lastTouch.current.x = touch.pageX;
      lastTouch.current.y = touch.pageY;

      if (!hasMoved.current) {
        hasMoved.current = true;
        onMoveStart?.();
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleJoystickMove = (event: any) => {
      joystick.current.x = event.detail.x;
      joystick.current.y = event.detail.y;
    };

    const handleJoystickEnd = () => {
      joystick.current.x = 0;
      joystick.current.y = 0;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (useJoystick) return;
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
        case "w": case "arrowup":    event.preventDefault(); keys.current.forward = true; break;
        case "s": case "arrowdown":  event.preventDefault(); keys.current.back    = true; break;
        case "a": case "arrowleft":  event.preventDefault(); keys.current.left    = true; break;
        case "d": case "arrowright": event.preventDefault(); keys.current.right   = true; break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (useJoystick) return;
      switch (event.key.toLowerCase()) {
        case "w": case "arrowup":    keys.current.forward = false; break;
        case "s": case "arrowdown":  keys.current.back    = false; break;
        case "a": case "arrowleft":  keys.current.left    = false; break;
        case "d": case "arrowright": keys.current.right   = false; break;
      }
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    domElement.addEventListener("pointerdown", handlePointerDown);
    domElement.addEventListener("pointerup", handlePointerUp);
    domElement.addEventListener("pointerleave", handlePointerUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    domElement.addEventListener("touchstart", handleTouchStart, { passive: false });
    domElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("joystickmove", handleJoystickMove);
    window.addEventListener("joystickend", handleJoystickEnd);

    return () => {
      if (document.pointerLockElement === domElement) {
        document.exitPointerLock?.();
      }
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      domElement.removeEventListener("pointerdown", handlePointerDown);
      domElement.removeEventListener("pointerup", handlePointerUp);
      domElement.removeEventListener("pointerleave", handlePointerUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      domElement.removeEventListener("touchstart", handleTouchStart);
      domElement.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("joystickmove", handleJoystickMove);
      window.removeEventListener("joystickend", handleJoystickEnd);
    };
  }, [enabled, camera, gl.domElement, onMoveStart, useJoystick]);

  useFrame((_, delta) => {
    if (!enabled) return;

    if (baseY.current === null) {
      baseY.current = camera.position.y;
    }

    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");

    direction.set(0, 0, 0);
    if (keys.current.forward) direction.z += 1;
    if (keys.current.back)    direction.z -= 1;
    if (keys.current.left)    direction.x -= 1;
    if (keys.current.right)   direction.x += 1;

    if (joystick.current.x !== 0 || joystick.current.y !== 0) {
      direction.x += joystick.current.x;
      direction.z += joystick.current.y;
    }

    if (direction.lengthSq() > 0) {
      direction.normalize();
      const step = speed * delta;

      forward.set(0, 0, -1).applyAxisAngle(up, yaw.current);
      right.set(1, 0, 0).applyAxisAngle(up, yaw.current);

      camera.position.x += (forward.x * direction.z + right.x * direction.x) * step;
      camera.position.z += (forward.z * direction.z + right.z * direction.x) * step;

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

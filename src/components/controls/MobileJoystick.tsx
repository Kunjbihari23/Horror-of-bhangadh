import React, { useEffect, useRef } from "react";
import nipplejs from "nipplejs";
import "./MobileJoystick.css";

interface JoystickProps {
  onEnd?: () => void;
}

const MobileJoystick: React.FC<JoystickProps> = ({ onEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manager = (nipplejs as any).create({
      zone: containerRef.current,
      mode: "static",
      position: { left: "50%", top: "50%" },
      color: "rgba(255,255,255,0.55)",
      size: 110,
      restOpacity: 0.5,
      fadeTime: 150,
    });

    // manager.on receives { type, target, data }
    // data has: force (0-1+), angle.radian, angle.degree
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    manager.on("move", (evt: any) => {
      const data = evt.data ?? evt; // handle both wrapper and raw shapes
      const force = Math.min(data.force ?? 0, 1);
      const radian = data.angle?.radian ?? 0;
      // nipplejs angle: 0 = right, PI/2 = up — convert to game axes
      const x = Math.cos(radian) * force;
      const y = Math.sin(radian) * force; // up = positive forward
      window.dispatchEvent(
        new CustomEvent("joystickmove", { detail: { x, y } }),
      );
    });

    manager.on("end", () => {
      window.dispatchEvent(
        new CustomEvent("joystickmove", { detail: { x: 0, y: 0 } }),
      );
      window.dispatchEvent(new CustomEvent("joystickend"));
      onEnd?.();
    });

    return () => {
      manager.destroy();
    };
  }, [onEnd]);

  return <div ref={containerRef} className="joystick-container" />;
};

export default MobileJoystick;

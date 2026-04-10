import { createContext, useState } from "react";

export type InteractionContextType = {
  activeZones: Set<string>;
  updateZones: (label: string, isActive: boolean) => void;
  nearestZone: string | null;
  updateNearestZone: (label: string | null) => void;
};

export const InteractionContext = createContext<InteractionContextType | null>(
  null,
);

export function InteractionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeZones, setActiveZones] = useState<Set<string>>(new Set());
  const [nearestZone, setNearestZone] = useState<string | null>(null);

  const updateZones = (label: string, isActive: boolean) => {
    setActiveZones((prev) => {
      const next = new Set(prev);
      if (isActive) {
        next.add(label);
      } else {
        next.delete(label);
      }
      return next;
    });
  };

  const updateNearestZone = (label: string | null) => {
    setNearestZone(label);
  };

  return (
    <InteractionContext.Provider
      value={{ activeZones, updateZones, nearestZone, updateNearestZone }}
    >
      {children}
    </InteractionContext.Provider>
  );
}

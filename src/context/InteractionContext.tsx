import { useContext } from "react";
import { InteractionContext } from "./InteractionProvider";

export function useInteraction() {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error("useInteraction must be used within InteractionProvider");
  }
  return context;
}

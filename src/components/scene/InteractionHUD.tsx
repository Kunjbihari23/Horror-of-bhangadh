import { useEffect, useRef } from "react";
import { useInteraction } from "../../context/InteractionContext";
import "./InteractionHUD.css";
import { ContactUsUrl, DownloadNowUrl } from "../../utils/assets";

function InteractionHUD() {
  const { nearestZone } = useInteraction();
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<string | null>(null);

  // Keep last label for key handler
  useEffect(() => {
    labelRef.current = nearestZone;
    const prompt = containerRef.current?.querySelector(
      ".interaction-prompt",
    ) as HTMLElement | null;
    if (!prompt) return;
    if (nearestZone) {
      // entry transition
      prompt.style.transition =
        "opacity 400ms cubic-bezier(0.34,1.56,0.64,1), transform 400ms cubic-bezier(0.34,1.56,0.64,1)";
      prompt.style.opacity = "1";
      prompt.style.transform = "translateY(0px)";
      prompt.style.pointerEvents = "auto";
    } else {
      // exit transition
      prompt.style.transition =
        "opacity 250ms ease-in, transform 250ms ease-in";
      prompt.style.opacity = "0";
      prompt.style.transform = "translateY(8px)";
      prompt.style.pointerEvents = "none";
    }
  }, [nearestZone]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && labelRef.current) {
        e.preventDefault();
        const label = labelRef.current;
        if (label === "Contact Us") {
          window.open(ContactUsUrl, "_blank");
        } else if (label === "Download Now") {
          window.open(DownloadNowUrl, "_blank");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const colorClass = nearestZone === "Download Now" ? "cyan" : "gold";
  const labelText = nearestZone ? nearestZone : "";

  return (
    <div
      ref={containerRef}
      className={`interaction-hud ${colorClass}`}
      style={{
        position: "fixed",
        bottom: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
      }}
      role="button"
      onClick={() => {
        const label = labelRef.current;
        if (label === "Contact Us") {
          window.open(ContactUsUrl, "_blank");
        } else if (label === "Download Now") {
          window.open(DownloadNowUrl, "_blank");
        }
      }}
    >
      <div
        className="interaction-prompt flex flex-col"
        aria-hidden={nearestZone ? "false" : "true"}
      >
        <div className="prompt-text flex items-center gap-2">
          <span className="prompt-key p-1! w-fit">Click</span> to {labelText}
        </div>
        <div className="prompt-text flex items-center gap-2">
          or Press <span className="prompt-key p-1!">Enter</span>
        </div>
      </div>
    </div>
  );
}

export default InteractionHUD;

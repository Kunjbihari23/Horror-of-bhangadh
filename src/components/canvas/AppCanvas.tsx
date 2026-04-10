/* eslint-disable react-hooks/set-state-in-effect */
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import CorridorScene from "../scene/CorridorScene";
import { Preload, useProgress } from "@react-three/drei";
import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import HorrorLoader from "../loader/HorrorLoader";
import Lenis from "lenis";
import { ASSETS } from "../../utils/assets";
import { InteractionProvider } from "../../context/InteractionProvider";
import InteractionHUD from "../scene/InteractionHUD";

/**
 * This invisible component sits inside <Canvas> and forwards
 * drei's loading progress to the parent via a callback ref.
 */
function ProgressReporter({ onProgress }: { onProgress: (p: number) => void }) {
  const { progress } = useProgress();

  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);

  return null;
}

function AppCanvas() {
  const [entered, setEntered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canMove, setCanMove] = useState(false);
  const [showMoveHint, setShowMoveHint] = useState(false);
  const scrollProgress = useRef(0);
  const hasReachedEnd = useRef(false);
  const hintTimeout = useRef<number | null>(null);
  const scrollHeightVh = 300;
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const triggerMoveHint = useCallback(() => {
    setShowMoveHint(true);
    if (hintTimeout.current !== null) {
      window.clearTimeout(hintTimeout.current);
    }
    hintTimeout.current = window.setTimeout(() => {
      setShowMoveHint(false);
    }, 2400);
  }, []);

  const handleMoveStart = useCallback(() => {
    setShowMoveHint(false);
  }, []);

  useEffect(() => {
    if (!entered) {
      scrollProgress.current = 0;
      hasReachedEnd.current = false;
      setCanMove(false);
      setShowMoveHint(false);
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      lerp: 0.08,
      smoothWheel: true,
      // smoothTouch: true,
      wheelMultiplier: 0.9,
    });

    const handleScroll = (e: { scroll: number; limit: number }) => {
      if (hasReachedEnd.current) {
        scrollProgress.current = 1;
        return;
      }

      const next = e.limit > 0 ? e.scroll / e.limit : 0;
      const clamped = Math.min(1, Math.max(0, next));

      if (clamped >= 0.98) {
        hasReachedEnd.current = true;
        scrollProgress.current = 1;
        setCanMove(true);
        triggerMoveHint();
        lenis.stop();
        return;
      }

      scrollProgress.current = clamped;
    };

    lenis.on("scroll", handleScroll);
    lenis.scrollTo(0, { immediate: true });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.off("scroll", handleScroll);
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, [entered, triggerMoveHint]);

  useEffect(() => {
    return () => {
      if (hintTimeout.current !== null) {
        window.clearTimeout(hintTimeout.current);
      }
    };
  }, []);

  const startAmbientAudio = useCallback(() => {
    let ambient = ambientAudioRef.current;

    if (!ambient) {
      ambient = new Audio(ASSETS.sounds.ambient);
      ambient.loop = true;
      ambient.volume = 1;
      ambient.preload = "auto";
      ambientAudioRef.current = ambient;
    }

    if (ambient.paused) {
      void ambient.play().catch(() => {
        // Autoplay can be blocked until user gesture; retried on "Enter".
      });
    }
  }, []);

  useEffect(() => {
    // Attempt during loader phase so ambience starts as early as browser policy allows.
    startAmbientAudio();

    return () => {
      if (!ambientAudioRef.current) return;
      ambientAudioRef.current.pause();
      ambientAudioRef.current.currentTime = 0;
    };
  }, [startAmbientAudio]);

  return (
    <InteractionProvider>
      <div style={{ position: "relative", width: "100vw" }}>
        {/* Loader overlay — pure DOM, sits above the canvas */}
        {!entered && (
          <HorrorLoader
            progress={progress}
            onStartAmbient={startAmbientAudio}
            onEnter={() => setEntered(true)}
          />
        )}

        <div
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
          }}
        >
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.4,
            }}
            camera={{ position: [0, 2.8, 20], fov: 70 }}
          >
            <ProgressReporter onProgress={handleProgress} />

            <Suspense fallback={null}>
              <CorridorScene
                scrollProgress={scrollProgress}
                canMove={canMove}
                onMoveStart={handleMoveStart}
                entered={entered}
              />
            </Suspense>
            <Preload all />
          </Canvas>
        </div>

        {/* Interaction HUD - renders outside Canvas */}
        <InteractionHUD />

        {showMoveHint && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: "6vh",
              transform: "translateX(-50%)",
              padding: "12px 20px",
              background: "rgba(12, 16, 24, 0.72)",
              border: "1px solid rgba(150, 170, 210, 0.35)",
              borderRadius: 999,
              color: "#e7f0ff",
              fontSize: 14,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              zIndex: 10,
            }}
          >
            Now you can move
          </div>
        )}

        {/* Scroll space to drive Lenis progress while canvas stays fixed */}
        <div style={{ height: `${scrollHeightVh}vh` }} aria-hidden />
      </div>
    </InteractionProvider>
  );
}

export default AppCanvas;

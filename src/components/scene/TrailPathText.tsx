/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ASSETS } from "../../utils/assets";
import "./TrailPathText.css";

type TrailPathTextProps = {
  enabled: boolean;
};

const TRAILER_EMBED_URL = "https://www.youtube.com/embed/srOvSedGm0I";
const TRAILER_WATCH_URL =
  "https://www.youtube.com/results?search_query=Horror+of+Bhangarh+Fort+Unreal+Engine+5";

function withYouTubeApi(embedUrl: string) {
  if (!embedUrl) return "";

  try {
    const url = new URL(embedUrl);
    url.searchParams.set("enablejsapi", "1");
    url.searchParams.set("playsinline", "1");
    return url.toString();
  } catch {
    return embedUrl;
  }
}

const ABOUT_PARAGRAPHS = [
  "Some places are meant to be abandoned. Bhangarh Fort is one of them.",
  "Horror of Bhangarh Fort is a first-person survival horror experience inspired by India's most haunted fort, where fear, mystery, and survival collide.",
  "You play as an investigative reporter entering the cursed ruins at midnight with only a torch and instinct. There are no weapons, no guidance, and no safe paths.",
  "AI-driven spirits stalk your movement while objects shift, corridors react, and supernatural events unfold based on how you explore.",
  "As you uncover relics and cryptic clues tied to the curse, every answer increases danger. The deeper you venture, the harder the fort pushes back.",
];

const FEATURES = [
  "First Person View",
  "Smooth Gameplay",
  "Realistic Graphics",
  "Survival Horror",
  "Supernatural Encounter",
  "Interactable AI",
  "360 Sound System",
  "Based on Real Location",
];

const STATION_IDS = ["trailer", "about", "features"] as const;
type StationId = (typeof STATION_IDS)[number];

type StationConfig = {
  id: StationId;
  position: [number, number, number];
  minDistance: number;
  revealDistance: number;
};

const STATIONS: StationConfig[] = [
  { id: "trailer", position: [0, 2.05, -165], minDistance: 18, revealDistance: 72 },
  { id: "about", position: [0, 2.2, -320], minDistance: 20, revealDistance: 86 },
  { id: "features", position: [0, 2.1, -470], minDistance: 22, revealDistance: 92 },
];

const RANDOM_DIRECTIONS = [
  { x: -160, y: 0, rotate: -8 },
  { x: 160, y: 0, rotate: 8 },
  { x: 0, y: -120, rotate: 5 },
  { x: 0, y: 120, rotate: -5 },
  { x: -120, y: -80, rotate: -7 },
  { x: 120, y: 80, rotate: 7 },
  { x: -140, y: 95, rotate: -9 },
  { x: 140, y: -95, rotate: 9 },
];

function randomDirection() {
  return RANDOM_DIRECTIONS[Math.floor(Math.random() * RANDOM_DIRECTIONS.length)];
}

function BloodDrips({ count = 10 }: { count?: number }) {
  const drops = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const width = 2 + Math.random() * 2.8;
        const baseHeight = 6 + Math.random() * 9;
        const maxHeight = 50 + Math.random() * 36;
        const duration = 2.5 + Math.random() * 5.6;
        const delay = Math.random() * 5.4;
        const opacity = 0.42 + Math.random() * 0.44;
        const beadSize = width + 2 + Math.random() * 3.2;
        const travel = 25 + Math.random() * 38;
        const sway = -2 + Math.random() * 10;

        return {
          left: `${4 + Math.random() * 92}%`,
          width: `${width.toFixed(2)}px`,
          baseHeight: `${baseHeight.toFixed(2)}px`,
          maxHeight: `${maxHeight.toFixed(2)}px`,
          duration: `${duration.toFixed(2)}s`,
          delay: `${delay.toFixed(2)}s`,
          opacity: opacity.toFixed(3),
          beadSize: `${beadSize.toFixed(2)}px`,
          travel: `${travel.toFixed(2)}px`,
          sway: `${sway.toFixed(2)}px`,
          swaySoft: `${(sway * 0.34).toFixed(2)}px`,
          swayMid: `${(sway * 0.58).toFixed(2)}px`,
          hueShift: `${(-8 + Math.random() * 16).toFixed(2)}deg`,
          highlightOpacity: (0.2 + Math.random() * 0.25).toFixed(3),
        };
      }),
    [count],
  );

  return (
    <div className="trail-blood" aria-hidden="true">
      {drops.map((drop, index) => (
        <span
          key={index}
          className="trail-blood__drop"
          style={
            {
              "--drop-left": drop.left,
              "--drop-width": drop.width,
              "--drop-base-height": drop.baseHeight,
              "--drop-max-height": drop.maxHeight,
              "--drop-duration": drop.duration,
              "--drop-delay": drop.delay,
              "--drop-opacity": drop.opacity,
              "--drop-bead-size": drop.beadSize,
              "--drop-travel": drop.travel,
              "--drop-sway": drop.sway,
              "--drop-sway-soft": drop.swaySoft,
              "--drop-sway-mid": drop.swayMid,
              "--drop-hue-shift": drop.hueShift,
              "--drop-highlight-opacity": drop.highlightOpacity,
            } as any
          }
        />
      ))}
    </div>
  );
}

function TrailPathText({ enabled }: TrailPathTextProps) {
  const trailerIframeRef = useRef<HTMLIFrameElement | null>(null);
  const stationRefs = useRef<Record<StationId, HTMLElement | null>>({
    trailer: null,
    about: null,
    features: null,
  });
  const previousActiveRef = useRef<StationId | null>(null);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const trailerEmbedSrc = useMemo(
    () => withYouTubeApi(TRAILER_EMBED_URL),
    [],
  );
  const [activeStation, setActiveStation] = useState<StationId | null>(null);

  const pauseTrailerVideo = () => {
    const iframe = trailerIframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: "pauseVideo",
        args: [],
      }),
      "*",
    );
  };

  useEffect(() => {
    if (enabled) return;

    setActiveStation(null);
    previousActiveRef.current = null;

    STATION_IDS.forEach((id) => {
      const element = stationRefs.current[id];
      if (!element) return;

      gsap.killTweensOf(element);
      gsap.set(element, {
        autoAlpha: 0,
        x: 0,
        y: 0,
        rotate: 0,
        filter: "blur(0px)",
      });
    });

    pauseTrailerVideo();
  }, [enabled]);

  useFrame(({ camera }) => {
    if (!enabled) return;

    let nextActiveStation: StationId | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    STATIONS.forEach((station) => {
      tempPosition.set(
        station.position[0],
        station.position[1],
        station.position[2],
      );
      const distance = camera.position.distanceTo(tempPosition);

      if (
        distance >= station.minDistance &&
        distance <= station.revealDistance &&
        distance < nearestDistance
      ) {
        nearestDistance = distance;
        nextActiveStation = station.id;
      }
    });

    if (previousActiveRef.current === nextActiveStation) return;

    previousActiveRef.current = nextActiveStation;
    setActiveStation(nextActiveStation);
  });

  useEffect(() => {
    if (!enabled) return;

    if (activeStation !== "trailer") {
      pauseTrailerVideo();
    }

    STATION_IDS.forEach((id) => {
      const element = stationRefs.current[id];
      if (!element) return;

      gsap.killTweensOf(element);

      const isVisible = activeStation === id;

      if (isVisible) {
        const direction = randomDirection();
        gsap.fromTo(
          element,
          {
            autoAlpha: 0,
            x: direction.x,
            y: direction.y,
            rotate: direction.rotate,
            filter: "blur(10px)",
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            rotate: 0,
            filter: "blur(0px)",
            duration: 1.1,
            ease: "power3.out",
          },
        );
      } else {
        gsap.to(element, {
          autoAlpha: 0,
          duration: 0.42,
          ease: "power2.in",
        });
      }
    });
  }, [enabled, activeStation]);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <group position={STATIONS[0].position}>
        <Html transform center sprite distanceFactor={15}>
          <section
            ref={(node) => {
              stationRefs.current.trailer = node;
            }}
            className="trail-station trail-station--trailer"
            aria-hidden={activeStation !== "trailer"}
            style={{
              display: activeStation === "trailer" ? "block" : "none",
            }}
          >
            <BloodDrips />
            <h2 className="trail-station__heading">Watch The Horror Unfold</h2>
            <div className="trail-trailer">
              <div className="trail-trailer__copy">
                <p>
                  Experience a survival horror game set inside India&apos;s most
                  haunted fort. Explore ruined walls, abandoned temples, and
                  cursed courtyards where fear follows every step.
                </p>
                <p>
                  Enter the darkness and see if you can survive what the fort
                  awakens.
                </p>
                <a
                  className="trail-cta"
                  href={TRAILER_WATCH_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch on YouTube
                </a>
              </div>
              <div className="trail-trailer__media">
                {trailerEmbedSrc ? (
                  <iframe
                    ref={trailerIframeRef}
                    title="Horror Of Bhangarh Fort Trailer"
                    src={trailerEmbedSrc}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="trail-trailer__fallback">
                    <img
                      src={ASSETS.posters.poster3}
                      alt="Horror of Bhangarh Fort trailer preview"
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </Html>
      </group>

      <group position={STATIONS[1].position}>
        <Html transform center sprite distanceFactor={16}>
          <section
            ref={(node) => {
              stationRefs.current.about = node;
            }}
            className="trail-station trail-station--about"
            aria-hidden={activeStation !== "about"}
            style={{
              display: activeStation === "about" ? "block" : "none",
            }}
          >
            <BloodDrips />
            <h2 className="trail-station__heading">About The Game</h2>
            <div className="trail-about">
              {ABOUT_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p className="trail-about__final">
                Will you uncover the truth behind the curse, or become another
                soul lost in the legend of Bhangarh Fort?
              </p>
            </div>
          </section>
        </Html>
      </group>

      <group position={STATIONS[2].position}>
        <Html transform center sprite distanceFactor={15}>
          <section
            ref={(node) => {
              stationRefs.current.features = node;
            }}
            className="trail-station trail-station--features"
            aria-hidden={activeStation !== "features"}
            style={{
              display: activeStation === "features" ? "block" : "none",
            }}
          >
            <BloodDrips />
            <h2 className="trail-station__heading">Features</h2>
            <div className="trail-features">
              {FEATURES.map((feature) => (
                <div
                  key={feature}
                  className={
                   "trail-features__item"
                  }
                >
                  {feature}
                </div>
              ))}
            </div>
          </section>
        </Html>
      </group>
    </>
  );
}

export default TrailPathText;

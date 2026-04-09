import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./HorrorLoader.css";

interface HorrorLoaderProps {
  progress: number; // 0-100
  onEnter: () => void;
  onStartAmbient?: () => void;
}

/* ─── Helpers ─── */
const HORROR_QUOTES = [
  "The fort remembers...",
  "No one leaves after sunset...",
  "Can you hear them whisper?",
  "The curse is eternal...",
  "They never left this place...",
  "Some doors should stay closed...",
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

/* ─── WebGL Background (self-contained, no Three.js dep) ─── */
const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_resolution;

  // Simplex-style hash
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float t = u_time * 0.08;

    // Warped fog layers
    float f1 = fbm(uv * 3.0 + vec2(t, t * 0.7));
    float f2 = fbm(uv * 5.0 - vec2(t * 0.5, t * 1.2) + f1 * 0.8);
    float f3 = fbm(uv * 2.0 + vec2(t * 0.3, -t * 0.4) + f2 * 0.6);

    float fog = f1 * 0.4 + f2 * 0.35 + f3 * 0.25;

    // Blood red / dark palette
    vec3 darkColor  = vec3(0.01, 0.0, 0.0);
    vec3 fogColor   = vec3(0.18, 0.02, 0.02);
    vec3 glowColor  = vec3(0.35, 0.03, 0.01);

    vec3 col = mix(darkColor, fogColor, fog);

    // Central eerie glow
    float dist = length((uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0));
    float glow = exp(-dist * 3.5) * (0.3 + 0.15 * sin(u_time * 0.5));
    col += glowColor * glow;

    // Occasional "pulse" from below
    float bottomGlow = smoothstep(0.3, 0.0, uv.y) * 0.08 * (0.5 + 0.5 * sin(u_time * 0.3));
    col += vec3(0.25, 0.0, 0.0) * bottomGlow;

    // darkness at edges
    float vignette = 1.0 - smoothstep(0.3, 0.9, dist);
    col *= vignette;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function useWebGLBackground(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    // Compile shaders
    function compileShader(src: string, type: number) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const vs = compileShader(VERT, gl.VERTEX_SHADER);
    const fs = compileShader(FRAG, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");

    let raf = 0;
    const t0 = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5); // cap for perf
      canvas!.width = canvas!.clientWidth * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const elapsed = (performance.now() - t0) / 1000;
      gl!.uniform1f(uTime, elapsed);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

/* ─── Main Component ─── */
export default function HorrorLoader({
  progress,
  onEnter,
  onStartAmbient,
}: HorrorLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quote, setQuote] = useState(HORROR_QUOTES[0]);
  const [fadeOut, setFadeOut] = useState(false);
  const quoteInterval = useRef<ReturnType<typeof setInterval>>(null);

  useWebGLBackground(canvasRef);

  // Rotate horror quotes
  useEffect(() => {
    quoteInterval.current = setInterval(() => {
      setQuote(HORROR_QUOTES[Math.floor(Math.random() * HORROR_QUOTES.length)]);
    }, 3500);
    return () => {
      if (quoteInterval.current) clearInterval(quoteInterval.current);
    };
  }, []);

  const isLoaded = progress >= 100;

  const handleEnter = useCallback(() => {
    onStartAmbient?.();
    setFadeOut(true);
    setTimeout(onEnter, 1200); // match CSS transition
  }, [onEnter, onStartAmbient]);

  // Generate blood drips under the progress bar (stable across renders)
  const drips = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        left: `${15 + i * 14 + randomBetween(-3, 3)}%`,
        duration: `${randomBetween(1.8, 3.5)}s`,
        delay: `${randomBetween(0, 2)}s`,
        height: `${randomBetween(8, 20)}px`,
      })),
    []
  );

  // Floating embers (stable across renders)
  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: `${randomBetween(0, 100)}%`,
        size: `${randomBetween(1, 4)}px`,
        duration: `${randomBetween(6, 14)}s`,
        delay: `${randomBetween(0, 8)}s`,
        drift: `${randomBetween(-40, 40)}px`,
        opacity: randomBetween(0.2, 0.6),
      })),
    []
  );

  return (
    <div className={`horror-loader ${fadeOut ? "fade-out" : ""}`}>
      {/* WebGL background */}
      <canvas ref={canvasRef} className="horror-loader__canvas" />

      {/* Fog overlays */}
      <div className="horror-loader__fog" />
      <div className="horror-loader__vignette" />

      {/* Floating particles */}
      <div className="horror-loader__particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="horror-loader__particle"
            style={{
              left: p.left,
              ["--p-size" as string]: p.size,
              ["--p-duration" as string]: p.duration,
              ["--p-delay" as string]: p.delay,
              ["--p-drift" as string]: p.drift,
              ["--p-opacity" as string]: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Scan lines */}
      <div className="horror-loader__scanlines" />

      {/* Lightning flash */}
      <div className="horror-loader__flash" />

      {/* Content */}
      <div className="horror-loader__content">
        {/* Title */}
        <h1 className="horror-loader__title">Bhangarh Fort</h1>

        {/* Quote */}
        <p className="horror-loader__subtitle">{quote}</p>

        {/* Progress */}
        <div className="horror-loader__progress-wrap">
          <div className="horror-loader__bar-outer">
            <div
              className="horror-loader__bar-inner"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
            {/* Blood drips */}
            <div className="horror-loader__drips">
              {drips.map((d, i) => (
                <div
                  key={i}
                  className="horror-loader__drip"
                  style={{
                    left: d.left,
                    ["--drip-duration" as string]: d.duration,
                    ["--drip-delay" as string]: d.delay,
                    ["--drip-height" as string]: d.height,
                  }}
                />
              ))}
            </div>
          </div>

          <span className="horror-loader__percent">
            {Math.floor(progress)}%
          </span>
        </div>

        {/* Enter / Status */}
        {isLoaded ? (
          <button className="horror-loader__enter" onClick={handleEnter}>
            Enter if you dare
          </button>
        ) : (
          <span className="horror-loader__warning">
            Summoning the spirits...
          </span>
        )}
      </div>
    </div>
  );
}

export const FORT_TRANSFORM = {
  scale: 100,
  position: [-20, 18.4, -550] as [number, number, number],
  rotation: [Math.PI / 2 + 0.095, -Math.PI / 2, Math.PI / 2 + 0.015] as [
    number,
    number,
    number,
  ],
};

export const FORT_WINDOW_SPIRIT_TRANSFORM = {
  position: [-0.005, 0.02, -0.086] as [number, number, number],
  rotation: [0, Math.PI / 2, 0] as [number, number, number],
  scale: 0.01,
};

export const FORT_WINDOW_SPIRIT_POSITIONS = [
  [-0.005, 0.02, -0.086],
  [-0.23, 0.05, 0.375],
  [-0.2, 0.05, -0.2],
] as [number, number, number][];

export const FORT_WINDOW_SPIRIT_MOHINI = {
  position: [0.14, -0.16, -0.175] as [number, number, number],
  rotation: [0, Math.PI / 0.5, 0] as [number, number, number],
  scale: 0.051,
};

export const FORT_WINDOW_GLOW = {
  position: [0.18, 0.13, 0.11] as [number, number, number],
  color: "#a8c8ff",
  intensity: 7,
  distance: 10,
};

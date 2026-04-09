/**
 * Returns a random float in [min, max).
 */
export const randomRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

/**
 * Returns a random integer in [min, max] (inclusive).
 */
export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

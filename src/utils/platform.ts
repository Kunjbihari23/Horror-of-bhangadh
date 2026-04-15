/**
 * Returns true if running on iOS Safari (iPhone/iPad).
 * Used to apply reduced-quality settings to avoid WebGL crashes.
 */
export const isIOS = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad on iOS 13+ reports as MacIntel with touch
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export const isMaxWidthCorrect = (
  mobileWidthThreshold: unknown
): mobileWidthThreshold is number =>
  typeof mobileWidthThreshold === "number" &&
  // Number.isFinite is not supported in IE
  isFinite(mobileWidthThreshold);

export const isMobileViewport = (
  viewport: Window,
  mobileWidthThreshold: number | null
): boolean =>
  isMaxWidthCorrect(mobileWidthThreshold) &&
  viewport.innerWidth <= mobileWidthThreshold;

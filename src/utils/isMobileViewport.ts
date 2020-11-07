import { isPositiveNumber } from "./isNumber";

export const isMobileViewport = (
  viewport: Window,
  mobileWidthThreshold: number | null
): boolean =>
  isPositiveNumber(mobileWidthThreshold) &&
  viewport.innerWidth <= mobileWidthThreshold;

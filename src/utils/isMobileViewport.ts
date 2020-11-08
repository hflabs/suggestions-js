import { isPositiveNumber } from "./isNumber";

export const isMobileViewport = (
  viewport: Pick<Window, "innerWidth">,
  mobileWidthThreshold: number | null
): boolean =>
  isPositiveNumber(mobileWidthThreshold) &&
  viewport.innerWidth <= mobileWidthThreshold;

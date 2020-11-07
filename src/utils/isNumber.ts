export const isNumber = (n: unknown): n is number => typeof n === "number";

export const isFiniteNumber = (n: unknown): n is number =>
  isNumber(n) && isFinite(n);

export const isPositiveNumber = (n: unknown): n is number =>
  isFiniteNumber(n) && n > 0;

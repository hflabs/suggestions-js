import { isFiniteNumber, isNumber, isPositiveNumber } from "./isNumber";

describe("isNumber()", () => {
  it("should return true for numbers", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(1)).toBe(true);
    expect(isNumber(NaN)).toBe(true);
    expect(isNumber(Infinity)).toBe(true);
  });

  it("should return false for Number objects", () => {
    expect(isNumber(new Number(0))).toBe(false);
  });

  it("should return false for values coerced to number", () => {
    expect(isNumber("")).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber(false)).toBe(false);
  });
});

describe("isFiniteNumber()", () => {
  it("should return true for finite numbers", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(Number.MAX_VALUE)).toBe(true);
  });

  it("should return false for not finite numbers", () => {
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(NaN)).toBe(false);
  });
});

describe("isPositiveNumber()", () => {
  it("should return true for positive numbers", () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.0001)).toBe(true);
  });

  it("should return false for zero", () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-0)).toBe(false);
  });

  it("should return false for negative numbers", () => {
    expect(isPositiveNumber(-1)).toBe(false);
  });

  it("should return false for non numerical numbers", () => {
    expect(isPositiveNumber(Infinity)).toBe(false);
    expect(isPositiveNumber(NaN)).toBe(false);
  });
});

import { invoke } from "./invoke";

describe("invoke()", () => {
  it("should invoke function with arguments", () => {
    const fn = jest.fn();
    invoke(fn, 1, "two", /three/);
    expect(fn).toHaveBeenCalledWith(1, "two", /three/);
  });

  it("should return function's results", () => {
    expect(invoke(Math.max, 1, 2, 3)).toBe(3);
  });

  it("should not fail if passed not a function", () => {
    expect(() => invoke(1, 2)).not.toThrow();
  });

  it("should return undefined if passed not a function", () => {
    expect(invoke(1, 2)).toBeUndefined();
  });
});

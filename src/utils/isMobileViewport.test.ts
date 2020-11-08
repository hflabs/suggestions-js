import { isMobileViewport } from "./isMobileViewport";

describe("isMobileViewport()", () => {
  const { innerWidth } = window;

  it("should return false for wide screens", () => {
    expect(isMobileViewport(window, innerWidth - 1)).toBe(false);
  });

  it("should return true for narrow screens", () => {
    expect(isMobileViewport(window, innerWidth + 1)).toBe(true);
  });

  it("should return false for not-positive threshold", () => {
    expect(isMobileViewport(window, null));
  });
});

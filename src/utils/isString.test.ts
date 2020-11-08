import { isString } from "./isString";

describe("isString()", () => {
  it("should return true for string", () => {
    expect(isString("123")).toBe(true);
  });

  it("should return false for String objects", () => {
    expect(isString(new String("123"))).toBe(false);
  });

  it("should return false for non-string values", () => {
    expect(isString(123)).toBe(false);
  });
});

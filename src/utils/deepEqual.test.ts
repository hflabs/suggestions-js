import { deepEqual } from "./deepEqual";

describe("deepEqual", () => {
  it("should compare primitives", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, Object(1))).toBe(false);
    expect(deepEqual(1, "1")).toBe(false);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual(0, -0)).toBe(true);
    expect(deepEqual(0, "0")).toBe(false);
    expect(deepEqual(0, null)).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual("a", "b")).toBe(false);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(false, false)).toBe(true);
    expect(deepEqual(true, false)).toBe(false);
    expect(deepEqual(true, "true")).toBe(false);
    expect(deepEqual(true, 1)).toBe(false);
    expect(deepEqual(false, 0)).toBe(false);
    expect(deepEqual(Symbol("a"), Symbol("a"))).toBe(true);
    expect(deepEqual(Symbol("a"), Symbol("b"))).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
  });

  it("should compare arrays", () => {
    expect(
      deepEqual(
        [true, null, 1, "a", undefined],
        [true, null, 1, "a", undefined]
      )
    ).toBe(true);
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("should compare sparse arrays", () => {
    const array = new Array(1);

    expect(deepEqual(array, new Array(1))).toBe(true);
    expect(deepEqual(array, [undefined])).toBe(true);
    expect(deepEqual(array, new Array(2))).toBe(false);
  });

  it("should compare plain objects", () => {
    expect(
      deepEqual(
        { a: true, b: null, c: 1, d: "a", e: undefined },
        { a: true, b: null, c: 1, d: "a", e: undefined }
      )
    ).toBe(true);

    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, f: 2 })).toBe(false);
  });

  it("should compare objects regardless of key order", () => {
    expect(deepEqual({ a: 1, b: 2, c: 3 }, { c: 3, a: 1, b: 2 })).toBe(true);
  });

  it("should compare nested objects", function () {
    expect(
      deepEqual(
        {
          a: [1, 2, 3],
          b: true,
          c: "a",
          d: Symbol("a"),
          e: {
            f: ["a", "b", "c"],
            g: false,
          },
        },
        {
          a: [1, 2, 3],
          b: true,
          c: "a",
          d: Symbol("a"),
          e: {
            f: ["a", "b", "c"],
            g: false,
          },
        }
      )
    ).toBe(true);

    expect(
      deepEqual(
        {
          a: [1, 2, 3],
          b: {
            c: ["a", "b", "c"],
            d: false,
          },
        },
        {
          a: [1, 2, 30000],
          b: {
            c: ["a", "b", "c"],
            d: false,
          },
        }
      )
    ).toBe(false);
  });
});

import { noop } from "./noop";

describe("noop()", () => {
  it("should not expect arguments", () => {
    expect(noop.length).toBe(0);
  });

  it("should not return anything", () => {
    expect(noop()).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(noop(1, "a", { b: "c" })).toBeUndefined();
  });
});

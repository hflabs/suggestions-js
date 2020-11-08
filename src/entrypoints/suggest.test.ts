import { execMethod, init } from "./suggest";
import { ERROR_NOT_INITIALIZED } from "../errors";
import "@testing-library/jest-dom";

describe("entrypoint findById", () => {
  let el: HTMLInputElement;

  beforeEach(() => {
    el = document.body.appendChild(document.createElement("input"));
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  it("init() should use initInstance", () => {
    expect(typeof init(el, { type: "some-type" })).toBe("function");
  });

  it("execMethod() should use execInstanceMethod", async () => {
    const result = execMethod(el, "fixData");

    expect(result).toBeInstanceOf(Promise);
    await expect(result).rejects.toThrow(ERROR_NOT_INITIALIZED);
  });
});

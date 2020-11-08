import { isCursorAtEnd, setCursorAtEnd } from "./cursor";

describe("cursor", () => {
  let input: HTMLInputElement;

  beforeEach(() => {
    input = document.body.appendChild(document.createElement("input"));
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("setCursorAtEnd()", () => {
    it("should set cursor for text field", () => {
      input.value = "text";
      setCursorAtEnd(input);
      expect(input.selectionStart).toBe(4);
      expect(input.selectionEnd).toBe(4);
    });

    it("should try to reassign value for email field", () => {
      const fn = jest.fn();
      input.type = "email";

      Object.defineProperty(input, "value", {
        get: () => "some text",
        set: fn,
      });

      setCursorAtEnd(input);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenLastCalledWith("some text");
    });
  });

  describe("isCursorAtEnd()", () => {
    it("should return false if element is not focused", () => {
      expect(isCursorAtEnd(input, true)).toBe(false);
    });

    it("should return true if empty element is just focused", () => {
      input.focus();
      expect(isCursorAtEnd(input, false)).toBe(true);
    });

    it("should return true if element with text is just focused", () => {
      input.value = "text";
      input.focus();
      expect(isCursorAtEnd(input, false)).toBe(true);
    });

    it("should return false if element with text is focused, but selection changes", () => {
      input.value = "text";
      input.focus();
      input.selectionStart = 1;
      input.selectionEnd = 1;

      expect(isCursorAtEnd(input, true)).toBe(false);
    });

    it("should return fallback for elements not supporting selectionStart", () => {
      input.type = "email";
      input.focus();
      expect(input.selectionStart).toBeNull();
      expect(isCursorAtEnd(input, true)).toBe(true);
      expect(isCursorAtEnd(input, false)).toBe(false);
    });
  });
});

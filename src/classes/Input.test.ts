import Input, {
  EVENT_INPUT_CHANGE,
  EVENT_INPUT_VISIBLE,
  INPUT_ENHANCE_ATTRIBUTES,
  InputInitOptions,
} from "./Input";
import inputSass from "./Input.sass";
import { IntersectionObserverMock } from "../utils/IntersectionObserverMock";
import { noop } from "../utils/noop";

describe("class input", () => {
  let el: HTMLInputElement;

  /**
   * Create Input instance, pass to callback and dispose.
   *
   * @param options
   * @param fn
   */
  const withInput = (
    options: InputInitOptions,
    fn: (input: Input) => void
  ): void => {
    const input = new Input(el, options);
    fn(input);
    input.dispose();
  };

  const initOptions: InputInitOptions = {
    deferRequestBy: 100,
  };

  beforeEach(() => {
    el = document.body.appendChild(document.createElement("input"));
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  it("should set class to input and reset on dispose", () => {
    el.className = "initial-class";
    withInput(
      {
        ...initOptions,
        classNames: {
          input: "external-input-class",
        },
      },
      () => {
        expect(el.className).toContain(
          `initial-class ${inputSass.input} external-input-class`
        );
      }
    );
    expect(el.className).toContain("initial-class");
  });

  it("should set attributes to input", () => {
    withInput(initOptions, () => {
      Object.entries(INPUT_ENHANCE_ATTRIBUTES).forEach(
        ([attributeName, attributeValue]) => {
          expect(el.getAttribute(attributeName)).toBe(attributeValue);
        }
      );
    });
  });

  it("should restore attributes to input on dispose", () => {
    el.setAttribute("autocorrect", "autocorrect is set");

    withInput(initOptions, () => {
      expect(el.getAttribute("autocorrect")).toBe("off");
    });

    expect(el.getAttribute("autocorrect")).toBe("autocorrect is set");
  });

  describe(`should emit "${EVENT_INPUT_CHANGE}" event`, () => {
    const simulateValueChangedWith = (
      el: HTMLInputElement,
      eventName: string
    ) => {
      el.value += eventName;
      el.dispatchEvent(new Event(eventName));
    };

    ["keyup", "cut", "paste", "input"].forEach((eventName) => {
      it(`on "${eventName}"`, () => {
        withInput(initOptions, () => {
          const fn = jest.fn();

          el.addEventListener(EVENT_INPUT_CHANGE, fn);

          jest.useFakeTimers();
          simulateValueChangedWith(el, eventName);

          jest.runAllTimers();
          expect(fn).toHaveBeenCalled();
          jest.useRealTimers();
        });
      });
    });

    it("once per several events", () => {
      withInput(initOptions, () => {
        const fn = jest.fn();

        el.addEventListener(EVENT_INPUT_CHANGE, fn);

        jest.useFakeTimers();
        simulateValueChangedWith(el, "keyup");
        simulateValueChangedWith(el, "input");
        simulateValueChangedWith(el, "cut");
        simulateValueChangedWith(el, "paste");

        setTimeout(() => {
          simulateValueChangedWith(el, "keyup");
          simulateValueChangedWith(el, "input");
          simulateValueChangedWith(el, "cut");
          simulateValueChangedWith(el, "paste");
        }, initOptions.deferRequestBy - 1);

        jest.runAllTimers();
        expect(fn).toHaveBeenCalledTimes(1);
        jest.useRealTimers();
      });
    });

    it(`only if value was changed`, () => {
      withInput(initOptions, () => {
        const fn = jest.fn();

        el.addEventListener(EVENT_INPUT_CHANGE, fn);

        jest.useFakeTimers();

        // Emit event, but leave el.value untouched
        el.dispatchEvent(new Event("keyup"));

        jest.runAllTimers();
        expect(fn).not.toHaveBeenCalled();
        jest.useRealTimers();
      });
    });

    it("on focus then value changed", () => {
      withInput(initOptions, () => {
        const fn = jest.fn();

        el.addEventListener(EVENT_INPUT_CHANGE, fn);

        jest.useFakeTimers();

        el.value += "changed";
        el.dispatchEvent(new FocusEvent("focus"));

        jest.runAllTimers();

        expect(fn).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
      });
    });
  });

  describe(`should emit "${EVENT_INPUT_VISIBLE}" event`, () => {
    describe("with IntersectionObserver", () => {
      const { IntersectionObserver } = window;

      beforeEach(() => {
        // Mock IntersectionObserver
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.IntersectionObserver = IntersectionObserverMock;
      });

      afterEach(() => {
        window.IntersectionObserver = IntersectionObserver;
      });

      it("when element intersects viewport", () => {
        const fn = jest.fn();

        el.addEventListener(EVENT_INPUT_VISIBLE, fn);

        withInput(initOptions, () => {
          // Trigger elements is not visible
          IntersectionObserverMock.intersectElement(el, 0);

          expect(fn).not.toHaveBeenCalled();

          // Trigger elements is visible
          IntersectionObserverMock.intersectElement(el, 1);

          expect(fn).toHaveBeenCalled();
        });
      });

      it("only if element intersects viewport before disposed", () => {
        const fn = jest.fn();

        el.addEventListener(EVENT_INPUT_VISIBLE, fn);

        // Create and dispose Input instance
        withInput(initOptions, noop);

        // Trigger elements is visible
        IntersectionObserverMock.intersectElement(el, 1);

        expect(fn).not.toHaveBeenCalled();
      });
    });

    describe("with .offsetParent", () => {
      it("if element is initially visible", () => {
        const fn = jest.fn();

        // Override .offsetParent
        Object.defineProperty(el, "offsetParent", {
          get: () => document.body,
        });

        el.addEventListener(EVENT_INPUT_VISIBLE, fn);

        withInput(initOptions, () => {
          expect(fn).toHaveBeenCalled();
        });
      });

      it("if element is not initially visible", () => {
        const fn = jest.fn();
        let offsetParent: Element | null = null;

        // Override .offsetParent
        Object.defineProperty(el, "offsetParent", {
          get: () => offsetParent,
        });

        el.addEventListener(EVENT_INPUT_VISIBLE, fn);

        jest.useFakeTimers();
        withInput(initOptions, () => {
          expect(fn).not.toHaveBeenCalled();

          // simulate becoming element visible in 5 sec
          setTimeout(() => {
            offsetParent = document.body;
          }, 10);

          jest.runAllTimers();

          expect(fn).toHaveBeenCalled();
        });
        jest.useRealTimers();
      });

      it("only if input was not disposed before", () => {
        const fn = jest.fn();
        let offsetParent: Element | null = null;

        // Override .offsetParent
        Object.defineProperty(el, "offsetParent", {
          get: () => offsetParent,
        });

        el.addEventListener(EVENT_INPUT_VISIBLE, fn);

        jest.useFakeTimers();

        withInput(initOptions, () => {
          offsetParent = document.body;
        });

        jest.runAllTimers();

        expect(fn).not.toHaveBeenCalled();

        jest.useRealTimers();
      });
    });
  });

  it("should get value", () => {
    withInput(initOptions, (input) => {
      el.value = "some text";
      // Focus to cause reading input's value
      el.focus();
      expect(input.getValue()).toBe("some text");
    });
  });

  it("should set value", () => {
    withInput(initOptions, (input) => {
      input.setValue("some text");
      expect(el.value).toBe("some text");
    });
  });

  it("should set temporary value", () => {
    withInput(initOptions, (input) => {
      input.setValue("some text");
      input.suggestValue("suggested value");

      expect(el.value).toBe("suggested value");
      expect(input.getValue()).toBe("some text");
    });
  });

  it("should reset temporary value", () => {
    withInput(initOptions, (input) => {
      input.setValue("some text");
      input.suggestValue("suggested value");

      expect(el.value).toBe("suggested value");
      input.suggestValue(null);
      expect(el.value).toBe("some text");
    });
  });
});

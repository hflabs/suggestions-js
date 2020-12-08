import Input, {
  EVENT_INPUT_CHANGE,
  EVENT_INPUT_VISIBLE,
  INPUT_ENHANCE_ATTRIBUTES,
  InputInitOptions,
} from "./Input";
import inputSass from "./Input.sass";
import { IntersectionObserverMock } from "../utils/IntersectionObserverMock";
import { noop } from "../utils/noop";
import { withFakeTimers } from "../../testUtils/withFakeTimers";

describe("class input", () => {
  let el: HTMLInputElement;

  const initOptions: InputInitOptions = {
    deferRequestBy: 100,
  };

  /**
   * Create Input instance, pass to callback and dispose.
   *
   * @param options
   * @param fn
   */
  const withInput = (
    options: Partial<InputInitOptions> | null,
    fn: (input: Input) => void
  ): void => {
    const input = new Input(el, { ...initOptions, ...options });
    fn(input);
    input.dispose();
  };

  beforeEach(() => {
    el = document.body.appendChild(document.createElement("input"));
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  it("should set class to input", () => {
    el.className = "initial-class";
    withInput(
      {
        classNames: {
          input: "external-input-class",
        },
      },
      () => {
        expect(el.className).toEqual(
          `initial-class ${inputSass.input} external-input-class`
        );
      }
    );
  });

  it("should reset class from input on dispose", () => {
    el.className = "initial-class";
    withInput(
      {
        classNames: {
          input: "external-input-class",
        },
      },
      noop
    );
    expect(el.className).toEqual("initial-class");
  });

  it("should set attributes to input", () => {
    withInput(null, () => {
      Object.entries(INPUT_ENHANCE_ATTRIBUTES).forEach(
        ([attributeName, attributeValue]) => {
          expect(el.getAttribute(attributeName)).toBe(attributeValue);
        }
      );
    });
  });

  it("should restore attributes to input on dispose", () => {
    el.setAttribute("autocorrect", "autocorrect is set");

    withInput(null, noop);

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
        withInput(null, () => {
          const onChange = jest.fn();

          el.addEventListener(EVENT_INPUT_CHANGE, onChange);

          withFakeTimers(() => {
            simulateValueChangedWith(el, eventName);

            jest.runAllTimers();
            expect(onChange).toHaveBeenCalled();
          });
        });
      });
    });

    it("once per several events", () => {
      withInput(null, () => {
        const onChange = jest.fn();

        el.addEventListener(EVENT_INPUT_CHANGE, onChange);

        withFakeTimers(() => {
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
          expect(onChange).toHaveBeenCalledTimes(1);
        });
      });
    });

    it(`only if value was changed`, () => {
      withInput(null, () => {
        const onChange = jest.fn();

        el.addEventListener(EVENT_INPUT_CHANGE, onChange);

        withFakeTimers(() => {
          // Emit event, but leave el.value untouched
          el.dispatchEvent(new Event("keyup"));

          jest.runAllTimers();
          expect(onChange).not.toHaveBeenCalled();
        });
      });
    });

    it("on focus then value changed", () => {
      withInput(null, () => {
        const onChange = jest.fn();

        el.addEventListener(EVENT_INPUT_CHANGE, onChange);

        withFakeTimers(() => {
          el.value += "changed";
          el.dispatchEvent(new FocusEvent("focus"));

          jest.runAllTimers();

          expect(onChange).toHaveBeenCalledTimes(1);
        });
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
        const onVisible = jest.fn();

        el.addEventListener(EVENT_INPUT_VISIBLE, onVisible);

        withInput(null, () => {
          // Trigger elements is not visible
          IntersectionObserverMock.intersectElement(el, 0);

          expect(onVisible).not.toHaveBeenCalled();

          // Trigger elements is visible
          IntersectionObserverMock.intersectElement(el, 1);

          expect(onVisible).toHaveBeenCalled();
        });
      });

      it("only if element intersects viewport before disposed", () => {
        const onVisible = jest.fn();

        el.addEventListener(EVENT_INPUT_VISIBLE, onVisible);

        // Create and dispose Input instance
        withInput(null, noop);

        // Trigger elements is visible
        IntersectionObserverMock.intersectElement(el, 1);

        expect(onVisible).not.toHaveBeenCalled();
      });
    });

    describe("with .offsetParent", () => {
      it("if element is initially visible", () => {
        const onVisible = jest.fn();

        // Override .offsetParent
        Object.defineProperty(el, "offsetParent", {
          get: () => document.body,
        });

        el.addEventListener(EVENT_INPUT_VISIBLE, onVisible);

        withInput(null, () => {
          expect(onVisible).toHaveBeenCalled();
        });
      });

      it("if element is not initially visible", () => {
        const onVisible = jest.fn();
        let offsetParent: Element | null = null;

        // Override .offsetParent
        Object.defineProperty(el, "offsetParent", {
          get: () => offsetParent,
        });

        el.addEventListener(EVENT_INPUT_VISIBLE, onVisible);

        withFakeTimers(() => {
          withInput(null, () => {
            expect(onVisible).not.toHaveBeenCalled();

            // simulate becoming element visible in 5 sec
            setTimeout(() => {
              offsetParent = document.body;
            }, 10);

            jest.runAllTimers();

            expect(onVisible).toHaveBeenCalled();
          });
        });
      });

      it("only if input was not disposed before", () => {
        const onVisible = jest.fn();
        let offsetParent: Element | null = null;

        // Override .offsetParent
        Object.defineProperty(el, "offsetParent", {
          get: () => offsetParent,
        });

        el.addEventListener(EVENT_INPUT_VISIBLE, onVisible);

        withFakeTimers(() => {
          withInput(null, () => {
            offsetParent = document.body;
          });

          jest.runAllTimers();

          expect(onVisible).not.toHaveBeenCalled();
        });
      });
    });
  });

  it("should get value", () => {
    withInput(null, (input) => {
      el.value = "some text";
      expect(input.getValue()).toBe("some text");
    });
  });

  it("should set value", () => {
    withInput(null, (input) => {
      input.setValue("some text");
      expect(el.value).toBe("some text");
    });
  });

  it("should set temporary value", () => {
    withInput(null, (input) => {
      input.setValue("some text");
      input.suggestValue("suggested value");

      expect(el.value).toBe("suggested value");
      expect(input.getValue()).toBe("some text");
    });
  });

  it("should reset temporary value", () => {
    withInput(null, (input) => {
      input.setValue("some text");
      input.suggestValue("suggested value");

      expect(el.value).toBe("suggested value");
      input.suggestValue(null);
      expect(el.value).toBe("some text");
    });
  });
});

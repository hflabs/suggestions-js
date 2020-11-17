import {
  clearFunctionOptions,
  createInstancesStore,
  disposeInstance,
  execInstanceMethod,
  initInstance,
  instances,
} from "./instances";
import ImplementationBase from "./classes/Implementations/ImplementationBase";
import Suggestions from "./classes/Suggestions";
import { noop } from "./utils/noop";
import { ERROR_NOT_INITIALIZED, ERROR_OPTION_TYPE_IS_REQUIRED } from "./errors";

// Use real class above abstract
class ImplementationMock extends ImplementationBase<unknown> {
  public mockMethod(a: number): number {
    return a + a;
  }
}

describe("instances", () => {
  let el: HTMLInputElement;

  beforeEach(() => {
    el = document.body.appendChild(document.createElement("input"));
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  describe("createInstancesStore()", () => {
    it("should create a WeakMap to store instances", () => {
      expect(createInstancesStore()).toBeInstanceOf(WeakMap);
    });

    it("should create a Map to store instances if WeakMap unavailable", () => {
      const { WeakMap } = window;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.WeakMap = null;
      expect(createInstancesStore()).toBeInstanceOf(Map);

      window.WeakMap = WeakMap;
    });
  });

  describe("initInstance()", () => {
    it("should fail if no options provided", () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        initInstance(el);
      }).toThrow(ERROR_OPTION_TYPE_IS_REQUIRED);
    });

    it('should fail if no "type" option provided', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        initInstance(el, {});
      }).toThrow(ERROR_OPTION_TYPE_IS_REQUIRED);
    });

    it("should create Suggestion", () => {
      initInstance(el, { type: "some-type" }, ImplementationMock);
      expect(instances.get(el)).toBeInstanceOf(Suggestions);
    });

    it("should return dispose callback", () => {
      const dispose = initInstance(
        el,
        { type: "some-type" },
        ImplementationMock
      );

      expect(typeof dispose).toBe("function");
    });

    it("should dispose on dispose callback call", () => {
      const dispose = initInstance(
        el,
        { type: "some-type" },
        ImplementationMock
      );

      dispose();
      expect(instances.has(el)).toBe(false);
    });

    it("should dispose previous instance", () => {
      initInstance(el, { type: "some-type" }, ImplementationMock);

      const instance = instances.get(el);

      expect(instance).toBeTruthy();
      if (instance) {
        const instanceDispose = jest.spyOn(instance, "dispose");

        initInstance(el, { type: "some-another-type" }, ImplementationMock);

        expect(instances.get(el)).not.toBe(instance);
        expect(instanceDispose).toHaveBeenCalled();
      }
    });
  });

  it("clearFunctionOptions() should not allow to set non-functions to functional options", () => {
    expect(
      clearFunctionOptions({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        onSelect: 123,
        onSelectNothing: noop,
      })
    ).toEqual({
      formatSelected: null,
      isQueryRequestable: null,
      isSuggestionDataComplete: null,
      onInvalidateSelection: null,
      onSearchComplete: null,
      onSearchError: null,
      onSearchStart: null,
      onSelect: null,
      onSelectNothing: noop,
      renderSuggestion: null,
    });
  });

  describe("execInstanceMethod()", () => {
    it("should reject if no instance found for the input", async () => {
      await expect(
        execInstanceMethod<unknown, ImplementationMock>(el, "mockMethod", 1)
      ).rejects.toThrow(ERROR_NOT_INITIALIZED);
    });

    it("should invoke instance's method if instance exists", async () => {
      initInstance(el, { type: "some-type" }, ImplementationMock);
      const instance = instances.get(el);

      expect(instance).toBeTruthy();
      if (instance) {
        const spy = jest
          .spyOn(instance, "invokeImplementationMethod")
          .mockImplementation(
            // No need to follow invokeImplementationMethod()'s signature for mocks
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (method: string, ...args) =>
              Promise.resolve([
                "invokeImplementationMethod invoked with",
                method,
                ...args,
              ])
          );
        const call = execInstanceMethod<unknown, ImplementationMock>(
          el,
          "mockMethod",
          1
        );

        expect(spy).toHaveBeenCalledWith("mockMethod", 1);
        await expect(call).resolves.toEqual([
          "invokeImplementationMethod invoked with",
          "mockMethod",
          1,
        ]);
      }
    });
  });

  describe("disposeInstance", () => {
    it("should not fail if no instance exist", () => {
      expect(() => disposeInstance(el)).not.toThrow();
    });

    it("should dispose instance", () => {
      initInstance(el, { type: "some-type" }, ImplementationMock);
      disposeInstance(el);
      expect(instances.has(el)).toBe(false);
    });
  });
});

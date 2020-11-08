import { InitOptions, Status } from "../types";
import Suggestions from "./Suggestions";
import ImplementationBase, {
  ImplementationBaseOptions,
} from "./Implementations/ImplementationBase";
import sinon, { SinonFakeServer } from "sinon";
import { defaultOptions } from "../defaultOption";
import { EVENT_INPUT_VISIBLE } from "./Input";
import { noop } from "../utils/noop";
import { ERROR_DISPOSED, ERROR_SERVICE_UNAVAILABLE } from "../errors";

describe("class Suggestions", () => {
  let el: HTMLInputElement;

  beforeAll(() => {
    el = document.body.appendChild(document.createElement("input"));
  });

  afterAll(() => {
    document.body.removeChild(el);
  });

  const initOptions = {
    ...defaultOptions,
    noCache: true,
    type: "some-type",
  };

  const withSuggestions = async <
    D = unknown,
    I extends ImplementationBase<D> = ImplementationBase<D>
  >(
    options: InitOptions<D>,
    implementationConstructor: new (
      el: HTMLInputElement,
      options: ImplementationBaseOptions<D>
    ) => I,
    fn: (suggestions: Suggestions<D, I>) => Promise<void>
  ): Promise<void> => {
    const suggestions = new Suggestions<D, I>(
      el,
      implementationConstructor,
      options
    );
    await fn(suggestions);
    suggestions.dispose();
  };

  class ImplementationMock extends ImplementationBase<unknown> {
    public doubleString(s: string): string {
      return s.concat(s);
    }
  }

  const getImplementationMockWithOnCreate = (
    onCreate: (
      el: HTMLInputElement,
      options: ImplementationBaseOptions<unknown>
    ) => void
  ) =>
    class ImplementationMockWithOnCreate extends ImplementationMock {
      constructor(
        el: HTMLInputElement,
        options: ImplementationBaseOptions<unknown>
      ) {
        super(el, options);
        onCreate(el, options);
      }
    };

  let server: SinonFakeServer;

  beforeEach(() => {
    server = sinon.useFakeServer();
  });

  afterEach(() => {
    server.restore();
  });

  const respondWithStatus = async (status: Partial<Status>) => {
    server.respondWith([
      200,
      { "content-type": "application/json" },
      JSON.stringify(status),
    ]);
    server.respond();

    // Allow all promises to resolve
    await new Promise((resolve) => setTimeout(resolve));
  };

  it("should not create implementation immediately", async () => {
    const fn = jest.fn();

    await withSuggestions(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async () => {
        expect(fn).not.toHaveBeenCalled();
        expect(server.requests).toHaveLength(0);
      }
    );
  });

  it("should request for status when element became visible", async () => {
    const fn = jest.fn();

    await withSuggestions(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async () => {
        el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
        expect(server.requests).toHaveLength(1);
        expect(server.requests[0].url).toBe(
          `${defaultOptions.serviceUrl}/status/some-type`
        );
        expect(fn).not.toHaveBeenCalled();
      }
    );
  });

  it("should create implementation when status.search is true", async () => {
    const fn = jest.fn();

    await withSuggestions(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async () => {
        el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
        await respondWithStatus({ search: true });

        expect(fn).toHaveBeenCalled();
      }
    );
  });

  it("should not create implementation when status.search is false", async () => {
    const fn = jest.fn();

    await withSuggestions(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async () => {
        el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
        await respondWithStatus({ search: false });

        expect(fn).not.toHaveBeenCalled();
      }
    );
  });

  it("should emit onSearchError() callback if request for status failed", async () => {
    const onSearchError = jest.fn();

    await withSuggestions(
      { ...initOptions, onSearchError: onSearchError },
      ImplementationMock,
      async () => {
        el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
        await respondWithStatus({ search: false });

        expect(onSearchError).toHaveBeenCalledWith(
          new Error(ERROR_SERVICE_UNAVAILABLE),
          null,
          el
        );
      }
    );
  });

  it("should allow to invoke public method before implementation is created", async () => {
    const fn = jest.fn();

    await withSuggestions<unknown, ImplementationMock>(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async (suggestions) => {
        // ensure implementation is not created
        expect(fn).not.toHaveBeenCalled();

        expect(() => {
          suggestions
            .invokeImplementationMethod("doubleString", "abc")
            .then(noop, noop);
        }).not.toThrow();
      }
    );
  });

  it("should resolve public method call immediately if implementation is created", async () => {
    const fn = jest.fn();

    await withSuggestions<unknown, ImplementationMock>(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async (suggestions) => {
        el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
        await respondWithStatus({
          search: true,
        });

        expect(fn).toHaveBeenCalled();

        await expect(
          suggestions.invokeImplementationMethod("doubleString", "abc")
        ).resolves.toBe("abcabc");
      }
    );
  });

  it("should resolve public method call later when implementation is created", async () => {
    const fn = jest.fn();

    await withSuggestions<unknown, ImplementationMock>(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async (suggestions) => {
        const resolved = jest.fn();

        suggestions
          .invokeImplementationMethod("doubleString", "abc")
          .then(resolved);

        // Wait all promise resolve (just in case)
        await new Promise((resolve) => setTimeout(resolve));
        expect(resolved).not.toHaveBeenCalled();

        el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
        await respondWithStatus({
          search: true,
        });

        expect(resolved).toHaveBeenCalledWith("abcabc");
      }
    );
  });

  it("should reject public method call if implementation was not created", async () => {
    const fn = jest.fn();
    let call: Promise<string> | undefined;

    await withSuggestions<unknown, ImplementationMock>(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async (suggestions) => {
        call = suggestions.invokeImplementationMethod("doubleString", "abc");
      }
    );

    expect(fn).not.toHaveBeenCalled();

    await expect(call).rejects.toThrow(ERROR_DISPOSED);
  });

  it("should reject public method call if implementation's method failed", async () => {
    const fn = jest.fn();

    await withSuggestions<unknown, ImplementationMock>(
      initOptions,
      getImplementationMockWithOnCreate(fn),
      async (suggestions) => {
        const call = suggestions.invokeImplementationMethod(
          "doubleString",
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          123
        );

        // Avoid uncaught promise rejection
        call.catch(noop);

        el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
        await respondWithStatus({ search: true });

        await expect(call).rejects.toThrow("s.concat is not a function");
      }
    );
  });

  it("should avoid unnecessary requests for status", async () => {
    const fn = jest.fn();

    Suggestions.clearStatusCache();

    // Create 10 same instances
    for (let i = 0; i < 10; i++) {
      await withSuggestions(
        { ...initOptions, noCache: false },
        getImplementationMockWithOnCreate(fn),
        async () => {
          el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
          await respondWithStatus({ search: true });
        }
      );
    }

    expect(server.requests).toHaveLength(1);
  });
});

import { InitOptions } from "../types";
import Suggestions from "./Suggestions";
import ImplementationBase, {
  ImplementationBaseOptions,
} from "./Implementations/ImplementationBase";
import sinon, { SinonFakeServer } from "sinon";
import { defaultOptions } from "../defaultOption";
import { EVENT_INPUT_VISIBLE } from "./Input";
import { noop } from "../utils/noop";
import { ERROR_DISPOSED, ERROR_SERVICE_UNAVAILABLE } from "../errors";
import { respondWithStatus } from "../../testUtils/withFakeServer";
import { waitPromisesResolve } from "../../testUtils/waitPromisesResolve";
import { withEl } from "../../testUtils/withEl";

describe("class Suggestions", () => {
  let el: HTMLInputElement;
  let server: SinonFakeServer;

  beforeAll(() => {
    el = document.body.appendChild(document.createElement("input"));
  });

  afterAll(() => {
    document.body.removeChild(el);
  });

  beforeEach(() => {
    server = sinon.useFakeServer();
  });

  afterEach(() => {
    server.restore();
  });

  class ImplementationMock<SuggestionData> extends ImplementationBase<
    SuggestionData
  > {
    public doubleString(s: string): string {
      return s.concat(s);
    }
  }

  /**
   * Create temporary Suggestions instance
   * @param {Partial<InitOptions>} options override initOptions
   * @param fn
   */
  const withSuggestions = async <
    SuggestionData = unknown,
    Implementation extends ImplementationBase<
      SuggestionData
    > = ImplementationMock<SuggestionData>
  >(
    options: Partial<InitOptions<SuggestionData>> | null,
    fn: (
      suggestions: Suggestions<SuggestionData, Implementation>,
      onCreate: jest.Mock
    ) => Promise<void>
  ): Promise<void> => {
    const onCreate = jest.fn();
    const suggestions = new Suggestions<SuggestionData, Implementation>(
      el,
      class extends ImplementationMock<SuggestionData> {
        constructor(
          el: HTMLInputElement,
          options: ImplementationBaseOptions<SuggestionData>
        ) {
          super(el, options);
          onCreate?.(el, options);
        }
      },
      {
        ...defaultOptions,
        noCache: true,
        type: "some-type",
        ...options,
      }
    );
    await fn(suggestions, onCreate);
    suggestions.dispose();
  };

  it("should not create implementation immediately", async () => {
    await withSuggestions(null, async (_, onCreate) => {
      expect(onCreate).not.toHaveBeenCalled();
      expect(server.requests).toHaveLength(0);
    });
  });

  it("should request for status when element became visible", async () => {
    await withSuggestions(null, async () => {
      el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      expect(server.requests).toHaveLength(1);
      expect(server.requests[0].url).toBe(
        `${defaultOptions.serviceUrl}/status/some-type`
      );
    });
  });

  it("should not create implementation when element became visible", async () => {
    await withSuggestions(null, async (_, onCreate) => {
      el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      expect(onCreate).not.toHaveBeenCalled();
    });
  });

  it("should create implementation when status.search is true", async () => {
    await withSuggestions(null, async (_, onCreate) => {
      el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      await respondWithStatus(server, { search: true });

      expect(onCreate).toHaveBeenCalled();
    });
  });

  it("should not create implementation when status.search is false", async () => {
    await withSuggestions(null, async (_, onCreate) => {
      el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      await respondWithStatus(server, { search: false });

      expect(onCreate).not.toHaveBeenCalled();
    });
  });

  it("should emit onSearchError() callback if request for status failed", async () => {
    const onSearchError = jest.fn();

    await withSuggestions({ onSearchError }, async () => {
      el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      await respondWithStatus(server, { search: false });

      expect(onSearchError).toHaveBeenCalledWith(
        new Error(ERROR_SERVICE_UNAVAILABLE),
        null,
        el
      );
    });
  });

  it("should allow to invoke public method before implementation is created", async () => {
    await withSuggestions(null, async (suggestions, onCreate) => {
      // ensure implementation is not created
      expect(onCreate).not.toHaveBeenCalled();

      expect(() => {
        suggestions
          .invokeImplementationMethod("doubleString", "abc")
          .then(noop, noop);
      }).not.toThrow();
    });
  });

  it("should resolve public method call immediately if implementation is created", async () => {
    await withSuggestions(null, async (suggestions, onCreate) => {
      el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      await respondWithStatus(server, { search: true });

      expect(onCreate).toHaveBeenCalled();

      await expect(
        suggestions.invokeImplementationMethod("doubleString", "abc")
      ).resolves.toBe("abcabc");
    });
  });

  it("should resolve public method call later when implementation is created", async () => {
    await withSuggestions(null, async (suggestions) => {
      const resolved = jest.fn();

      suggestions
        .invokeImplementationMethod("doubleString", "abc")
        .then(resolved);

      // Wait all promise resolve (just in case)
      await waitPromisesResolve();
      expect(resolved).not.toHaveBeenCalled();

      el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      await respondWithStatus(server, { search: true });

      expect(resolved).toHaveBeenCalledWith("abcabc");
    });
  });

  it("should reject public method call if implementation was not created", async () => {
    let onImplementationCreate: jest.Mock | undefined;
    let call: Promise<string> | undefined;

    await withSuggestions(null, async (suggestions, onCreate) => {
      onImplementationCreate = onCreate;
      call = suggestions.invokeImplementationMethod("doubleString", "abc");
    });

    expect(onImplementationCreate).not.toHaveBeenCalled();
    await expect(call).rejects.toThrow(ERROR_DISPOSED);
  });

  it("should reject public method call if implementation's method failed", async () => {
    await withSuggestions(null, async (suggestions) => {
      const call = suggestions.invokeImplementationMethod(
        "doubleString",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        123
      );

      // Avoid uncaught promise rejection
      call.catch(noop);

      el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
      await respondWithStatus(server, { search: true });

      await expect(call).rejects.toThrow("s.concat is not a function");
    });
  });

  it("should avoid unnecessary requests for status", async () => {
    Suggestions.clearStatusCache();

    // Create 10 same instances
    for (let i = 0; i < 10; i++) {
      await withEl(async (el) => {
        const instance = new Suggestions(el, ImplementationMock, {
          ...defaultOptions,
          type: "some-type",
          noCache: false,
        });
        el.dispatchEvent(new Event(EVENT_INPUT_VISIBLE));
        await respondWithStatus(server, { search: true });
        instance.dispose();
      });
    }

    expect(server.requests).toHaveLength(1);
  });
});

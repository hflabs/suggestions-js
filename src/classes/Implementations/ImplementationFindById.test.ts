import { ImplementationBaseOptions } from "./ImplementationBase";
import { defaultOptions } from "../../defaultOption";
import Api from "../Api";
import Input from "../Input";
import ImplementationFindById from "./ImplementationFindById";
import sinon, { SinonFakeServer } from "sinon";
import { withFakeTimers } from "../../../testUtils/withFakeTimers";
import { respondWithSuggestions } from "../../../testUtils/withFakeServer";
import { createSuggestions } from "../../../testUtils/createSuggestions";

describe("class ImplementationFindById", () => {
  let el: HTMLInputElement;
  let server: SinonFakeServer;

  beforeEach(() => {
    el = document.body.appendChild(document.createElement("input"));
    server = sinon.useFakeServer();
  });

  afterEach(() => {
    document.body.removeChild(el);
    server.restore();
  });

  const withInstance = (
    customOptions: Partial<ImplementationBaseOptions<unknown>> | null,
    fn: (
      instance: ImplementationFindById<unknown>,
      input: Input
    ) => Promise<void> | void
  ): Promise<void> | void => {
    const options = {
      ...defaultOptions,
      type: "some-type",
      helperElements: [],
      noCache: true,
      ...customOptions,
    };
    const api = new Api(options);
    const input = new Input(el, options);
    const instance = new ImplementationFindById(el, {
      ...options,
      api,
      input,
    });

    const cleanup = () => instance.dispose();
    const result = fn(instance, input);

    if (result instanceof Promise) return result.finally(cleanup);

    cleanup();
    return result;
  };

  const simulateInputChange = (value: string) => {
    // Change a value, focus the input to read new value, wait for debouncing to complete
    withFakeTimers(() => {
      el.value = value;
      el.focus();
      jest.runOnlyPendingTimers();
    });
  };

  it("should send a request for suggestion if input value change", () => {
    withInstance({ minLength: 1 }, () => {
      simulateInputChange("some text");

      expect(server.requests).toHaveLength(1);
    });
  });

  it("should not send a request if input value changed but not requestable", () => {
    withInstance({ minLength: 100 }, () => {
      simulateInputChange("some text");

      expect(server.requests).toHaveLength(0);
    });
  });

  it("should trigger onSelect if request succeeded", async () => {
    const onSelect = jest.fn();

    await withInstance(
      {
        minLength: 1,
        onSelect,
      },
      async () => {
        const suggestions = createSuggestions(1);

        simulateInputChange("some text");
        await respondWithSuggestions(server, suggestions);

        expect(onSelect).toHaveBeenCalledWith(suggestions[0], true, el);
      }
    );
  });

  it("should not call setCurrentSuggestion if input value changed during request", async () => {
    await withInstance({ minLength: 1 }, async (instance, input) => {
      const setCurrentSuggestion = jest.spyOn(
        instance,
        // Spy on private method
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        "setCurrentSuggestion"
      );

      simulateInputChange("some text");

      expect(server.requests).toHaveLength(1);

      input.setValue("some text changed");

      await respondWithSuggestions(server, []);

      expect(setCurrentSuggestion).not.toHaveBeenCalled();
    });
  });
});

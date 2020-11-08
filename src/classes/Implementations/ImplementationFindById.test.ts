import { ImplementationBaseOptions } from "./ImplementationBase";
import { defaultOptions } from "../../defaultOption";
import Api, { ApiResponseSuggestions } from "../Api";
import Input, { EVENT_INPUT_CHANGE } from "../Input";
import ImplementationFindById from "./ImplementationFindById";
import sinon, { SinonFakeServer } from "sinon";
import { as } from "../../utils/as";
import { Suggestion } from "../../types";

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

  const withInstance = async (
    customOptions: Partial<ImplementationBaseOptions<unknown>> | null,
    fn: (instance: ImplementationFindById<unknown>, input: Input) => void
  ): Promise<void> => {
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

    await fn(instance, input);

    instance.dispose();
  };

  const simulateInputChange = (value: string) => {
    el.value = value;
    el.focus();
    el.dispatchEvent(new Event(EVENT_INPUT_CHANGE));
  };

  const respondWithSuggestion = async <D = unknown>(
    suggestion: Suggestion<D> | null
  ) => {
    server.respondWith([
      200,
      { "Content-type": "application/json" },
      JSON.stringify(
        as<ApiResponseSuggestions<D>>({
          suggestions: suggestion ? [suggestion] : [],
        })
      ),
    ]);
    server.respond();

    // Wait for promises proceeded
    await new Promise((resolve) => setTimeout(resolve));
  };

  it("should send a request for suggestion if input value change", async () => {
    await withInstance({ minLength: 1 }, () => {
      jest.useFakeTimers();
      simulateInputChange("some text");

      jest.runAllTimers();

      expect(server.requests).toHaveLength(1);
      jest.useRealTimers();
    });
  });

  it("should not send a request if input value changed but not requestable", async () => {
    await withInstance({ minLength: 100 }, () => {
      simulateInputChange("some text");

      expect(server.requests).toHaveLength(0);
    });
  });

  it("should trigger onSelect if request succeeded", async () => {
    const onSelect = jest.fn();
    const suggestion: Suggestion<null> = {
      value: "value",
      unrestricted_value: "unrestricted_value",
      data: null,
    };

    await withInstance(
      {
        minLength: 1,
        onSelect,
      },
      async () => {
        simulateInputChange("some text");

        await respondWithSuggestion<null>(suggestion);
      }
    );

    expect(onSelect).toHaveBeenCalledWith(suggestion, true, el);
  });

  it("should not call setCurrentSuggestion if input value changed during request", async () => {
    await withInstance(
      {
        minLength: 1,
      },
      async (instance, input) => {
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

        await respondWithSuggestion(null);

        expect(setCurrentSuggestion).not.toHaveBeenCalled();
      }
    );
  });
});

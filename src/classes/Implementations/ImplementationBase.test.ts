import ImplementationBase, {
  ImplementationBaseOptions,
} from "./ImplementationBase";
import { defaultOptions } from "../../defaultOption";
import Input from "../Input";
import Api, { ApiResponseSuggestions } from "../Api";
import { Suggestion, Suggestions } from "../../types";
import sinon, { SinonFakeServer } from "sinon";
import { as } from "../../utils/as";
import { noop } from "../../utils/noop";
import { ERROR_DISPOSED } from "../../errors";

describe("class ImplementationBase", () => {
  // Define class over abstract, make protected methods public
  class ImplementationTest<D = unknown> extends ImplementationBase<D> {
    public isQueryRequestable(query: string): boolean {
      return super.isQueryRequestable(query);
    }

    public setCurrentSuggestion(suggestion: Suggestion<D> | null): void {
      return super.setCurrentSuggestion(suggestion);
    }

    public getCurrentSuggestion(): Suggestion<D> | null {
      return super.getCurrentSuggestion();
    }

    public fetchSuggestion(
      query: string,
      params?: Record<string, unknown>
    ): Promise<Suggestion<D> | null> {
      return super.fetchSuggestion(query, params);
    }

    public fetchSuggestionTriggeringSearchCallbacks = this.triggeringSearchCallbacks(
      this.fetchSuggestion
    );
  }

  let el: HTMLInputElement;

  beforeEach(() => {
    el = document.body.appendChild(document.createElement("input"));
  });

  afterEach(() => {
    document.body.removeChild(el);
  });

  const withInstance = async (
    customOptions: Partial<ImplementationBaseOptions<unknown>> | null,
    fn: (instance: ImplementationTest) => void
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
    const instance = new ImplementationTest(el, {
      ...options,
      api,
      input,
    });

    await fn(instance);

    instance.dispose();
  };

  describe("isQueryRequestable()", () => {
    it("should return true if no minLength set", async () => {
      await withInstance(
        {
          minLength: undefined,
        },
        (instance) => {
          expect(instance.isQueryRequestable("")).toBe(true);
          expect(instance.isQueryRequestable("some long phrase")).toBe(true);
        }
      );
    });

    it("should return true if query is not less than minLength", async () => {
      await withInstance(
        {
          minLength: 3,
        },
        (instance) => {
          expect(instance.isQueryRequestable("")).toBe(false);
          expect(instance.isQueryRequestable("123")).toBe(true);
          expect(instance.isQueryRequestable("some long phrase")).toBe(true);
        }
      );
    });

    it("should use custom isQueryRequestable() from the options", async () => {
      await withInstance(
        {
          isQueryRequestable: (query: string) => query.includes(" "),
          minLength: 3,
        },
        (instance) => {
          expect(instance.isQueryRequestable("")).toBe(false);
          expect(instance.isQueryRequestable("123")).toBe(false);
          expect(instance.isQueryRequestable("some_long_phrase")).toBe(false);
          expect(instance.isQueryRequestable("phrase with space")).toBe(true);
        }
      );
    });
  });

  describe("setCurrentSuggestion()", () => {
    it("should trigger onSelect when passed a suggestion", async () => {
      const onSelect = jest.fn();
      const suggestion: Suggestion<null> = {
        value: "suggestion value",
        unrestricted_value: "suggestion unrestricted_value",
        data: null,
      };

      await withInstance(
        {
          onSelect,
        },
        (instance) => {
          instance.setCurrentSuggestion(suggestion);
        }
      );

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(suggestion, true, el);
    });

    it("should not trigger onSelect when passed a suggestion same to already selected", async () => {
      const onSelect = jest.fn();
      const suggestion: Suggestion<null> = {
        value: "suggestion value",
        unrestricted_value: "suggestion unrestricted_value",
        data: null,
      };

      await withInstance(
        {
          onSelect,
        },
        (instance) => {
          instance.setCurrentSuggestion(suggestion);
          instance.setCurrentSuggestion(suggestion);
          instance.setCurrentSuggestion(suggestion);
        }
      );

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("should not fail if onSelect is not provided", async () => {
      const suggestion: Suggestion<null> = {
        value: "suggestion value",
        unrestricted_value: "suggestion unrestricted_value",
        data: null,
      };

      await withInstance(null, (instance) => {
        expect(() => instance.setCurrentSuggestion(suggestion)).not.toThrow();
      });
    });

    it("should trigger onSelectNothing when passed null and nothing has been selected before", async () => {
      const onSelectNothing = jest.fn();

      await withInstance(
        {
          onSelectNothing,
        },
        (instance) => {
          instance.setCurrentSuggestion(null);
        }
      );

      expect(onSelectNothing).toHaveBeenCalledTimes(1);
      expect(onSelectNothing).toHaveBeenCalledWith(el.value, el);
    });

    it("should not fail if onSelectNothing is not provided", async () => {
      await withInstance(null, (instance) => {
        expect(() => instance.setCurrentSuggestion(null)).not.toThrow();
      });
    });

    it("should trigger onInvalidateSelection when passed null and there was a selected suggestion", async () => {
      const onInvalidateSelection = jest.fn();
      const suggestion: Suggestion<null> = {
        value: "suggestion value",
        unrestricted_value: "suggestion unrestricted_value",
        data: null,
      };

      await withInstance(
        {
          onInvalidateSelection,
        },
        (instance) => {
          instance.setCurrentSuggestion(suggestion);
          expect(onInvalidateSelection).not.toHaveBeenCalled();
          instance.setCurrentSuggestion(null);
        }
      );

      expect(onInvalidateSelection).toHaveBeenCalledTimes(1);
      expect(onInvalidateSelection).toHaveBeenCalledWith(suggestion, el);
    });

    it("should not fail if onInvalidateSelection is not provided", async () => {
      const suggestion: Suggestion<null> = {
        value: "suggestion value",
        unrestricted_value: "suggestion unrestricted_value",
        data: null,
      };

      await withInstance(null, (instance) => {
        instance.setCurrentSuggestion(suggestion);
        expect(() => instance.setCurrentSuggestion(null)).not.toThrow();
      });
    });
  });

  describe("getCurrentSuggestion()", () => {
    it("should return a previously set suggestion", async () => {
      const suggestion: Suggestion<null> = {
        value: "suggestion value",
        unrestricted_value: "suggestion unrestricted_value",
        data: null,
      };

      await withInstance(null, (instance) => {
        expect(instance.getCurrentSuggestion()).toBe(null);
        instance.setCurrentSuggestion(suggestion);
        expect(instance.getCurrentSuggestion()).toBe(suggestion);
      });
    });
  });

  describe("fetchSuggestion()", () => {
    let server: SinonFakeServer;

    beforeEach(() => {
      server = sinon.useFakeServer();
    });

    afterEach(() => {
      server.restore();
    });

    it("should reject if api failed", async () => {
      await withInstance(null, async (instance) => {
        const call = instance.fetchSuggestion("query");
        server.respond();
        await expect(call).rejects.toThrow("Not Found");

        // Avoid unhandled promise rejection
        call.catch(noop);
      });
    });

    it("should resolve to null is no suggestion found", async () => {
      await withInstance(null, async (instance) => {
        const call = instance.fetchSuggestion("query");

        server.respondWith([
          200,
          { "Content-type": "application/json" },
          JSON.stringify(
            as<ApiResponseSuggestions<unknown>>({
              suggestions: [],
            })
          ),
        ]);
        server.respond();

        await expect(call).resolves.toBe(null);
      });
    });

    it("should resolve to the first suggestion from the list", async () => {
      await withInstance(null, async (instance) => {
        const call = instance.fetchSuggestion("query");
        const suggestions: Suggestions<null> = [
          {
            value: "suggestion 1 value",
            unrestricted_value: "suggestion 1 unrestricted_value",
            data: null,
          },
          {
            value: "suggestion 2 value",
            unrestricted_value: "suggestion 2 unrestricted_value",
            data: null,
          },
        ];

        server.respondWith([
          200,
          { "Content-type": "application/json" },
          JSON.stringify(
            as<ApiResponseSuggestions<unknown>>({ suggestions })
          ),
        ]);
        server.respond();

        await expect(call).resolves.toEqual(suggestions[0]);
      });
    });
  });

  describe("fixData()", () => {
    let server: SinonFakeServer;

    beforeEach(() => {
      server = sinon.useFakeServer();
    });

    afterEach(() => {
      server.restore();
    });

    describe("if query is not requestable", () => {
      const inputValueBeforeTest = "short";
      const minLength = 100;

      beforeEach(() => {
        el.value = inputValueBeforeTest;
      });

      it("should not send a request", async () => {
        await withInstance({ minLength }, () => {
          expect(server.requests).toHaveLength(0);
        });
      });

      it("should resolve with null", async () => {
        await withInstance({ minLength }, async (instance) => {
          await expect(instance.fixData()).resolves.toBe(null);
        });
      });

      it("should not change input value", async () => {
        await withInstance({ minLength }, async (instance) => {
          await instance.fixData();
          expect(el.value === inputValueBeforeTest);
        });
      });
    });

    describe("if query is requestable", function () {
      const inputValueBeforeTest = "abc".repeat(defaultOptions.minLength);

      beforeEach(() => {
        el.value = inputValueBeforeTest;
      });

      it("should send a request", async () => {
        await withInstance(null, (instance) => {
          const call = instance.fixData();

          expect(server.requests).toHaveLength(1);

          call.catch(noop);
        });
      });

      it("should reject if instance disposed before server responds", async () => {
        let call: Promise<Suggestion<unknown> | null> | undefined;

        await withInstance(null, async (instance) => {
          call = instance.fixData();
        });

        await expect(call).rejects.toThrow(ERROR_DISPOSED);
      });

      describe("if no suggestion found", () => {
        beforeEach(() => {
          server.respondWith((xhr) =>
            xhr.respond(
              200,
              { "Content-type": "application/json" },
              JSON.stringify(
                as<ApiResponseSuggestions<unknown>>({
                  suggestions: [],
                })
              )
            )
          );
          server.autoRespond = true;
          server.autoRespondAfter = 0;
        });

        it("should resolve with null", async () => {
          await withInstance(null, async (instance) => {
            await expect(instance.fixData()).resolves.toBe(null);
          });
        });

        it("should reset input value to empty string", async () => {
          await withInstance(null, async (instance) => {
            await instance.fixData();
            expect(el.value).toBe("");
          });
        });

        it("should trigger onSelectNothing", async () => {
          const onSelectNothing = jest.fn();

          await withInstance(
            {
              onSelectNothing,
            },
            async (instance) => {
              await instance.fixData();
            }
          );

          expect(onSelectNothing).toHaveBeenCalled();
        });
      });

      describe("if suggestion found", () => {
        const suggestion: Suggestion<null> = {
          value: "suggested value",
          unrestricted_value: "unrestricted_value value",
          data: null,
        };

        beforeEach(() => {
          server.respondWith((xhr) =>
            xhr.respond(
              200,
              { "Content-type": "application/json" },
              JSON.stringify(
                as<ApiResponseSuggestions<unknown>>({
                  suggestions: [suggestion],
                })
              )
            )
          );
          server.autoRespond = true;
        });

        it("should resolve with suggestion", async () => {
          await withInstance(null, async (instance) => {
            await expect(instance.fixData()).resolves.toEqual(suggestion);
          });
        });

        it("should update input value to suggestion's value", async () => {
          await withInstance(null, async (instance) => {
            await instance.fixData();
            expect(el.value).toBe(suggestion.value);
          });
        });

        it("should trigger onSelect", async () => {
          const onSelect = jest.fn();

          await withInstance(
            {
              onSelect,
            },
            async (instance) => {
              await instance.fixData();
            }
          );

          expect(onSelect).toHaveBeenCalledWith(suggestion, true, el);
        });
      });
    });
  });

  describe("triggeringSearchCallbacks()", () => {
    let server: SinonFakeServer;

    beforeEach(() => {
      server = sinon.useFakeServer();
    });

    afterEach(() => {
      server.restore();
    });

    it("should trigger onSearchStart", async () => {
      const onSearchStart = jest.fn();
      await withInstance({ onSearchStart }, async (instance) => {
        const call = instance.fetchSuggestionTriggeringSearchCallbacks("some");

        expect(onSearchStart).toHaveBeenCalledWith("some", el);

        server.respond();
        await call.catch(noop);
      });
    });

    it("should trigger onSearchStart and change query", async () => {
      await withInstance(
        { onSearchStart: (query: string) => `adjusted ${query}` },
        async (instance) => {
          const call = instance.fetchSuggestionTriggeringSearchCallbacks(
            "something"
          );

          expect(JSON.parse(server.requests[0].requestBody)).toMatchObject({
            query: "adjusted something",
          });

          server.respond();
          await call.catch(noop);
        }
      );
    });

    it("should proceed with original query if onSearchStart returns not a string", async () => {
      await withInstance(
        {
          // Return not a string
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          onSearchStart: (query: string) => query.length,
        },
        async (instance) => {
          const call = instance.fetchSuggestionTriggeringSearchCallbacks(
            "something"
          );

          expect(JSON.parse(server.requests[0].requestBody)).toMatchObject({
            query: "something",
          });

          server.respond();
          await call.catch(noop);
        }
      );
    });

    it("should trigger onSearchError", async () => {
      const onSearchError = jest.fn();
      await withInstance({ onSearchError }, async (instance) => {
        const call = instance.fetchSuggestionTriggeringSearchCallbacks("some");

        server.respond();

        await call.catch(noop);

        expect(onSearchError).toHaveBeenCalledWith(
          new Error("Not Found"),
          "some",
          el
        );
      });
    });

    it("should trigger onSearchComplete", async () => {
      const onSearchComplete = jest.fn();
      await withInstance({ onSearchComplete }, async (instance) => {
        const call = instance.fetchSuggestionTriggeringSearchCallbacks("some");

        server.respondWith([
          200,
          { "Content-type": "application/json" },
          JSON.stringify(
            as<ApiResponseSuggestions<null>>({
              suggestions: [],
            })
          ),
        ]);
        server.respond();

        await call;

        expect(onSearchComplete).toHaveBeenCalledWith([], "some", el);
      });
    });
  });
});

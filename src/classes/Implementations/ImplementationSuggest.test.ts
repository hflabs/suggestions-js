import { ImplementationBaseOptions } from "./ImplementationBase";
import Input from "../Input";
import { defaultOptions } from "../../defaultOption";
import Api from "../Api";
import ImplementationSuggest from "./ImplementationSuggest";
import { respondWithSuggestions } from "../../../testUtils/withFakeServer";
import { createSuggestions } from "../../../testUtils/createSuggestions";
import sinon, { SinonFakeServer } from "sinon";
import popoverSass from "../Popover.sass";
import "@testing-library/jest-dom";
import { waitPromisesResolve } from "../../../testUtils/waitPromisesResolve";
import { setCursorAtEnd } from "../../utils/cursor";
import { withEl } from "../../../testUtils/withEl";
import { withFakeTimers } from "../../../testUtils/withFakeTimers";

describe("class ImplementationSuggest", () => {
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
      instance: ImplementationSuggest<unknown>,
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
    const instance = new ImplementationSuggest(el, {
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
      el.dispatchEvent(new InputEvent("input"));
      // Wait for debounce of handleChange to complete
      jest.runOnlyPendingTimers();
      // Wait for debounce of dispatching EVENT_INPUT_CHANGE to complete
      jest.runOnlyPendingTimers();
    });
  };

  const expectPopoverOpen = () => {
    expect(
      document.getElementsByClassName(popoverSass.popover)[0]
    ).toBeTruthy();
  };

  const expectPopoverClose = () => {
    expect(
      document.getElementsByClassName(popoverSass.popover)[0]
    ).toBeUndefined();
  };

  it("should send a request when input value changed", () => {
    withInstance(null, () => {
      simulateInputChange("some text");

      expect(server.requests).toHaveLength(1);
      expect(JSON.parse(server.requests[0].requestBody)).toMatchObject({
        [defaultOptions.requestParamName]: "some text",
        count: defaultOptions.count,
      });
    });
  });

  it("should not send a request when input value changed but is not requestable", () => {
    withInstance({ minLength: 10 }, () => {
      simulateInputChange("a");

      expect(server.requests).toHaveLength(0);
    });
  });

  it("should send a request when down key pressed", () => {
    withInstance(null, (_, input) => {
      input.setValue("some text");
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

      expect(server.requests).toHaveLength(1);
      expect(JSON.parse(server.requests[0].requestBody)).toMatchObject({
        [defaultOptions.requestParamName]: "some text",
        count: defaultOptions.count,
      });
    });
  });

  it("should open popover when request succeeded with suggestions", async () => {
    await withInstance(null, async () => {
      simulateInputChange("some text");
      await respondWithSuggestions(server, createSuggestions(3));

      expectPopoverOpen();
    });
  });

  it("should open popover when request succeeded with no suggestions", async () => {
    await withInstance(null, async () => {
      simulateInputChange("some text");
      await respondWithSuggestions(server, []);

      expectPopoverOpen();
    });
  });

  it("should close popover when Esc key is pressed", async () => {
    await withInstance(null, async () => {
      simulateInputChange("some text");
      await respondWithSuggestions(server, createSuggestions(3));

      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expectPopoverClose();
    });
  });

  it("should close popover when fetched one suggestion same as selected suggestion", async () => {
    await withInstance({ triggerSelectOnSpace: true }, async () => {
      const suggestions = createSuggestions(3);

      simulateInputChange("some text");
      await respondWithSuggestions(server, suggestions);

      el.focus();
      setCursorAtEnd(el);
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

      // Selecting is async
      await waitPromisesResolve();

      expect(server.requests).toHaveLength(2);
      await respondWithSuggestions(server, [suggestions[0]]);

      expectPopoverClose();
    });
  });

  it("should highlight first suggestion in the list if down key pressed when popover is open", async () => {
    await withInstance(null, async () => {
      simulateInputChange("some text");
      await respondWithSuggestions(server, createSuggestions(3));

      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

      expect(document.getElementsByClassName(popoverSass.item)[0]).toHaveClass(
        popoverSass.isHighlighted
      );
    });
  });

  it("should highlight next suggestion in the list if down key pressed when popover is open", async () => {
    await withInstance(null, async () => {
      const suggestionsCount = 5;

      simulateInputChange("some text");
      await respondWithSuggestions(server, createSuggestions(suggestionsCount));

      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));

      expect(document.getElementsByClassName(popoverSass.item)[1]).toHaveClass(
        popoverSass.isHighlighted
      );
    });
  });

  it("should highlight previous suggestion in the list if up key pressed when popover is open", async () => {
    await withInstance(null, async () => {
      const suggestionsCount = 5;

      simulateInputChange("some text");
      await respondWithSuggestions(server, createSuggestions(suggestionsCount));

      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));

      expect(
        document.getElementsByClassName(popoverSass.item)[suggestionsCount - 2]
      ).toHaveClass(popoverSass.isHighlighted);
    });
  });

  it("should highlight last suggestion in the list if up key pressed when popover is open", async () => {
    await withInstance(null, async () => {
      const suggestionsCount = 5;

      simulateInputChange("some text");
      await respondWithSuggestions(server, createSuggestions(suggestionsCount));

      el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));

      expect(
        document.getElementsByClassName(popoverSass.item)[suggestionsCount - 1]
      ).toHaveClass(popoverSass.isHighlighted);
    });
  });

  it("should highlight the first suggestion in the list if autoHighlightFirst option is true", async () => {
    await withInstance({ autoHighlightFirst: true }, async () => {
      const suggestionsCount = 5;

      simulateInputChange("some text");
      await respondWithSuggestions(server, createSuggestions(suggestionsCount));

      expect(document.getElementsByClassName(popoverSass.item)[0]).toHaveClass(
        popoverSass.isHighlighted
      );
    });
  });

  it("should highlight previously selected suggestion", async () => {
    await withInstance(null, async (instance) => {
      const suggestionsCount = 5;
      const suggestions = createSuggestions(suggestionsCount);

      simulateInputChange("some text");

      const selectedSuggestionsIndex = 2;
      // Set to private property
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      instance.currentSuggestion = suggestions[selectedSuggestionsIndex];

      await respondWithSuggestions(server, suggestions);

      expect(
        document.getElementsByClassName(popoverSass.item)[
          selectedSuggestionsIndex
        ]
      ).toHaveClass(popoverSass.isHighlighted);
    });
  });

  it("should highlight a suggestion with value matching input value", async () => {
    await withInstance(null, async () => {
      const suggestionsCount = 5;
      const suggestions = createSuggestions(suggestionsCount);
      const selectedSuggestionsIndex = 2;

      simulateInputChange(suggestions[selectedSuggestionsIndex].value);
      await respondWithSuggestions(server, suggestions);

      expect(
        document.getElementsByClassName(popoverSass.item)[
          selectedSuggestionsIndex
        ]
      ).toHaveClass(popoverSass.isHighlighted);
    });
  });

  it("should trigger onSelect when suggestion in the list is clicked", async () => {
    const onSelect = jest.fn();

    await withInstance({ onSelect }, async () => {
      const suggestionsCount = 5;
      const suggestions = createSuggestions(suggestionsCount);
      const selectedSuggestionsIndex = 2;

      simulateInputChange(suggestions[selectedSuggestionsIndex].value);
      await respondWithSuggestions(server, suggestions);

      const items = document.getElementsByClassName(popoverSass.item);
      const itemToSelect = items[selectedSuggestionsIndex];

      itemToSelect.dispatchEvent(new MouseEvent("click"));

      // Selecting is async
      await waitPromisesResolve();

      expect(onSelect).toHaveBeenCalledWith(
        suggestions[selectedSuggestionsIndex],
        true,
        el
      );
    });
  });

  it("should trigger onInvalidateSelection when input value change", async () => {
    const onInvalidateSelection = jest.fn();

    await withInstance({ onInvalidateSelection }, async () => {
      const suggestionsCount = 5;
      const suggestions = createSuggestions(suggestionsCount);
      const selectedSuggestionsIndex = 2;

      simulateInputChange(suggestions[selectedSuggestionsIndex].value);
      await respondWithSuggestions(server, suggestions);

      const items = document.getElementsByClassName(popoverSass.item);
      const itemToSelect = items[selectedSuggestionsIndex];

      itemToSelect.dispatchEvent(new MouseEvent("click"));

      // Selecting is async
      await waitPromisesResolve();

      simulateInputChange("some other text");

      expect(onInvalidateSelection).toHaveBeenCalledWith(
        suggestions[selectedSuggestionsIndex],
        el
      );
    });
  });

  it("should trigger onSelectNothing when Enter pressed and no suggestion highlighted", async () => {
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelectNothing,
        triggerSelectOnEnter: true,
      },
      async () => {
        simulateInputChange("some text");
        await respondWithSuggestions(server, createSuggestions(5));

        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelectNothing).toHaveBeenCalledWith(el.value, el);
      }
    );
  });

  it("should trigger onSelect when Enter pressed and some suggestion is highlighted", async () => {
    const onSelect = jest.fn();

    await withInstance(
      {
        onSelect,
        triggerSelectOnEnter: true,
      },
      async () => {
        const suggestions = createSuggestions(5);

        simulateInputChange("some text");
        await respondWithSuggestions(server, suggestions);

        el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).toHaveBeenCalledWith(suggestions[0], true, el);
      }
    );
  });

  it("should not trigger neither onSelect nor onSelectNothing when Enter pressed and triggerSelectOnEnter is false", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelect,
        onSelectNothing,
        triggerSelectOnEnter: false,
      },
      async () => {
        simulateInputChange("some text");
        await respondWithSuggestions(server, createSuggestions(5));

        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).not.toHaveBeenCalled();
        expect(onSelectNothing).not.toHaveBeenCalled();
      }
    );
  });

  it("should not trigger neither onSelect nor onSelectNothing when Enter pressed and popover is not open", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelect,
        onSelectNothing,
        triggerSelectOnEnter: true,
      },
      async () => {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).not.toHaveBeenCalled();
        expect(onSelectNothing).not.toHaveBeenCalled();
      }
    );
  });

  it("should trigger onSelectNothing when space pressed and no suggestion highlighted", async () => {
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelectNothing,
        triggerSelectOnSpace: true,
      },
      async () => {
        const query = "some text";

        simulateInputChange(query);
        await respondWithSuggestions(server, createSuggestions(5));

        el.focus();
        setCursorAtEnd(el);
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelectNothing).toHaveBeenCalledWith("some text", el);
      }
    );
  });

  it("should trigger onSelect when space pressed and some suggestion is highlighted", async () => {
    const onSelect = jest.fn();

    await withInstance(
      {
        onSelect,
        triggerSelectOnSpace: true,
      },
      async () => {
        const suggestions = createSuggestions(5);

        simulateInputChange("some text");
        await respondWithSuggestions(server, suggestions);

        el.focus();
        setCursorAtEnd(el);
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).toHaveBeenCalledWith(suggestions[0], true, el);
      }
    );
  });

  it("should not trigger neither onSelect nor onSelectNothing when space pressed and triggerSelectOnSpace is false", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelect,
        onSelectNothing,
        triggerSelectOnSpace: false,
      },
      async () => {
        simulateInputChange("some text");
        await respondWithSuggestions(server, createSuggestions(5));

        el.focus();
        setCursorAtEnd(el);
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).not.toHaveBeenCalled();
        expect(onSelectNothing).not.toHaveBeenCalled();
      }
    );
  });

  it("should not trigger neither onSelect nor onSelectNothing when space pressed and popover is not open", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelect,
        onSelectNothing,
        triggerSelectOnEnter: true,
      },
      async () => {
        el.focus();
        setCursorAtEnd(el);
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).not.toHaveBeenCalled();
        expect(onSelectNothing).not.toHaveBeenCalled();
      }
    );
  });

  it("should trigger onSelectNothing when input looses focus and no suggestion highlighted", async () => {
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelectNothing,
        triggerSelectOnBlur: true,
      },
      async () => {
        const query = "some text";

        simulateInputChange(query);
        await respondWithSuggestions(server, createSuggestions(5));

        el.focus();
        withEl((anotherInput) => {
          anotherInput.focus();
        });

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelectNothing).toHaveBeenCalledWith(query, el);
      }
    );
  });

  it("should trigger onSelect when input looses focus and some suggestion is highlighted", async () => {
    const onSelect = jest.fn();

    await withInstance(
      {
        onSelect,
        triggerSelectOnBlur: true,
      },
      async () => {
        const suggestions = createSuggestions(5);

        simulateInputChange("some text");
        await respondWithSuggestions(server, suggestions);

        el.focus();
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        withEl((anotherInput) => {
          anotherInput.focus();
        });

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).toHaveBeenCalledWith(suggestions[0], true, el);
      }
    );
  });

  it("should not trigger neither onSelect nor onSelectNothing when input looses focus and triggerSelectOnBlur is false", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelect,
        onSelectNothing,
        triggerSelectOnBlur: false,
      },
      async () => {
        simulateInputChange("some text");
        await respondWithSuggestions(server, createSuggestions(5));

        el.focus();
        withEl((anotherInput) => {
          anotherInput.focus();
        });

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).not.toHaveBeenCalled();
        expect(onSelectNothing).not.toHaveBeenCalled();
      }
    );
  });

  it("should not trigger neither onSelect nor onSelectNothing when input looses focus because of click on popover", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelect,
        onSelectNothing,
        triggerSelectOnBlur: true,
      },
      async () => {
        simulateInputChange("some text");
        await respondWithSuggestions(server, createSuggestions(5));

        el.focus();
        document
          .getElementsByClassName(popoverSass.item)[0]
          .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        el.blur();

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).not.toHaveBeenCalled();
        expect(onSelectNothing).not.toHaveBeenCalled();
      }
    );
  });

  it("should not trigger neither onSelect nor onSelectNothing when space pressed and popover is not open", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withInstance(
      {
        onSelect,
        onSelectNothing,
        triggerSelectOnSpace: true,
      },
      async () => {
        simulateInputChange("some text");
        el.focus();
        setCursorAtEnd(el);
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

        // Selecting is async
        await waitPromisesResolve();

        expect(onSelect).not.toHaveBeenCalled();
        expect(onSelectNothing).not.toHaveBeenCalled();
      }
    );
  });

  it("should set cursor at the end when input focused and device is mobile", () => {
    withInstance(
      {
        mobileMaxWidth: window.innerWidth + 1,
      },
      () => {
        const value = "some text";

        el.value = value;
        el.selectionStart = 0;
        el.selectionEnd = 0;
        el.focus();

        expect(el.selectionStart).toBe(value.length);
        expect(el.selectionEnd).toBe(value.length);
      }
    );
  });

  it("should not start selecting on blur if focused one of helperElements", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withEl(async (helperElement) => {
      await withInstance(
        {
          onSelect,
          onSelectNothing,
          triggerSelectOnBlur: true,
          helperElements: [helperElement],
        },
        async () => {
          simulateInputChange("some text");
          await respondWithSuggestions(server, createSuggestions(5));

          el.focus();
          helperElement.focus();

          // Selecting is async
          await waitPromisesResolve();

          expect(onSelect).not.toHaveBeenCalled();
          expect(onSelectNothing).not.toHaveBeenCalled();
        }
      );
    });
  });

  it("should not start selecting on blur if clicked on one of helperElements", async () => {
    const onSelect = jest.fn();
    const onSelectNothing = jest.fn();

    await withEl(async (helperElement) => {
      await withInstance(
        {
          onSelect,
          onSelectNothing,
          triggerSelectOnBlur: true,
          helperElements: [helperElement],
        },
        async () => {
          simulateInputChange("some text");
          await respondWithSuggestions(server, createSuggestions(5));

          el.focus();
          helperElement.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true })
          );
          el.blur();

          // Selecting is async
          await waitPromisesResolve();

          expect(onSelect).not.toHaveBeenCalled();
          expect(onSelectNothing).not.toHaveBeenCalled();
        }
      );
    });
  });

  it("should not select previously selected suggestion by enter", async () => {
    const onSelect = jest.fn();

    await withInstance(
      {
        onSelect,
        triggerSelectOnEnter: true,
        triggerSelectOnSpace: true,
      },
      async () => {
        const suggestions = createSuggestions(5);

        simulateInputChange("some text");
        await respondWithSuggestions(server, suggestions);

        el.focus();
        setCursorAtEnd(el);
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

        // Selecting is async
        await waitPromisesResolve();
        expect(onSelect).toHaveBeenCalledTimes(1);

        // Respond once again with same suggestions
        await respondWithSuggestions(server, suggestions);

        // First item should be highlighted
        expect(
          document.getElementsByClassName(popoverSass.item)[0]
        ).toHaveClass(popoverSass.isHighlighted);

        // Try to select highlighted item
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        // Selecting is async
        await waitPromisesResolve();

        // onSelect not triggered again
        expect(onSelect).toHaveBeenCalledTimes(1);
      }
    );
  });

  it("should not select previously selected suggestion by space", async () => {
    const onSelect = jest.fn();

    await withInstance(
      {
        onSelect,
        triggerSelectOnSpace: true,
      },
      async () => {
        const suggestions = createSuggestions(5);

        simulateInputChange("some text");
        await respondWithSuggestions(server, suggestions);

        el.focus();
        setCursorAtEnd(el);
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

        // Selecting is async
        await waitPromisesResolve();
        expect(onSelect).toHaveBeenCalledTimes(1);

        // Respond once again with same suggestions
        await respondWithSuggestions(server, suggestions);

        // First item should be highlighted
        expect(
          document.getElementsByClassName(popoverSass.item)[0]
        ).toHaveClass(popoverSass.isHighlighted);

        // Try to select highlighed item
        el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

        // Selecting is async
        await waitPromisesResolve();

        // onSelect not triggered again
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(el.value).toMatch(/\s{2}$/);
      }
    );
  });

  it("should send an enrichment request when selected", async () => {
    const onSelect = jest.fn();

    await withInstance(
      {
        onSelect,
        enrichmentEnabled: true,
        triggerSelectOnEnter: true,
      },
      async () => {
        const suggestions = createSuggestions(5);

        simulateInputChange("some text");
        await respondWithSuggestions(server, suggestions);

        el.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        // Selecting is async
        await waitPromisesResolve();

        expect(server.requests).toHaveLength(2);
        expect(JSON.parse(server.requests[1].requestBody)).toMatchObject({
          [defaultOptions.requestParamName]: suggestions[0].unrestricted_value,
          count: 1,
        });

        // Respond with enriched suggestion
        const enrichedSuggestion = {
          value: "enriched suggestion value",
          unrestricted_value: "enriched suggestion unrestricted_value",
          data: { a: 1, b: 2, c: 3 },
        };
        await respondWithSuggestions(server, [enrichedSuggestion]);

        // Selecting is async
        await waitPromisesResolve();

        // onSelect not triggered again
        expect(onSelect).toHaveBeenCalledWith(enrichedSuggestion, true, el);
      }
    );
  });
});

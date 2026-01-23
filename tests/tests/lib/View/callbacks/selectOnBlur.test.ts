// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext, vi } from "vitest";
import appendUnrestrictedValue from "../helpers/appendUnrestrictedValue";
import useProviderMocks, { type SuggestionsInstance } from "../helpers/ProviderMock";
import chooseSuggestion from "../helpers/chooseSuggestion";

type ContextWithSuggestions = TestContext & {
    suggestions: SuggestionsInstance;
};

const suggestions = [
    [
        {
            value: "Afghanistan",
            data: "Af",
        },
        {
            value: "Albania",
            data: "Al",
        },
        {
            value: "Andorra",
            data: "An",
        },
    ],
    [
        {
            value: "Jamaica",
            data: "J",
        },
    ],
];

describe("Select on blur", () => {
    const { input, setInputValue, triggerBlur, hitKeyDown } = globalThis.createInput();
    const { getProviderInstance, createSuggestions, clearProviderMocks } = useProviderMocks();

    beforeEach((context: ContextWithSuggestions) => {
        clearProviderMocks();
        context.suggestions = createSuggestions(input, { type: "name" });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("should trigger on full match", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));

        setInputValue("Albania");
        await global.wait(100);

        triggerBlur();
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestions[0][1]), false);
    });

    test("should not trigger on full match when not visible", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));

        setInputValue("Albania");
        await global.wait(100);

        context.suggestions.hide();

        triggerBlur();
        await global.wait(100);

        expect(spy).not.toHaveBeenCalled();
    });

    test("should trigger when suggestion is selected manually", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));

        setInputValue("A");
        await global.wait(100);

        getProviderInstance(0).updateChosenSuggestionIndex(2);
        triggerBlur();
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestions[0][2]), true);
    });

    test("should trigger when suggestion is selected by navigation", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));

        setInputValue("A");
        await global.wait(100);

        hitKeyDown("ArrowDown");
        triggerBlur();
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestions[0][0]), true);
    });

    test("should trigger when suggestion is selected by navigation (with chosenSuggestion)", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));

        setInputValue("A");
        await global.wait(100);

        chooseSuggestion(0);

        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));
        context.suggestions.updateSuggestions();
        await global.wait(100);

        spy.mockClear();

        hitKeyDown("ArrowDown");
        triggerBlur();
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestions[0][1]), true);
    });

    test("should NOT trigger on partial match", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });

        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[1] }));

        setInputValue("Jam");
        await global.wait(100);

        triggerBlur();
        await global.wait(100);

        expect(spy).not.toHaveBeenCalled();
    });

    test("should NOT trigger when nothing matched", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });

        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[1] }));

        setInputValue("Alg");
        await global.wait(100);

        triggerBlur();
        await global.wait(100);

        expect(spy).not.toHaveBeenCalled();
    });

    test("should NOT trigger when triggerSelectOnBlur is false", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({
            onSelect: spy,
            triggerSelectOnBlur: false,
        });

        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[1] }));

        setInputValue("A");
        await global.wait(100);

        getProviderInstance(0).updateChosenSuggestionIndex(0);

        expect(spy).not.toHaveBeenCalled();
    });
});

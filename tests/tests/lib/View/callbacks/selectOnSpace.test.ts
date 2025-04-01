// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext, vi } from "vitest";
import appendUnrestrictedValue from "../helpers/appendUnrestrictedValue";
import useProviderMocks, { type SuggestionsInstance } from "../helpers/ProviderMock";

type ContextWithSuggestions = TestContext & {
    suggestions: SuggestionsInstance;
};

const suggestions = [
    [
        {
            value: "Jamaica",
            data: "J",
        },
    ],
    [
        {
            value: "name",
            data: { name: "name" },
        },
        {
            value: "name surname",
            data: {
                name: "name",
                surname: "surname",
            },
        },
    ],
];

describe("Select on Space", () => {
    const { input, setInputValue, hitKeyDown } = globalThis.createInput();
    const { getProviderInstance, createSuggestions, clearProviderMocks } = useProviderMocks();

    beforeEach((context: ContextWithSuggestions) => {
        clearProviderMocks();
        context.suggestions = createSuggestions(input, {
            type: "name",
            triggerSelectOnSpace: true,
            deferRequestBy: 0,
        });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("should trigger when suggestion is selected", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));

        setInputValue("Jam");
        await global.wait(100);

        getProviderInstance(0).updateChosenSuggestionIndex(0);

        hitKeyDown("Space");
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestions[0][0]), true);
    });

    test("should trigger when nothing is selected but there is exact match", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));

        setInputValue("Jamaica");
        await global.wait(100);

        hitKeyDown("Space");
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestions[0][0]), true);
    });

    test("should NOT trigger when triggerSelectOnSpace = false", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({
            onSelect: spy,
            triggerSelectOnSpace: false,
        });

        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[0] }));

        setInputValue("Jam");
        await global.wait(100);

        getProviderInstance(0).updateChosenSuggestionIndex(0);

        hitKeyDown("Space");
        await global.wait(100);

        expect(spy).not.toHaveBeenCalled();
    });

    test("should keep SPACE if selecting has been caused by space", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelect: spy });

        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: suggestions[1] }));

        setInputValue("name");
        await global.wait(100);

        getProviderInstance(0).updateChosenSuggestionIndex(0);

        hitKeyDown("Space");
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(input.value).toStrictEqual("name ");
    });
});

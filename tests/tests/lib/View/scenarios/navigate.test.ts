// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext } from "vitest";
import useProviderMocks, { type SuggestionsInstance } from "../helpers/ProviderMock";

type ContextWithSuggestions = TestContext & {
    suggestions: SuggestionsInstance;
};

const suggestions = [
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
];

describe("Keyboard navigation", () => {
    const { input, setInputValue, hitKeyDown } = globalThis.createInput();
    const { getProviderInstance, createSuggestions } = useProviderMocks();

    beforeEach((context: ContextWithSuggestions) => {
        context.suggestions = createSuggestions(input, { type: "name" });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("should select first suggestion on DOWN key in textbox", async (context: ContextWithSuggestions) => {
        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        hitKeyDown("ArrowDown");

        expect(context.suggestions.getSelectedIndex()).toStrictEqual(0);
        expect(input.value).toStrictEqual(suggestions[0].value);
    });

    test("should select last suggestion on UP key in textbox", async (context: ContextWithSuggestions) => {
        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        hitKeyDown("ArrowUp");

        expect(context.suggestions.getSelectedIndex()).toStrictEqual(2);
        expect(input.value).toStrictEqual(suggestions[2].value);
    });

    test("should select textbox on DOWN key in last suggestion", async (context: ContextWithSuggestions) => {
        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: [] }));

        setInputValue("A");
        await global.wait(100);

        getProviderInstance(0).updateChosenSuggestionIndex(2);
        hitKeyDown("ArrowDown");

        expect(context.suggestions.getSelectedIndex()).toStrictEqual(-1);
        expect(input.value).toStrictEqual("A");
    });
});

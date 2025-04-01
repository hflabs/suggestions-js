// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext } from "vitest";
import { createSuggestions } from "@/index";

type ContextWithSuggestions = TestContext & { suggestions: ReturnType<typeof createSuggestions> };

describe("Autoselect", () => {
    const { input, setInputValue } = global.createInput();
    const suggestionsMock = JSON.stringify({ suggestions: ["Jamaica", "Jamaica", "Jamaica"] });

    beforeEach((context: ContextWithSuggestions) => {
        context.suggestions = createSuggestions(input, { type: "address" });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("Should autoselect first item if autoSelectFirst set to true", async (context: ContextWithSuggestions) => {
        context.suggestions.setOptions({ autoSelectFirst: true });

        global.fetchMocker.mockResponse(suggestionsMock);

        setInputValue("Jam");
        await global.wait(100);

        expect(context.suggestions.getSelectedIndex()).toStrictEqual(0);
    });

    test("Should not autoselect first item by default", async (context: ContextWithSuggestions) => {
        global.fetchMocker.mockResponse(suggestionsMock);

        setInputValue("Jam");
        await global.wait(100);

        expect(context.suggestions.getSelectedIndex()).toStrictEqual(-1);
    });
});

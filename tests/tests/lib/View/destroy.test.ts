// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext } from "vitest";
import { createSuggestions } from "@/index";

type ContextWithSuggestions = TestContext & {
    suggestions: ReturnType<typeof createSuggestions>;
};

describe("Plugin destroy", () => {
    const { input, setInputValue } = globalThis.createInput();

    beforeEach((context: ContextWithSuggestions) => {
        context.suggestions = createSuggestions(input, { type: "name" });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("should destroy suggestions instance", async (context: ContextWithSuggestions) => {
        global.fetchMocker.mockClear();

        setInputValue("A");
        await global.wait(100);

        expect(global.fetchMocker).toHaveBeenCalled();
        expect(document.querySelector(".suggestions-suggestions")).toBeTruthy();

        global.fetchMocker.mockClear();
        context.suggestions.dispose();

        setInputValue("A");
        await global.wait(100);

        expect(global.fetchMocker).not.toHaveBeenCalled();
        expect(document.querySelector(".suggestions-suggestions")).toBeFalsy();
    });
});

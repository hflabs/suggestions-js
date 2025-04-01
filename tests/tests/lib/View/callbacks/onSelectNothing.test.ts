// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext, vi } from "vitest";
import { createSuggestions } from "@/index";

type ContextWithSuggestions = TestContext & {
    suggestions: ReturnType<typeof createSuggestions>;
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

describe("Nothing selected callback", () => {
    const { input, setInputValue, hitKeyDown, triggerBlur } = globalThis.createInput();

    beforeEach((context: ContextWithSuggestions) => {
        context.suggestions = createSuggestions(input, { type: "address" });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("should be triggered on ENTER pressed with no suggestions visible", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelectNothing: spy });

        setInputValue("A");
        await global.wait(100);

        hitKeyDown("Enter");
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("A");
    });

    test("should be triggered on ENTER pressed with no matching suggestion", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelectNothing: spy });

        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        hitKeyDown("Enter");
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("A");
    });

    test("should be triggered when focus lost and no matching suggestion", async (context: ContextWithSuggestions) => {
        const spy = vi.fn();
        context.suggestions.setOptions({ onSelectNothing: spy });

        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        triggerBlur();
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith("A");
    });
});

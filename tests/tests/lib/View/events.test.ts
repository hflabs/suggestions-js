// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext, vi } from "vitest";
import { createSuggestions } from "@/index";
import chooseSuggestion from "./helpers/chooseSuggestion";

type ContextWithSuggestions = TestContext & {
    suggestions: ReturnType<typeof createSuggestions>;
};

describe("Element events", () => {
    const { input, setInputValue, hitKeyDown } = globalThis.createInput();

    beforeEach((context: ContextWithSuggestions) => {
        context.suggestions = createSuggestions(input, { type: "name" });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("`suggestions-select` should be triggered", async () => {
        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: [{ value: "A" }] }));

        const handler = vi.fn();
        input.addEventListener("suggestions-select", handler);

        setInputValue("A");
        await global.wait(100);

        chooseSuggestion(0);
        await global.wait(100);

        expect(handler.mock.calls[0][0].detail.suggestion).toMatchObject({
            value: "A",
            unrestricted_value: "A",
            data: {},
        });

        input.removeEventListener("suggestions-select", handler);
    });

    test("`suggestions-selectnothing` should be triggered", async () => {
        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: [] }));

        const handler = vi.fn();
        input.addEventListener("suggestions-selectnothing", handler);

        setInputValue("A");
        await global.wait(100);

        hitKeyDown("Enter");
        await global.wait(100);

        expect(handler.mock.calls[0][0].detail.query).toStrictEqual("A");

        input.removeEventListener("suggestions-selectnothing", handler);
    });

    test("`suggestions-invalidateselection` should be triggered", async () => {
        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: [{ value: "A" }] }));

        const handler = vi.fn();
        input.addEventListener("suggestions-invalidateselection", handler);

        setInputValue("A");
        await global.wait(100);

        chooseSuggestion(0);
        await global.wait(100);

        setInputValue("Aaaa");
        hitKeyDown("Enter");
        await global.wait(100);

        expect(handler.mock.calls[0][0].detail.suggestion).toMatchObject({
            value: "A",
            unrestricted_value: "A",
            data: {},
        });

        input.removeEventListener("suggestions-invalidateselection", handler);
    });

    test("`suggestions-set` should be triggered", async (context: ContextWithSuggestions) => {
        const handler = vi.fn();
        input.addEventListener("suggestions-set", handler);

        context.suggestions.setSuggestion({
            value: "something",
            unrestricted_value: "something",
            data: {},
        });

        expect(handler).toHaveBeenCalled();

        input.removeEventListener("suggestions-set", handler);
    });

    test("`suggestions-fixdata` should be triggered", async (context: ContextWithSuggestions) => {
        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: [{ value: "A" }] }));

        const handler = vi.fn();
        input.addEventListener("suggestions-fixdata", handler);

        setInputValue("г Москва");
        await global.wait(100);

        context.suggestions.fixData("г Москва");
        await global.wait(100);

        expect(handler.mock.calls[0][0].detail.suggestion).toMatchObject({
            value: "A",
            unrestricted_value: "A",
            data: {},
        });

        input.removeEventListener("suggestions-fixdata", handler);
    });
});

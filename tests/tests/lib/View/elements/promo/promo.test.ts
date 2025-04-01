// @vitest-environment jsdom

import { describe, test, expect, vi, beforeEach } from "vitest";

const suggestions = [{ value: "Антон" }, { value: "Антонина" }];

describe("Promo element", () => {
    const { input, setInputValue } = globalThis.createInput();

    beforeEach(() => {
        vi.resetModules();
    });

    test("should show promo block for free plan", async () => {
        const { createSuggestions } = await import("@/index");

        global.fetchMocker.mockResponseOnce(JSON.stringify({ search: true }), {
            headers: { "X-Plan": "FREE" },
        });

        const plugin = createSuggestions(input, { type: "name" });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        expect(document.querySelector(".suggestions-promo")).toBeTruthy();

        plugin.dispose();
    });

    test("promo link should lead to Dadata", async () => {
        const { createSuggestions } = await import("@/index");

        global.fetchMocker.mockClear();
        global.fetchMocker.mockResponseOnce(JSON.stringify({ search: true }), {
            headers: { "X-Plan": "FREE" },
        });

        const plugin = createSuggestions(input, { type: "name" });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        const link = document.querySelector<HTMLAnchorElement>(".suggestions-promo a");

        expect(link?.href).toEqual(
            "https://dadata.ru/suggestions/?utm_source=dadata&utm_medium=module&utm_campaign=suggestions-jquery"
        );

        plugin.dispose();
    });

    test("should NOT show promo block for premium plan", async () => {
        const { createSuggestions } = await import("@/index");

        global.fetchMocker.mockResponseOnce(JSON.stringify({ search: true }), {
            headers: { "X-Plan": "MEDIUM" },
        });

        const plugin = createSuggestions(input, { type: "name" });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        expect(document.querySelector(".suggestions-promo")).toBeFalsy();

        plugin.dispose();
    });

    test("should NOT show promo block for standalone suggestions", async () => {
        const { createSuggestions } = await import("@/index");

        global.fetchMocker.mockResponseOnce(JSON.stringify({ search: true }), {
            headers: { "X-Plan": "NONE" },
        });

        const plugin = createSuggestions(input, { type: "name" });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        expect(document.querySelector(".suggestions-promo")).toBeFalsy();

        plugin.dispose();
    });

    test("should NOT show promo block if header is missing", async () => {
        const { createSuggestions } = await import("@/index");

        global.fetchMocker.mockResponseOnce(JSON.stringify({ search: true }));

        const plugin = createSuggestions(input, { type: "name" });
        global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        expect(document.querySelector(".suggestions-promo")).toBeFalsy();

        plugin.dispose();
    });

    test("should NOT show promo block when response is empty", async () => {
        const { createSuggestions } = await import("@/index");

        global.fetchMocker.mockResponseOnce(JSON.stringify({ search: true }), {
            headers: { "X-Plan": "FREE" },
        });

        const plugin = createSuggestions(input, { type: "name" });

        setInputValue("A");
        await global.wait(100);

        expect(document.querySelector(".suggestions-promo")).toBeFalsy();

        plugin.dispose();
    });
});

// @vitest-environment jsdom

import { describe, test, expect, vi } from "vitest";
import { createSuggestions } from "@/index";

describe("beforeRender", () => {
    const { input, setInputValue } = globalThis.createInput();

    test("should call beforeRender and pass container jQuery object", async () => {
        const spy = vi.fn();

        createSuggestions(input, {
            type: "name",
            beforeRender: spy,
        });

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: ["Jamaica"] }));

        setInputValue("A");
        await global.wait(100);

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(document.querySelector(".suggestions-suggestions"));
    });
});

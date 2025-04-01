// @vitest-environment jsdom

import { test, expect } from "vitest";
import { createSuggestions } from "@/index";

test("Should not clear value on fixData", async () => {
    const { input, setInputValue } = global.createInput();

    const suggestions = createSuggestions(input, { type: "address" });

    global.fetchMocker.mockResponse(JSON.stringify({ suggestions: [] }));

    const value = "Санкт-Петербург, ул. Софийская, д.35, корп.4, кв.81";

    setInputValue(value);
    await global.wait(100);

    suggestions.fixData("г Москва");
    await global.wait(100);

    expect(input.value).toStrictEqual(value);
});

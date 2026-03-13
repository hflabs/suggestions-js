// @vitest-environment jsdom

import { test, expect } from "vitest";
import useProviderMocks from "../helpers/ProviderMock";

test("Should not enrich a suggestion when selected by SPACE", async () => {
    const { input, setInputValue, hitKeyDown } = global.createInput();
    const { getProviderInstance, createSuggestions } = useProviderMocks();

    createSuggestions(input, {
        type: "address",
        triggerSelectOnSpace: true,
    });

    const suggestionsMock = JSON.stringify({ suggestions: ["Jamaica", "Jamaica", "Jamaica"] });
    global.fetchMocker.mockResponse(suggestionsMock);

    setInputValue("Р");
    await global.wait(100);

    global.fetchMocker.mockClear();

    getProviderInstance(0).updateChosenSuggestionIndex(0);

    hitKeyDown("Space");
    await global.wait(100);

    expect(global.fetchMocker).toHaveBeenCalledTimes(1);

    const enrichCalls = global.fetchMocker.mock.calls.filter((call) => {
        const body = call[1]?.body;
        return typeof body === "string" ? JSON.parse(body)?.count === 1 : false;
    });

    expect(enrichCalls).toHaveLength(0);
});

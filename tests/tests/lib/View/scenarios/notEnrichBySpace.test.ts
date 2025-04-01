// @vitest-environment jsdom

import { test, expect, vi } from "vitest";
import useProviderMocks from "../helpers/ProviderMock";

vi.mock("@/lib/View/scenarios/listeners/getSuggestions.ts", async (importOriginal) => {
    const orig = await importOriginal();
    return {
        ...(orig as object),
        getUpdateSuggestionsHandler: () => vi.fn(),
    };
});

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

    expect(global.fetchMocker).not.toHaveBeenCalled();
});

// @vitest-environment jsdom

import { test, expect } from "vitest";
import useProviderMocks from "../helpers/ProviderMock";
import chooseSuggestion from "../helpers/chooseSuggestion";

test("Should not save enriched suggestion to list (and not render it)", async () => {
    const { input, setInputValue } = global.createInput();
    const { createSuggestions } = useProviderMocks();

    const widget = createSuggestions(input, { type: "address" });
    const suggestions = [
        {
            value: "Jamaica 1",
            unrestricted_value: "Jamaica",
        },
        {
            value: "Jamaica",
            unrestricted_value: "Jamaica",
        },
        {
            value: "Jamaica 2",
            unrestricted_value: "Jamaica",
        },
    ];

    const enrichedSuggestion = {
        value: "Jamaica",
        unrestricted_value: "Jamaica enriched",
    };

    const suggestionsMock = JSON.stringify({ suggestions });
    global.fetchMocker.mockResponse(suggestionsMock);

    setInputValue("Jamaica");
    await global.wait(100);

    global.fetchMocker.mockResponseOnce(JSON.stringify({ suggestions: [enrichedSuggestion] }));

    chooseSuggestion(0);
    await global.wait(100);

    // в списке подсказок - оригинальные подсказки, без учета обогащения
    expect(widget.getSuggestions()).toMatchObject(suggestions);
    // в объекте выбранной подсказки - обогащенная подсказка
    expect(widget.getSelection()).toMatchObject(enrichedSuggestion);

    widget.updateSuggestions();
    await global.wait(100);

    global.fetchMocker.mockClear();

    // рендерится тоже оригинальный список (без учета обогащения)
    const firstSuggestion = document.querySelector(`[data-index="${0}"]`);
    expect(firstSuggestion?.textContent).toStrictEqual(suggestions[0].value);

    chooseSuggestion(0);
    await global.wait(100);

    // при повторном выборе из списка оригинальных подсказок той же подсказки
    // - ее обогащенный результат берется из кэша
    expect(global.fetchMocker).not.toHaveBeenCalled();

    // и оригинальный список подсказок по-прежнему не изменяется
    expect(widget.getSuggestions()).toMatchObject(suggestions);
    expect(widget.getSelection()).toMatchObject(enrichedSuggestion);
});

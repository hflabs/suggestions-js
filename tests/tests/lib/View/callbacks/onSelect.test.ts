// @vitest-environment jsdom

import { describe, test, expect, vi } from "vitest";
import { createSuggestions } from "@/index";
import chooseSuggestion from "../helpers/chooseSuggestion";
import appendUnrestrictedValue from "../helpers/appendUnrestrictedValue";

describe("onSelect callback", () => {
    const { input, setInputValue } = globalThis.createInput();

    test("verify onSelect callback (fully changed)", async () => {
        const spy = vi.fn();
        const suggestions = [
            {
                value: "Abcdef",
                data: "B",
            },
        ];

        const plugin = createSuggestions(input, {
            type: "name",
            onSelect: spy,
        });

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("A");
        await global.wait(100);

        chooseSuggestion(0);
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestions[0]), true);

        plugin.dispose();
    });

    test("verify onSelect callback (just enriched)", async () => {
        const spy = vi.fn();
        const suggestions = [
            {
                value: "Abc",
                data: {
                    name: "Name",
                    surname: "Surname",
                    patronymic: "Patronymic",
                },
            },
            {
                value: "Abcd",
                data: {
                    name: "Name",
                    surname: "Surname",
                    patronymic: "Patronymic",
                },
            },
        ];

        const plugin = createSuggestions(input, {
            type: "name",
            onSelect: spy,
        });

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("Abc");
        await global.wait(100);

        chooseSuggestion(0);
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestions[0]), false);

        spy.mockClear();

        plugin.updateSuggestions();
        await global.wait(100);

        chooseSuggestion(0);
        await global.wait(100);

        expect(spy).toHaveBeenCalledTimes(0);

        plugin.dispose();
    });
});

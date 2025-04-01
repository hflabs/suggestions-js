import { Provider } from "@/lib/Provider/index";
import { describe, test, expect } from "vitest";

describe("FIAS strategy", () => {
    const provider = new Provider({ type: "fias" }, () => false);

    test("should support planning structure in locations", async () => {
        provider.updateOptions({
            type: "fias",
            params: {
                locations: [{ planning_structure_fias_id: "123" }],
            },
        });

        global.fetchMocker.mockClear();

        await provider.fetchSuggestions("jam");

        expect(global.fetchMocker.mock.calls[0][1]?.body).toContain(
            '"locations":[{"planning_structure_fias_id":"123"}]'
        );
    });

    test("should support planning structure in bounds", async () => {
        provider.updateOptions({
            type: "fias",
            params: {
                from_bound: { value: "planning_structure" },
                to_bound: { value: "planning_structure" },
            },
        });

        global.fetchMocker.mockClear();

        await provider.fetchSuggestions("jam");

        expect(global.fetchMocker.mock.calls[0][1]?.body).toContain(
            '"from_bound":{"value":"planning_structure"}'
        );
        expect(global.fetchMocker.mock.calls[0][1]?.body).toContain(
            '"to_bound":{"value":"planning_structure"}'
        );
    });

    test("should not iplocate", () => {
        global.fetchMocker.mockClear();

        // eslint-disable-next-line no-new
        new Provider({ type: "fias" }, () => false);

        expect(global.fetchMocker).not.toHaveBeenCalled();
    });

    test("should not enrich", async () => {
        global.fetchMocker.mockOnce(
            JSON.stringify({
                suggestions: [
                    {
                        value: "Москва",
                        data: {
                            city: "Москва",
                            qc: null,
                        },
                    },
                ],
            })
        );

        await provider.fetchSuggestions("Р");

        global.fetchMocker.mockClear();

        provider.updateChosenSuggestionIndex(0);
        await provider.selectMatchingSuggestion("P");

        expect(global.fetchMocker).not.toHaveBeenCalled();
    });
});

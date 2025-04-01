import { describe, test, expect, afterEach } from "vitest";

import { Provider } from "@/lib/Provider/index";
import type { Suggestion } from "@/lib/types";

import { PROVIDER_OPTIONS } from "@/lib/Provider/types";

const getProvider = (options: Partial<PROVIDER_OPTIONS>) =>
    new Provider(
        {
            type: options.type || "name",
            ...options,
        },
        () => false
    );

describe("Format selected suggestion value", () => {
    afterEach(() => {
        global.fetchMocker.resetMocks();
    });

    test("should invoke formatSelected callback", async () => {
        const provider = getProvider({
            formatSelected: (suggestion: Suggestion) => suggestion.data.customValue,
        });

        global.fetchMocker.mockResponse(
            JSON.stringify({
                suggestions: [
                    {
                        value: "A",
                        data: {
                            customValue: "custom value",
                        },
                    },
                ],
            })
        );

        await provider.fetchSuggestions("A");

        const { suggestionValue } = await provider.selectSuggestionByIndex(0, "A");

        expect(suggestionValue).toStrictEqual("custom value");
        expect(provider.chosenSuggestion?.value).toStrictEqual("A");
    });

    test("should use default value if formatSelected returns null", async () => {
        const provider = getProvider({
            formatSelected: () => null,
            params: { parts: ["NAME"] },
        });

        global.fetchMocker.mockResponse(
            JSON.stringify({
                suggestions: [
                    {
                        value: "Alex",
                        data: {
                            name: "Alex",
                        },
                    },
                ],
            })
        );

        await provider.fetchSuggestions("Al");

        const { suggestionValue } = await provider.selectSuggestionByIndex(0, "Al");

        expect(suggestionValue).toStrictEqual("Alex");
    });

    test("should not use default value if formatSelected returns empty string", async () => {
        const provider = getProvider({
            formatSelected: () => "",
            params: { parts: ["NAME"] },
        });

        global.fetchMocker.mockResponse(
            JSON.stringify({
                suggestions: [
                    {
                        value: "Alex",
                        data: {
                            name: "Alex",
                        },
                    },
                ],
            })
        );

        await provider.fetchSuggestions("Al");

        const { suggestionValue } = await provider.selectSuggestionByIndex(0, "Al");

        expect(suggestionValue).toStrictEqual("");
    });

    test("should invoke type-specified formatSelected method", async () => {
        const provider = getProvider({ type: "bank" });

        global.fetchMocker.mockResponse(
            JSON.stringify({
                suggestions: [
                    {
                        value: "АЛЬФА-БАНК",
                        data: {
                            name: {
                                full: 'АКЦИОНЕРНОЕ ОБЩЕСТВО "АЛЬФА-БАНК"',
                                payment: 'АО "АЛЬФА-БАНК"',
                                short: "АЛЬФА-БАНК",
                            },
                        },
                    },
                ],
            })
        );

        await provider.fetchSuggestions("Альфа");

        const { suggestionValue } = await provider.selectSuggestionByIndex(0, "Альфа");

        expect(suggestionValue).toStrictEqual('АО "АЛЬФА-БАНК"');
    });
});

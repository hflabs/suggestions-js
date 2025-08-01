import { describe, test, expect, vi } from "vitest";

import type { PROVIDER_OPTIONS } from "@/lib/Provider/types";
import { Provider } from "@/lib/Provider/index";
import { HINT_DEFAULT } from "@/lib/Provider/provider.constants";

type callWithHeaders = { headers: { [k: string]: string } };

const nameSuggestions = [
    {
        value: "Alex",
        unrestricted_value: "Alex",
        data: {},
    },
    {
        value: "Ammy",
        unrestricted_value: "Ammy",
        data: {},
    },
    {
        value: "Anny",
        unrestricted_value: "Anny",
        data: {},
    },
];

const getProvider = (options: Partial<PROVIDER_OPTIONS> = {}) =>
    new Provider(
        {
            type: options.type || "name",
            ...options,
        },
        () => false
    );

describe("Base Provider features", () => {
    describe("Misc", () => {
        test("should convert suggestions format", async () => {
            const provider = getProvider();

            global.fetchMocker.mockOnce(JSON.stringify({ suggestions: ["Alex", "Ammy", "Anny"] }));

            await provider.fetchSuggestions("A");

            expect(provider.getSuggestions()).toEqual(nameSuggestions);
        });

        test("should prevent Ajax requests if previous query with matching root failed", async () => {
            const provider = getProvider({ preventBadQueries: true });

            global.fetchMocker.mockOnce(JSON.stringify({ suggestions: [] }));
            global.fetchMocker.mockClear();

            await provider.fetchSuggestions("Jam");
            expect(global.fetchMocker).toHaveBeenCalledTimes(1);

            await provider.fetchSuggestions("Jama");
            expect(global.fetchMocker).toHaveBeenCalledTimes(1);

            await provider.fetchSuggestions("Jamai");
            expect(global.fetchMocker).toHaveBeenCalledTimes(1);
        });
    });

    describe("onSuggestionsFetch callback", () => {
        test("invoked", async () => {
            const onSuggestionsFetch = vi.fn();

            const provider = getProvider({ onSuggestionsFetch });

            global.fetchMocker.mockOnce(JSON.stringify({ suggestions: nameSuggestions }));

            await provider.fetchSuggestions("A");

            expect(onSuggestionsFetch).toHaveBeenCalledTimes(1);
            expect(onSuggestionsFetch).toHaveBeenCalledWith(nameSuggestions);
        });

        test("can modify argument", async () => {
            const onSuggestionsFetch = vi.fn((suggestions: typeof nameSuggestions) => {
                suggestions.push(suggestions.shift()!);
            });

            const provider = getProvider({ onSuggestionsFetch });

            global.fetchMocker.mockOnce(JSON.stringify({ suggestions: nameSuggestions }));

            await provider.fetchSuggestions("A");
            const suggestions = provider.getSuggestions();

            expect(suggestions[0]).toEqual(nameSuggestions[1]);
            expect(suggestions[1]).toEqual(nameSuggestions[2]);
            expect(suggestions[2]).toEqual(nameSuggestions[0]);
        });

        test("can use returned array", async () => {
            const onSuggestionsFetch = vi.fn((suggestions: typeof nameSuggestions) => [
                suggestions[1],
                suggestions[2],
                suggestions[0],
            ]);

            const provider = getProvider({ onSuggestionsFetch });

            global.fetchMocker.mockOnce(JSON.stringify({ suggestions: nameSuggestions }));

            await provider.fetchSuggestions("A");
            const suggestions = provider.getSuggestions();

            expect(suggestions[0]).toEqual(nameSuggestions[1]);
            expect(suggestions[1]).toEqual(nameSuggestions[2]);
            expect(suggestions[2]).toEqual(nameSuggestions[0]);
        });

        test("verify returned", async () => {
            const onSuggestionsFetch = vi.fn(
                () => [null, {}, { value: "value" }] as unknown as typeof nameSuggestions
            );

            const provider = getProvider({ onSuggestionsFetch });

            global.fetchMocker.mockOnce(JSON.stringify({ suggestions: nameSuggestions }));

            await provider.fetchSuggestions("A");
            const suggestions = provider.getSuggestions();

            expect(suggestions).toMatchObject([
                {
                    value: "",
                    unrestricted_value: "",
                    data: {},
                },
                {
                    value: "value",
                    unrestricted_value: "value",
                    data: {},
                },
            ]);
        });
    });

    describe("Hint message", () => {
        test("should return default hint message", () => {
            const provider = getProvider();

            expect(provider.getSuggestionsHint()).toStrictEqual(HINT_DEFAULT);
        });

        test("should display custom hint message", () => {
            const customHint = "This is custon hint";
            const provider = getProvider({ hint: customHint });

            expect(provider.getSuggestionsHint()).toStrictEqual(customHint);
        });

        test("should not display any hint message", () => {
            const provider = getProvider({ hint: false });

            expect(provider.getSuggestionsHint()).toBeFalsy();
        });
    });

    describe("Custom params", () => {
        test("should include params option into request", async () => {
            const provider = getProvider({ params: { a: 1 } });

            global.fetchMocker.mockClear();

            await provider.fetchSuggestions("A");

            expect(global.fetchMocker.mock.calls[0][1]?.body).toContain('"a":1');
        });

        test("should include params option into request when it is a function", async () => {
            const provider = getProvider({
                params() {
                    return { a: 2 };
                },
            });

            global.fetchMocker.mockClear();

            await provider.fetchSuggestions("A");

            expect(global.fetchMocker.mock.calls[0][1]?.body).toContain('"a":2');
        });
    });

    describe("Headers", () => {
        test("should include version info in requests", async () => {
            const provider = getProvider();

            global.fetchMocker.mockClear();

            await provider.fetchSuggestions("Jam");

            const { headers } = (global.fetchMocker.mock.calls[0][1] || {}) as callWithHeaders;

            expect(headers["X-Version"]).toMatch(/\d+\.\d+\.\d+|9999/);
        });

        test("should send custom HTTP headers", async () => {
            const provider = getProvider({
                headers: { "X-my-header": "blabla" },
            });

            global.fetchMocker.mockClear();

            await provider.fetchSuggestions("A");
            const { headers } = (global.fetchMocker.mock.calls[0][1] || {}) as callWithHeaders;

            expect(headers?.["X-my-header"]).toStrictEqual("blabla");
        });

        test("should handle custom HTTP headers from function", async () => {
            const provider = getProvider({
                headers: () => ({ "X-my-header": "blabla" }),
            });

            global.fetchMocker.mockClear();

            await provider.fetchSuggestions("A");
            const { headers } = (global.fetchMocker.mock.calls[0][1] || {}) as callWithHeaders;

            expect(headers?.["X-my-header"]).toStrictEqual("blabla");
        });

        test("should overwrite custom HTTP headers with ones used by plugin", async () => {
            const provider = getProvider({
                headers: { "X-Version": "blabla" },
            });

            global.fetchMocker.mockClear();

            await provider.fetchSuggestions("A");
            const { headers } = (global.fetchMocker.mock.calls[0][1] || {}) as callWithHeaders;

            expect(headers["X-Version"]).toStrictEqual(process.env.npm_package_version);
        });
    });
});

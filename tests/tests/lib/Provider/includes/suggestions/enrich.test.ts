import { Provider } from "@/lib/Provider/index";
import { describe, test, expect, beforeEach } from "vitest";

const fixtures = {
    poorName: [
        {
            value: "Романов Иван Петрович",
            data: {
                name: "Иван",
                patronymic: "Петрович",
                surname: "Романов",
                gender: "MALE",
                qc: null,
            },
        },
    ],
    poorAddress: [
        {
            value: "Москва",
            data: {
                city: "Москва",
                qc: null,
            },
        },
    ],
    poorAddressRestricted: [
        {
            value: "ул Солянка, д 6",
            unrestricted_value: "г Москва, ул Солянка, д 6",
            data: {
                region: "Москва",
                region_type: "г",
                region_with_type: "г Москва",
                city: "Москва",
                city_type: "г",
                city_with_type: "г Москва",
                street: "Солянка",
                street_type: "ул",
                street_with_type: "ул Солянка",
                house: "6",
                qc: null,
            },
        },
    ],
    poorParty: [
        {
            value: "Фирма",
            data: {
                hid: "123",
            },
        },
    ],
    poorBank: [
        {
            value: "альфа-банк",
            data: {
                bic: "044525593",
            },
        },
    ],
    enriched: [
        {
            value: "Москва",
            data: {
                city: "Москва",
                qc: 0,
            },
        },
    ],
};

describe("Enrich suggestion", () => {
    const provider = new Provider({ type: "email" }, () => false);

    beforeEach(() => {
        global.fetchMocker.resetMocks();
        global.fetchMocker.mockClear();
    });

    const enrichByTypes = [
        {
            type: "party",
            query: "Р",
            suggestions: fixtures.poorParty,
            enrichQuery: fixtures.poorParty[0].data.hid,
        },
        {
            type: "bank",
            query: "а",
            suggestions: fixtures.poorBank,
            enrichQuery: fixtures.poorBank[0].data.bic,
        },
        {
            type: "address",
            query: "М",
            suggestions: fixtures.poorAddress,
            enrichQuery: fixtures.poorAddress[0].value,
        },
    ];

    test("should NOT enrich a suggestion for names", async () => {
        provider.updateOptions({ type: "name" });

        global.fetchMocker.mockOnce(JSON.stringify({ suggestions: fixtures.poorName }));

        await provider.fetchSuggestions("Р");

        global.fetchMocker.mockClear();

        provider.updateChosenSuggestionIndex(0);
        await provider.selectMatchingSuggestion("Р");

        expect(global.fetchMocker).not.toHaveBeenCalled();
    });

    test.each(enrichByTypes)(
        "should enrich a suggestion for $type type",
        async ({ type, query, suggestions, enrichQuery }) => {
            provider.updateOptions({ type });

            global.fetchMocker.mockOnce(JSON.stringify({ suggestions }));

            await provider.fetchSuggestions(query);

            global.fetchMocker.mockClear();

            provider.updateChosenSuggestionIndex(0);
            await provider.selectMatchingSuggestion(query);

            expect(global.fetchMocker).toHaveBeenCalledTimes(1);
            expect(global.fetchMocker.mock.calls[0][1]?.body).toContain('"count":1');
            expect(global.fetchMocker.mock.calls[0][1]?.body).toContain(`"query":"${enrichQuery}"`);
        }
    );

    test("should send unrestricted_value for enrichment", async () => {
        provider.updateOptions({
            type: "address",
            params: {
                locations: [
                    {
                        region_type: "г",
                        region: "Москва",
                        region_with_type: "г Москва",
                    },
                ],
                restrict_value: true,
            },
        });

        global.fetchMocker.mockOnce(
            JSON.stringify({ suggestions: fixtures.poorAddressRestricted })
        );

        await provider.fetchSuggestions("Сол");

        global.fetchMocker.mockClear();

        provider.updateChosenSuggestionIndex(0);
        await provider.selectMatchingSuggestion("Сол");

        expect(global.fetchMocker).toHaveBeenCalledTimes(1);
        expect(global.fetchMocker.mock.calls[0][1]?.body).toContain('"count":1');
        expect(global.fetchMocker.mock.calls[0][1]?.body).toContain(
            `"query":"${fixtures.poorAddressRestricted[0].unrestricted_value}"`
        );
    });

    test("should ignore server `enrich:false` status", async () => {
        global.fetchMocker.mockOnce(
            JSON.stringify({
                search: true,
                enrich: false,
            })
        );

        provider.updateOptions({
            token: "456",
            type: "address",
        });

        global.fetchMocker.mockOnce(
            JSON.stringify({ suggestions: fixtures.poorAddressRestricted })
        );

        await provider.fetchSuggestions("Сол");

        global.fetchMocker.mockClear();

        provider.updateChosenSuggestionIndex(0);
        await provider.selectMatchingSuggestion("Сол");

        expect(global.fetchMocker).toHaveBeenCalledTimes(1);
    });
});

// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext, vi } from "vitest";
import appendUnrestrictedValue from "../helpers/appendUnrestrictedValue";
import useProviderMocks, { type SuggestionsInstance } from "../helpers/ProviderMock";

import addressMocks from "../mocks/address";

type ContextWithSuggestions = TestContext & {
    suggestions: SuggestionsInstance;
};

const positiveTestsData = [
    {
        name: "should trigger when normalized query equals single suggestion from list (same parent)",
        query: "тверская оленинский упыри",
        suggestion: addressMocks["тверская оленинский упыри"][0],
    },
    {
        name: "should trigger when normalized query equals single suggestion from list (not same parent)",
        query: "г москва, зеленоград",
        suggestion: addressMocks["г москва, зеленоград"][0],
    },
    {
        name: "should trigger when normalized query byword-matches same parent list #1",
        query: "ставропольский средний зеленая 36",
        suggestion: addressMocks["ставропольский средний зеленая 36"][0],
    },
    {
        name: "should trigger when normalized query byword-matches same parent list #2",
        query: "новосибирск ленина 12",
        suggestion: addressMocks["новосибирск ленина 12"][0],
    },
    {
        name: "should trigger on joint query match (case 1)",
        query: "москва енисейская24",
        suggestion: addressMocks["москва енисейская24"][0],
    },
    {
        name: "should trigger on joint query match (case 2)",
        query: "москва енисейская 24стр2",
        suggestion: addressMocks["москва енисейская 24стр2"][1],
    },
    {
        name: "should trigger on E = YO",
        query: "санкт-петербург пугачева",
        suggestion: addressMocks["санкт-петербург пугачева"][0],
    },
    {
        name: "should trigger on hyphen as a separator",
        query: "санкт петербург пугачёва 15-44",
        suggestion: addressMocks["санкт петербург пугачёва 15-44"][0],
    },
    {
        name: "should trigger when fields (inn) match single suggestion",
        query: "хф 7707545900",
        suggestion: addressMocks["хф 7707545900"][0],
        options: { type: "party" },
    },
    {
        name: "should trigger when fields (ogrn) match single suggestion",
        query: "1057746629115",
        suggestion: addressMocks["1057746629115"][0],
        options: { type: "party" },
    },
    {
        name: "should trigger when fields (inn) partially match single suggestion",
        query: "хф 770754",
        suggestion: addressMocks["хф 770754"][0],
        options: { type: "party" },
    },
    {
        name: "should trigger when fields (bic) partially match single suggestion",
        query: "альфа 04452",
        suggestion: addressMocks["альфа 04452"][0],
        options: { type: "bank" },
    },
];

const negativeTestsData = [
    {
        name: "should NOT trigger when normalized query equals single suggestion from list AND is contained in other",
        query: "новосибирская",
    },
    {
        name: "should NOT trigger when normalized query encloses suggestion from list",
        query: "Россия, обл Тверская, р-н Оленинский, д Упыри ул",
    },
    {
        name: "should NOT trigger when normalized query equals multiple suggestions from list",
        query: "москва мира",
    },
    {
        name: "should NOT trigger when normalized query byword-matches same parent list, but houses differ",
        query: "новосибирск ленина 2",
    },
    {
        name: "should NOT trigger when normalized query byword-matches different parent list #1",
        query: "ленина 36",
    },
    {
        name: "should NOT trigger when normalized query byword-matches different parent list #2",
        query: "средний зеленая 36",
    },
    {
        name: "should NOT trigger when the last word in query is a stop-word",
        query: "зеленоград мкр",
    },
    {
        name: "should NOT trigger when byword matched several suggestions",
        query: "Петр Иванович",
        options: { type: "name" },
    },
    {
        name: "should NOT trigger when joint query not matched",
        query: "москва енисейская24г",
    },
    {
        name: "should NOT trigger on slash house partial match",
        query: "респ Татарстан, г Набережные Челны, ул Нижняя Боровецкая, д 1",
    },
    {
        name: "should NOT trigger on conflicting house-building match",
        query: "г Красноярск, ул Авиаторов, д 5",
    },
    {
        name: "should NOT trigger when fields match several suggestions",
        query: "газпром 1027700055360",
        options: { type: "party" },
    },
];

describe("Select on Enter", () => {
    const { input, setInputValue, hitKeyDown } = globalThis.createInput();
    const { getProviderInstance, createSuggestions, clearProviderMocks } = useProviderMocks();

    const onSelectSpy = vi.fn();

    global.fetchMocker.mockIf(/suggest/, async (req) => {
        if (req.method !== "POST") return {};
        const body = await req.json();

        return JSON.stringify(
            body?.query
                ? { suggestions: addressMocks[body.query as keyof typeof addressMocks] || [] }
                : {}
        );
    });

    beforeEach((context: ContextWithSuggestions) => {
        clearProviderMocks();
        onSelectSpy.mockClear();

        context.suggestions = createSuggestions(input, {
            type: "address",
            enrichmentEnabled: false,
            onSelect: onSelectSpy,
        });
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
    });

    test("should trigger on full match", async () => {
        setInputValue("A");
        await global.wait(100);

        setInputValue("Albania");
        hitKeyDown("Enter");
        await global.wait(100);

        expect(onSelectSpy).toHaveBeenCalledTimes(1);
        expect(onSelectSpy).toHaveBeenCalledWith(
            appendUnrestrictedValue({
                value: "Albania",
                data: "Al",
            }),
            true
        );
    });

    test("should not trigger on full match if `triggerSelectOnEnter` is false", async (context: ContextWithSuggestions) => {
        context.suggestions.setOptions({ triggerSelectOnEnter: false });

        setInputValue("A");
        await global.wait(100);

        setInputValue("Albania");
        hitKeyDown("Enter");
        await global.wait(100);

        expect(onSelectSpy).not.toHaveBeenCalled();
    });

    test("should trigger when suggestion is selected manually", async () => {
        setInputValue("A");
        await global.wait(100);

        getProviderInstance(0).updateChosenSuggestionIndex(2);

        hitKeyDown("Enter");
        await global.wait(100);

        expect(onSelectSpy).toHaveBeenCalledTimes(1);
        expect(onSelectSpy).toHaveBeenCalledWith(
            appendUnrestrictedValue({
                value: "Andorra",
                data: "An",
            }),
            true
        );
    });

    test("should NOT trigger on partial match", async () => {
        setInputValue("A");
        await global.wait(100);

        setInputValue("Alba");
        hitKeyDown("Enter");
        await global.wait(100);

        expect(onSelectSpy).not.toHaveBeenCalled();
    });

    test("should NOT trigger when nothing matched", async () => {
        setInputValue("A");
        await global.wait(100);

        setInputValue("Alge");
        hitKeyDown("Enter");
        await global.wait(100);

        expect(onSelectSpy).not.toHaveBeenCalled();
    });

    test.for(positiveTestsData)("$name", async ({ query, suggestion, options }, context) => {
        if (options) (context as unknown as ContextWithSuggestions).suggestions.setOptions(options);

        setInputValue(query);
        await global.wait(100);
        hitKeyDown("Enter");
        await global.wait(100);

        expect(onSelectSpy).toHaveBeenCalledTimes(1);
        expect(onSelectSpy).toHaveBeenCalledWith(appendUnrestrictedValue(suggestion), true);
    });

    test.for(negativeTestsData)("$name", async ({ query, options }, context) => {
        if (options) (context as unknown as ContextWithSuggestions).suggestions.setOptions(options);

        setInputValue(query);
        await global.wait(100);
        hitKeyDown("Enter");
        await global.wait(100);

        expect(onSelectSpy).not.toHaveBeenCalled();
    });
});

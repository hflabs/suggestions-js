// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext, vi } from "vitest";
import { CLASSES } from "@/lib/View/view.constants";
import useProviderMocks, {
    type ProviderInstance,
    type SuggestionsInstance,
} from "../../helpers/ProviderMock";
import areSuggestionsVisible from "../../helpers/areSuggestionsVisible";

type ContextWithSuggestions = TestContext & {
    suggestions: SuggestionsInstance;
    providerInstance: ProviderInstance;
};

describe("Autoselect", () => {
    const { input, setInputValue, hitKeyDown, triggerBlur } = global.createInput();
    const { getProviderInstance, clearProviderMocks, createSuggestions } = useProviderMocks();

    beforeEach((context: ContextWithSuggestions) => {
        context.suggestions = createSuggestions(input, {
            type: "name",
            enrichmentEnabled: false,
        });
        context.providerInstance = getProviderInstance(0);
    });

    afterEach((context: ContextWithSuggestions) => {
        context.suggestions.dispose();
        clearProviderMocks();
    });

    test("should hide dropdown if received suggestions contains only one suggestion equal to current", async (context: ContextWithSuggestions) => {
        const suggestions = [
            {
                value: "Some value",
                data: null,
            },
        ];

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("S");
        await global.wait(100);

        expect(areSuggestionsVisible()).toBeTruthy();

        context.providerInstance.updateChosenSuggestionIndex(0);
        hitKeyDown("Enter");
        await global.wait(100);

        expect(areSuggestionsVisible()).toBeFalsy();
    });

    test("should hide dropdown if selected NAME suggestion with all fields filled", async (context: ContextWithSuggestions) => {
        const suggestions = [
            {
                value: "Surname Name Patronymic",
                data: {
                    surname: "Surname",
                    name: "Name",
                    patronymic: "Patronymic",
                    gender: "MALE",
                },
            },
        ];

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("S");
        await global.wait(100);

        expect(areSuggestionsVisible()).toBeTruthy();
        const spy = vi.spyOn(context.providerInstance, "fetchSuggestions");

        context.providerInstance.updateChosenSuggestionIndex(0);
        hitKeyDown("Enter");
        await global.wait(100);

        expect(spy).not.toHaveBeenCalled();
        expect(areSuggestionsVisible()).toBeFalsy();
    });

    test("should hide dropdown if selected NAME suggestion with name and surname filled for IOF", async (context: ContextWithSuggestions) => {
        const suggestions = [
            {
                value: "Николай Александрович",
                data: {
                    surname: "Александрович",
                    name: "Николай",
                    patronymic: null,
                    gender: "MALE",
                },
            },
        ];

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("Н");
        await global.wait(100);

        expect(areSuggestionsVisible()).toBeTruthy();

        const spy = vi.spyOn(context.providerInstance, "fetchSuggestions");

        context.providerInstance.updateChosenSuggestionIndex(0);
        hitKeyDown("Enter");
        await global.wait(100);

        expect(spy).not.toHaveBeenCalled();
        expect(areSuggestionsVisible()).toBeFalsy();
    });

    test("should hide dropdown if selected ADDRESS suggestion with `house` field filled", async (context: ContextWithSuggestions) => {
        const suggestions = [
            {
                value: "Россия, г Москва, ул Арбат, дом 10",
                data: {
                    country: "Россия",
                    city: "Москва",
                    city_type: "г",
                    street: "Арбат",
                    street_type: "ул",
                    house: "10",
                    house_type: "дом",
                },
            },
        ];

        context.suggestions.setOptions({ type: "address" });

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("Р");
        await global.wait(100);

        expect(areSuggestionsVisible()).toBeTruthy();

        const spy = vi.spyOn(context.providerInstance, "fetchSuggestions");

        context.providerInstance.updateChosenSuggestionIndex(0);
        hitKeyDown("Enter");
        await global.wait(100);

        expect(spy).not.toHaveBeenCalled();
        expect(areSuggestionsVisible()).toBeFalsy();
    });

    test("should do nothing if select same suggestion twice", async (context: ContextWithSuggestions) => {
        const onSelect = vi.fn();
        context.suggestions.setOptions({ onSelect });

        const suggestions = [
            {
                value: "Some value",
                unrestricted_value: "Some value",
                data: {},
            },
        ];

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions }));

        setInputValue("S");
        await global.wait(100);

        context.suggestions.setSuggestion(suggestions[0]);

        context.providerInstance.updateChosenSuggestionIndex(0);
        hitKeyDown("Enter");
        await global.wait(100);

        setInputValue("Ss");
        await global.wait(100);

        expect(onSelect).not.toHaveBeenCalled();
    });

    test("should show hint if no suggestions received", async (context: ContextWithSuggestions) => {
        context.suggestions.setOptions({ type: "address" });

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: [] }));

        setInputValue("Р");
        await global.wait(100);

        const hint = document.querySelector(`.${CLASSES.hint}`);

        expect(hint).toBeTruthy();
        expect(hint?.innerHTML).toStrictEqual(context.providerInstance.getNoSuggestionsHint());
        expect(areSuggestionsVisible()).toBeTruthy();
    });

    test("should wait for closeDelay", async (context: ContextWithSuggestions) => {
        const delay = 300;

        context.suggestions.setOptions({
            type: "address",
            closeDelay: delay,
        });

        global.fetchMocker.mockResponse(JSON.stringify({ suggestions: [{ value: "some value" }] }));

        expect(document.querySelector(`.${CLASSES.wrapper}`)?.classList).not.toContain(
            CLASSES.wrapper_active
        );

        setInputValue("S");
        await global.wait(100);

        expect(areSuggestionsVisible()).toBeTruthy();

        expect(document.querySelector(`.${CLASSES.wrapper}`)?.classList).toContain(
            CLASSES.wrapper_active
        );

        triggerBlur();
        await global.wait(10);

        expect(areSuggestionsVisible()).toBeTruthy();
        expect(document.querySelector(`.${CLASSES.wrapper}`)?.classList).not.toContain(
            CLASSES.wrapper_active
        );

        await global.wait(delay);

        expect(areSuggestionsVisible()).toBeFalsy();
        expect(document.querySelector(`.${CLASSES.wrapper}`)?.classList).not.toContain(
            CLASSES.wrapper_active
        );
    });
});

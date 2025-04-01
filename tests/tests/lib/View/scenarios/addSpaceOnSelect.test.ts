// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, type TestContext } from "vitest";
import useProviderMocks, {
    type ProviderInstance,
    type SuggestionsInstance,
} from "../helpers/ProviderMock";

type ContextWithSuggestions = TestContext & {
    suggestions: SuggestionsInstance;
    providerInstance: ProviderInstance;
};

const getNameSuggestions = (data: { [k: string]: string }, value: string) => [
    {
        value,
        data: {
            surname: null,
            name: null,
            patronymic: null,
            gender: "MALE",
            ...data,
        },
    },
];

describe("Autoselect", async () => {
    const { input, setInputValue, hitKeyDown } = global.createInput();
    const { getProviderInstance, clearProviderMocks, createSuggestions } = useProviderMocks();

    describe("For NAME controls", () => {
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

        test("should add SPACE at the end if only NAME specified", async (context: ContextWithSuggestions) => {
            global.fetchMocker.mockResponse(
                JSON.stringify({ suggestions: getNameSuggestions({ name: "Name" }, "Name") })
            );

            setInputValue("N");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Name ");
        });

        test("should add SPACE at the end if only SURNAME specified", async (context: ContextWithSuggestions) => {
            global.fetchMocker.mockResponse(
                JSON.stringify({
                    suggestions: getNameSuggestions({ surname: "Surname" }, "Surname"),
                })
            );

            setInputValue("S");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Surname ");
        });

        test("should add SPACE at the end if only NAME and PATRONYMIC specified", async (context: ContextWithSuggestions) => {
            global.fetchMocker.mockResponse(
                JSON.stringify({
                    suggestions: getNameSuggestions(
                        {
                            name: "Name",
                            patronymic: "Patronymic",
                        },
                        "Name Patronymic"
                    ),
                })
            );

            setInputValue("N");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Name Patronymic ");
        });

        test("should not add SPACE at the end if full name specified", async (context: ContextWithSuggestions) => {
            global.fetchMocker.mockResponse(
                JSON.stringify({
                    suggestions: [
                        {
                            value: "Surname Name Patronymic",
                            data: {
                                surname: "Surname",
                                name: "Name",
                                patronymic: "Patronymic",
                                gender: "MALE",
                            },
                        },
                    ],
                })
            );

            setInputValue("S");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Surname Name Patronymic");
        });

        test("should not add SPACE if only part expected", async (context: ContextWithSuggestions) => {
            context.suggestions.setOptions({ params: { parts: ["SURNAME"] } });

            global.fetchMocker.mockResponse(
                JSON.stringify({
                    suggestions: getNameSuggestions({ surname: "Surname" }, "Surname"),
                })
            );

            setInputValue("S");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Surname");
        });

        test("should not add SPACE if only part expected (params set as function)", async (context: ContextWithSuggestions) => {
            context.suggestions.setOptions({
                params() {
                    return {
                        parts: ["SURNAME"],
                    };
                },
            });

            global.fetchMocker.mockResponse(
                JSON.stringify({
                    suggestions: getNameSuggestions({ surname: "Surname" }, "Surname"),
                })
            );

            setInputValue("S");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Surname");
        });
    });

    describe("For ADDRESS controls", () => {
        beforeEach((context: ContextWithSuggestions) => {
            context.suggestions = createSuggestions(input, {
                type: "address",
                enrichmentEnabled: false,
            });
            context.providerInstance = getProviderInstance(0);
        });

        afterEach((context: ContextWithSuggestions) => {
            context.suggestions.dispose();
            clearProviderMocks();
        });

        test("should add SPACE at the end if only COUNTRY specified", async (context: ContextWithSuggestions) => {
            global.fetchMocker.mockResponse(
                JSON.stringify({
                    suggestions: [
                        {
                            value: "Россия",
                            data: { country: "Россия" },
                        },
                    ],
                })
            );

            setInputValue("S");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Россия ");
        });

        test("should add SPACE at the end if COUNTRY..HOUSE specified", async (context: ContextWithSuggestions) => {
            global.fetchMocker.mockResponse(
                JSON.stringify({
                    suggestions: [
                        {
                            value: "Россия, г Москва, ул Арбат, д 1",
                            data: {
                                country: "Россия",
                                city: "Москва",
                                city_type: "г",
                                street: "Арбат",
                                street_type: "ул",
                                house_type: "д",
                                house: "1",
                            },
                        },
                    ],
                })
            );

            setInputValue("S");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Россия, г Москва, ул Арбат, д 1 ");
        });

        test("should not add SPACE at the end if FLAT specified", async (context: ContextWithSuggestions) => {
            global.fetchMocker.mockResponse(
                JSON.stringify({
                    suggestions: [
                        {
                            value: "Россия, г Москва, ул Арбат, д 1, кв 22",
                            data: {
                                country: "Россия",
                                city: "Москва",
                                city_type: "г",
                                street: "Арбат",
                                street_type: "ул",
                                house: "1",
                                house_type: "д",
                                flat: "22",
                                flat_type: "кв",
                            },
                        },
                    ],
                })
            );

            setInputValue("S");
            await global.wait(100);

            context.providerInstance.updateChosenSuggestionIndex(0);
            hitKeyDown("Enter");
            await global.wait(100);

            expect(input.value).toStrictEqual("Россия, г Москва, ул Арбат, д 1, кв 22");
        });
    });
});

// @vitest-environment jsdom

import { describe, test, expect, type TestContext, beforeEach } from "vitest";
import { createSuggestions } from "@/index";
import type { Suggestion } from "@/lib/types";
import address from "@tests/tests/lib/Provider/mocks/address";
import chooseSuggestion from "@tests/tests/lib/View/helpers/chooseSuggestion";

type Suggestions = {
    suggestions: ReturnType<typeof createSuggestions>;
    input: HTMLInputElement;
    setInputValue: (value: string) => void;
};

type ContextWithSuggestions = TestContext & {
    instance: Suggestions;
    parent: Suggestions;
};

type ContextWithFullSuggestions = ContextWithSuggestions & { child: Suggestions };

const createInstance = (parent?: ReturnType<typeof createSuggestions>) => {
    const { input, setInputValue } = globalThis.createInput();
    const suggestions = createSuggestions(input, { type: "address" }, parent);

    return {
        input,
        setInputValue,
        suggestions,
    };
};

const makeSuggestion = (data: Suggestion["data"]) => ({
    value: "",
    unrestricted_value: "",
    data,
});

const getReqLocations = () =>
    JSON.parse((global.fetchMocker.mock.calls[0]?.[1]?.body as string) || "").locations;

const getReqRestrictValue = () =>
    JSON.parse((global.fetchMocker.mock.calls[0]?.[1]?.body as string) || "").restrict_value;

describe("Granular wrapper", () => {
    beforeEach((context: ContextWithSuggestions) => {
        context.parent = createInstance();
        context.instance = createInstance(context.parent.suggestions);

        context.parent.suggestions.setOptions({
            params: {
                from_bound: { value: "region" },
                to_bound: { value: "area" },
            },
        });

        context.instance.suggestions.setOptions({
            params: {
                from_bound: { value: "city" },
                to_bound: { value: "settlement" },
            },
        });

        global.fetchMocker.resetMocks();
        global.fetchMocker.mockClear();

        return () => {
            context.instance.suggestions.dispose();
            context.parent.suggestions.dispose();
        };
    });

    describe("Use proper locations fields", () => {
        test("should skip unnecessary fields", async (context: ContextWithSuggestions) => {
            context.parent.suggestions.setSuggestion(
                makeSuggestion({
                    country: "Россия",
                    region: "Самарская",
                    region_type: "обл",
                    postal_code: "445020",
                    okato: "36440373000",
                })
            );

            context.instance.setInputValue("a");
            await wait(100);

            expect(getReqLocations()).toMatchObject([
                {
                    country: "Россия",
                    region: "Самарская",
                },
            ]);
        });

        test("should use kladr id if specified", async (context: ContextWithSuggestions) => {
            context.parent.suggestions.setSuggestion(
                makeSuggestion({
                    city: "Тольятти",
                    kladr_id: "6300000700000",
                })
            );

            context.instance.setInputValue("a");
            await wait(100);

            expect(Object.keys(getReqLocations()[0])).toEqual(["kladr_id"]);
        });

        test("should use fias id if specified", async (context: ContextWithSuggestions) => {
            context.parent.suggestions.setSuggestion(
                makeSuggestion({
                    city: "Тольятти",
                    kladr_id: "6300000700000",
                    region_fias_id: "1000000",
                    area_fias_id: "1000000",
                })
            );

            context.instance.setInputValue("a");
            await wait(100);

            expect(Object.keys(getReqLocations()[0])).toEqual(["region_fias_id", "area_fias_id"]);
        });

        test("should use fields inside parent bounds", async (context: ContextWithSuggestions) => {
            context.parent.suggestions.setSuggestion(
                makeSuggestion({
                    country: "Россия",
                    region: "Самарская",
                    city: "Тольятти",
                    street: "Садовая",
                })
            );

            context.instance.setInputValue("a");
            await wait(100);

            expect(Object.keys(getReqLocations()[0])).toEqual(["country", "region"]);

            global.fetchMocker.mockClear();

            context.parent.suggestions.setOptions({
                params: {
                    from_bound: { value: "region" },
                    to_bound: { value: "street" },
                },
            });

            context.instance.suggestions.setOptions({
                params: {
                    from_bound: { value: "house" },
                    to_bound: { value: "flat" },
                },
            });

            context.instance.setInputValue("a");
            await wait(100);

            expect(Object.keys(getReqLocations()[0])).toEqual([
                "country",
                "region",
                "city",
                "street",
            ]);
        });

        test("should transform kladr_id to bounds", async (context: ContextWithSuggestions) => {
            context.parent.suggestions.setSuggestion(
                makeSuggestion({
                    city: "Тольятти",
                    kladr_id: "63000007011111111111",
                })
            );

            context.instance.setInputValue("a");
            await wait(100);

            expect(getReqLocations()[0]).toStrictEqual({ kladr_id: "6300000000000" });

            context.parent.suggestions.setOptions({
                params: {
                    from_bound: { value: "region" },
                    to_bound: { value: "city" },
                },
            });

            global.fetchMocker.mockClear();

            context.instance.setInputValue("a");
            await wait(100);

            expect(getReqLocations()[0]).toStrictEqual({ kladr_id: "6300000700000" });
        });

        test("should use 'x_type_full' fields", async (context: ContextWithSuggestions) => {
            context.parent.suggestions.setOptions({
                params: {
                    from_bound: { value: "region" },
                    to_bound: { value: "street" },
                },
            });

            context.instance.suggestions.setOptions({
                params: {
                    from_bound: { value: "house" },
                    to_bound: { value: "flat" },
                },
            });

            const locations = {
                region_type_full: "region",
                area_type_full: "area",
                city_type_full: "city",
                city_district_type_full: "city_district",
                settlement_type_full: "settlement",
                street_type_full: "street",
            };

            context.parent.suggestions.setSuggestion(makeSuggestion(locations));

            context.instance.setInputValue("a");
            await wait(100);

            expect(getReqLocations()).toMatchObject([locations]);
        });
    });

    describe("Handle parent instance", () => {
        describe("Use parent data as locations constraints", () => {
            test("should use parent suggestion as a constraint in child", async (context: ContextWithSuggestions) => {
                context.parent.suggestions.setSuggestion(
                    makeSuggestion({
                        region: "Санкт-Петербург",
                        region_type: "г",
                        kladr_id: "7800000000000",
                    })
                );

                context.instance.setInputValue("a");
                await wait(100);

                expect(getReqLocations()).toMatchObject([{ kladr_id: "7800000000000" }]);
                expect(getReqRestrictValue()).toBeTruthy();
            });

            test("should use parent suggestion from parents chain", async (context: ContextWithSuggestions) => {
                const child = createInstance(context.instance.suggestions);

                child.suggestions.setOptions({
                    params: {
                        from_bound: { value: "street" },
                        to_bound: { value: "street" },
                    },
                });

                context.parent.suggestions.setSuggestion(makeSuggestion({ region: "region" }));

                child.setInputValue("a");
                await wait(100);

                expect.soft(getReqLocations()).toMatchObject([{ region: "region" }]);
                expect.soft(getReqRestrictValue()).toBeTruthy();

                global.fetchMocker.mockClear();

                context.instance.suggestions.setSuggestion(makeSuggestion({ city: "city" }));

                child.setInputValue("a");
                await wait(100);

                expect.soft(getReqLocations()).toMatchObject([{ city: "city" }]);
                expect.soft(getReqRestrictValue()).toBeTruthy();

                child.suggestions.dispose();
            });

            test("should use locations from params if no suggestion selected", async (context: ContextWithSuggestions) => {
                context.parent.suggestions.setOptions({
                    params: {
                        locations: [{ region: "custom_region" }],
                        from_bound: { value: "region" },
                        to_bound: { value: "area" },
                    },
                });

                context.instance.setInputValue("a");
                await wait(100);

                expect(getReqLocations()).toMatchObject([{ region: "custom_region" }]);
                expect(getReqRestrictValue()).toBeTruthy();
            });

            test("prefer parent suggestion rather then locations from params", async (context: ContextWithSuggestions) => {
                const child = createInstance(context.instance.suggestions);

                child.suggestions.setOptions({
                    params: {
                        from_bound: { value: "street" },
                        to_bound: { value: "street" },
                    },
                });

                context.parent.suggestions.setSuggestion(
                    makeSuggestion({ region: "region_from_suggestion" })
                );
                context.instance.suggestions.setOptions({
                    params: {
                        locations: [{ city: "city" }],
                        from_bound: { value: "city" },
                        to_bound: { value: "settlement" },
                    },
                });

                child.setInputValue("a");
                await wait(100);

                expect(getReqLocations()).toMatchObject([{ region: "region_from_suggestion" }]);
                expect(getReqRestrictValue()).toBeTruthy();
            });

            test("don't restrict value when no locations", async (context: ContextWithSuggestions) => {
                context.instance.setInputValue("a");
                await wait(100);

                expect(getReqLocations()).toBeUndefined();
                expect(getReqRestrictValue()).toBeFalsy();
            });
        });

        describe("Fill parent instance data on select", () => {
            test("fill empty parent control when suggestion is selected in child", async (context: ContextWithSuggestions) => {
                global.fetchMocker.mockOnce(
                    JSON.stringify({ suggestions: [address.fullyAddress] })
                );

                context.instance.setInputValue("a");
                await wait(100);

                chooseSuggestion(0);
                await wait(100);

                expect(context.parent.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");
            });

            test("fill non-empty parent control when suggestion is selected in child", async (context: ContextWithSuggestions) => {
                global.fetchMocker.mockOnce(
                    JSON.stringify({ suggestions: [address.fullyAddress] })
                );

                context.parent.suggestions.setSuggestion({
                    value: "Новосибирская обл",
                    unrestricted_value: "Новосибирская обл",
                    data: { region: "новосибирская" },
                });

                expect(context.parent.input.value).toEqual("новосибирская");

                context.instance.setInputValue("a");
                await wait(100);

                chooseSuggestion(0);
                await wait(100);

                expect(context.parent.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");
            });

            test("not fill non-empty parent control with bounded data same as selected", async (context: ContextWithSuggestions) => {
                const selectionData = {
                    country: "Россия",
                    region_type: "обл",
                    region_type_full: "область",
                    region: "Тульская",
                    region_with_type: "Тульская обл",
                    area_type: "р-н",
                    area_type_full: "район",
                    area: "Узловский",
                    area_with_type: "Узловский р-н",
                };

                global.fetchMocker.mockOnce(
                    JSON.stringify({ suggestions: [address.fullyAddress] })
                );

                context.parent.suggestions.setSuggestion({
                    value: "Тульская, Узловский",
                    unrestricted_value: "Тульская, Узловский",
                    data: selectionData,
                });

                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");

                context.instance.setInputValue("a");
                await wait(100);

                chooseSuggestion(0);
                await wait(100);

                expect(context.parent.suggestions.getSelection()?.data).toMatchObject(
                    selectionData
                );
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");
            });

            test("spread data to all parents", async (context: ContextWithSuggestions) => {
                const child = createInstance(context.instance.suggestions);

                child.suggestions.setOptions({
                    params: {
                        from_bound: { value: "street" },
                        to_bound: { value: "street" },
                    },
                });

                global.fetchMocker.mockOnce(
                    JSON.stringify({ suggestions: [address.fullyAddress] })
                );

                child.setInputValue("a");
                await wait(100);

                chooseSuggestion(0);
                await wait(100);

                expect(context.parent.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");

                expect(context.instance.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
                expect(context.instance.input.value).toEqual("г Узловая, поселок Брусянский");
            });

            test("fill parents on fixData", async (context: ContextWithSuggestions) => {
                const child = createInstance(context.instance.suggestions);

                child.suggestions.setOptions({
                    params: {
                        from_bound: { value: "street" },
                        to_bound: { value: "street" },
                    },
                });

                global.fetchMocker.mockOnce(
                    JSON.stringify({ suggestions: [address.fullyAddress] })
                );

                child.suggestions.fixData("a");
                await wait(100);

                expect(context.parent.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");

                expect(context.instance.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
                expect(context.instance.input.value).toEqual("г Узловая, поселок Брусянский");
            });
        });

        describe("Clear child on parent change", () => {
            beforeEach(async (context: ContextWithFullSuggestions) => {
                global.fetchMocker.mockOnce(
                    JSON.stringify({ suggestions: [address.fullyAddress] })
                );

                context.child = createInstance(context.instance.suggestions);

                context.child.suggestions.setOptions({
                    params: {
                        from_bound: { value: "street" },
                        to_bound: { value: "street" },
                    },
                });

                context.child.setInputValue("a");
                await wait(100);

                chooseSuggestion(0);
                await wait(100);

                return () => {
                    context.child.suggestions.dispose();
                };
            });

            test("clear children on parent input change", async (context: ContextWithFullSuggestions) => {
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");
                expect(context.instance.input.value).toEqual("г Узловая, поселок Брусянский");
                expect(context.child.input.value).toEqual("ул Строителей");

                context.parent.setInputValue("а");
                await wait(100);

                expect(context.instance.input.value).toEqual("");
                expect(context.child.input.value).toEqual("");

                expect(context.instance.suggestions.getSelection()).toBeNull();
                expect(context.child.suggestions.getSelection()).toBeNull();
            });

            test("clear children on parent clear", async (context: ContextWithFullSuggestions) => {
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");
                expect(context.instance.input.value).toEqual("г Узловая, поселок Брусянский");
                expect(context.child.input.value).toEqual("ул Строителей");

                context.parent.suggestions.clear();
                await wait(100);

                expect(context.instance.input.value).toEqual("");
                expect(context.child.input.value).toEqual("");

                expect(context.instance.suggestions.getSelection()).toBeNull();
                expect(context.child.suggestions.getSelection()).toBeNull();
            });

            test("clear children on parent select", async (context: ContextWithFullSuggestions) => {
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");
                expect(context.instance.input.value).toEqual("г Узловая, поселок Брусянский");
                expect(context.child.input.value).toEqual("ул Строителей");

                global.fetchMocker.mockOnce(
                    JSON.stringify({
                        suggestions: [
                            address.fullyAddress,
                            {
                                value: "new",
                                data: { region: "new region" },
                            },
                        ],
                    })
                );

                context.parent.input.focus();
                await wait(100);

                chooseSuggestion(1);
                await wait(100);

                expect(context.instance.input.value).toEqual("");
                expect(context.child.input.value).toEqual("");

                expect(context.instance.suggestions.getSelection()).toBeNull();
                expect(context.child.suggestions.getSelection()).toBeNull();
            });

            test("don't clear children on parent enrich", async (context: ContextWithFullSuggestions) => {
                expect(context.parent.input.value).toEqual("Тульская обл, Узловский р-н");
                expect(context.instance.input.value).toEqual("г Узловая, поселок Брусянский");
                expect(context.child.input.value).toEqual("ул Строителей");

                global.fetchMocker.mockOnce(
                    JSON.stringify({
                        suggestions: [
                            address.fullyAddress,
                            {
                                value: "new",
                                data: { region: "new region" },
                            },
                        ],
                    })
                );

                context.parent.input.focus();
                await wait(100);

                chooseSuggestion(0);
                await wait(100);

                expect(context.instance.input.value).toEqual("г Узловая, поселок Брусянский");
                expect(context.child.input.value).toEqual("ул Строителей");

                expect(context.instance.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
                expect(context.child.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
            });
        });

        describe("Ignore invalid parent", () => {
            const data = [
                {
                    type: "invalid type",
                    options: { type: "email" },
                },
                {
                    type: "invalid bounds",
                    options: {
                        params: {
                            from_bound: { value: "invalid" },
                            to_bound: { value: "area" },
                        },
                    },
                },
                {
                    type: "more specific bounds",
                    options: {
                        params: {
                            from_bound: { value: "street" },
                            to_bound: { value: "house" },
                        },
                    },
                },
            ];

            test.for(data)("ignore parent with $type", async ({ options }, ctx) => {
                const context = ctx as unknown as ContextWithFullSuggestions;

                context.parent.suggestions.setOptions(options);

                context.parent.suggestions.setSuggestion(
                    makeSuggestion({
                        region: "Санкт-Петербург",
                        region_type: "г",
                        kladr_id: "7800000000000",
                    })
                );

                global.fetchMocker.mockClear();
                global.fetchMocker.mockOnce(
                    JSON.stringify({ suggestions: [address.fullyAddress] })
                );

                context.instance.setInputValue("a");
                await wait(100);

                chooseSuggestion(0);
                await wait(100);

                expect(getReqLocations()).toBeUndefined();
                expect(getReqRestrictValue()).toBeFalsy();

                context.parent.suggestions.clear();
                await wait(100);

                expect(context.instance.input.value).toEqual("г Узловая, поселок Брусянский");
                expect(context.instance.suggestions.getSelection()?.data).toMatchObject(
                    address.fullyAddress.data
                );
            });
        });
    });
});

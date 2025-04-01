// @vitest-environment jsdom

import { describe, test, expect, vi, TestContext, beforeEach } from "vitest";
import type { createSuggestions } from "@/index";

type ContextWithSuggestions = TestContext & {
    createSuggestions: typeof createSuggestions;
};

const locationMock = {
    location: {
        data: {
            region: "Москва",
            kladr_id: "7700000000000",
        },
        value: "1.2.3.4",
    },
};

const findGeoRequest = () =>
    global.fetchMocker.mock.calls
        .map((c) => c[0])
        .find((url) => typeof url === "string" && url.includes("iplocate/address"));

const token = "123";

describe("Geolocataion wrapper", () => {
    const { input, setInputValue } = globalThis.createInput();

    beforeEach(async (context: ContextWithSuggestions) => {
        vi.resetModules();
        global.fetchMocker.resetMocks();
        global.fetchMocker.mockClear();

        const module = await import("@/index");
        context.createSuggestions = module.createSuggestions;
    });

    test("should send geolocation request if no `geolocation` option specified", async (context: ContextWithSuggestions) => {
        const suggs = context.createSuggestions(input, {
            type: "address",
            token,
        });

        expect.soft(findGeoRequest()).toBeTruthy();
        suggs.dispose();
    });

    test("should not send geolocation request if `geolocation` set to false", async (context: ContextWithSuggestions) => {
        const suggs = context.createSuggestions(input, {
            type: "address",
            token,
            geolocation: false,
        });

        expect.soft(findGeoRequest()).toBeFalsy();
        suggs.dispose();
    });

    test("dont refetch on params change", async (context: ContextWithSuggestions) => {
        const suggs = context.createSuggestions(input, {
            type: "address",
            token,
        });

        expect.soft(findGeoRequest()).toBeTruthy();
        global.fetchMocker.mockClear();

        suggs.setOptions({ type: "bank" });

        expect.soft(findGeoRequest()).toBeFalsy();

        suggs.setOptions({
            type: "party",
            token: "newToken",
        });
        expect.soft(findGeoRequest()).toBeFalsy();

        suggs.dispose();
    });

    test("should handle user params", async (context: ContextWithSuggestions) => {
        global.fetchMocker.mockIf(/iplocate\/address/, async () => JSON.stringify(locationMock));
        const customOpts = { customParam: 2 };

        const suggs = context.createSuggestions(input, {
            type: "address",
            token,
            params: customOpts,
        });

        global.fetchMocker.mockClear();

        setInputValue("A");
        await global.wait(100);

        const body = JSON.parse((global.fetchMocker.mock.calls[0][1]?.body as string) || "");

        expect.soft(body).toMatchObject({
            ...customOpts,
            locations_boost: [{ kladr_id: locationMock.location.data.kladr_id }],
        });

        const newOpts = {
            newCustomParam: 35,
            locations_boost: [{ kladr_id: "0000" }],
        };

        suggs.setOptions({ params: newOpts });
        global.fetchMocker.mockClear();

        setInputValue("A");
        await global.wait(100);

        const newBody = JSON.parse((global.fetchMocker.mock.calls[0][1]?.body as string) || "");

        expect.soft(newBody).toMatchObject({
            ...newOpts,
            locations_boost: [{ kladr_id: locationMock.location.data.kladr_id }],
        });

        suggs.dispose();
    });

    test("should send geolocation request for party", async (context: ContextWithSuggestions) => {
        const suggs = context.createSuggestions(input, {
            type: "party",
            token,
        });

        expect.soft(findGeoRequest()).toBeTruthy();
        suggs.dispose();
    });

    test("should send geolocation request for bank", async (context: ContextWithSuggestions) => {
        const suggs = context.createSuggestions(input, {
            type: "bank",
            token,
        });

        expect.soft(findGeoRequest()).toBeTruthy();
        suggs.dispose();
    });

    test("should send location with request", async (context: ContextWithSuggestions) => {
        global.fetchMocker.mockIf(/iplocate\/address/, async () => JSON.stringify(locationMock));

        const suggs = context.createSuggestions(input, {
            type: "address",
            token,
        });

        global.fetchMocker.mockClear();

        setInputValue("A");
        await global.wait(100);

        expect
            .soft(global.fetchMocker.mock.calls[0][1]?.body)
            .toContain('"locations_boost":[{"kladr_id":"7700000000000"}]');

        global.fetchMocker.mockClear();

        const newInput = createInput();

        const other = context.createSuggestions(newInput.input, {
            type: "address",
            token,
        });

        expect.soft(global.fetchMocker).not.toHaveBeenCalled();

        newInput.setInputValue("A");
        await global.wait(100);

        expect
            .soft(global.fetchMocker.mock.calls[0][1]?.body)
            .toContain('"locations_boost":[{"kladr_id":"7700000000000"}]');

        other.setOptions({ type: "name" });
        global.fetchMocker.mockClear();

        newInput.setInputValue("A");
        await global.wait(100);

        expect
            .soft(global.fetchMocker.mock.calls[0][1]?.body)
            .not.toContain('"locations_boost":[{"kladr_id":"7700000000000"}]');

        suggs.dispose();
        other.dispose();
    });
});

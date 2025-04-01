import { describe, test, expect } from "vitest";

import { getBoundedValue } from "@/index";
import address from "@tests/tests/lib/Provider/mocks/address";

describe("Handle restrictions", () => {
    const testData = [
        {
            name: "should show only city if region equals to city",
            params: {
                type: "address" as const,
                bounds: "region-city",
            },
            mocks: address.regionCity,
            result: "г Москва",
        },
        {
            name: "should include city district in single input",
            params: {
                type: "address" as const,
                bounds: "city_district",
            },
            mocks: address.cityDistrict,
            result: "Адлерский р-н",
        },
    ];

    test.for(testData)("$name", async (data) => {
        const suggestionValue = getBoundedValue({
            bounds: {
                from_bound: { value: data.params.bounds.split("-")[0] },
                to_bound: { value: data.params.bounds.split("-")[1] },
            },
            suggestion: data.mocks.suggestions[0],
            type: data.params.type,
        });

        expect(suggestionValue).toStrictEqual(data.result);
    });
});

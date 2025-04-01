import { describe, test, expect } from "vitest";

import { getBoundedValue } from "@/index";

describe("Bounds", () => {
    test("get suggestion value with bounds", () => {
        const updatedValue = getBoundedValue({
            suggestion: {
                value: "Тульская обл, Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара",
                unrestricted_value:
                    "Тульская обл, Узловский р-н, г Узловая, поселок Брусянский, ул Строителей, д 1-бара",
                data: {
                    country: "Россия",
                    region_type: "обл",
                    region_type_full: "область",
                    region: "Тульская",
                    region_with_type: "Тульская обл",
                    area_type: "р-н",
                    area_type_full: "район",
                    area: "Узловский",
                    area_with_type: "Узловский р-н",
                    city_type: "г",
                    city_type_full: "город",
                    city: "Узловая",
                    city_with_type: "г Узловая",
                    settlement_type: "п",
                    settlement_type_full: "поселок",
                    settlement: "Брусянский",
                    settlement_with_type: "поселок Брусянский",
                    street_type: "ул",
                    street_type_full: "улица",
                    street: "Строителей",
                    street_with_type: "ул Строителей",
                    house_type: "д",
                    house_type_full: "дом",
                    house: "1-бара",
                    kladr_id: "7102200100200310001",
                },
            },
            bounds: {
                from_bound: { value: "city" },
                to_bound: { value: "settlement" },
            },
            type: "address",
        });

        expect(updatedValue).toEqual("г Узловая, поселок Брусянский");
    });
});

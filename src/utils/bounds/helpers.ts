import type { Suggestion } from "@/lib/types";

export interface Bounds {
    from_bound: { value: string };
    to_bound: { value: string };
}

const addressBounds = [
    "country",
    "region",
    "area",
    "city",
    "city_district",
    "settlement",
    "street",
    "house",
    "flat",
];

const fiasBounds = [
    "region",
    "area",
    "city",
    "city_district",
    "settlement",
    "planning_structure",
    "street",
    "house",
];

const fiasIDFields: Record<string, string[]> = {
    country: ["country_iso_code"],
    region: ["region_iso_code", "region_fias_id"],
    area: ["area_fias_id"],
    city: ["city_fias_id"],
    city_district: ["city_district_fias_id"],
    settlement: ["settlement_fias_id"],
    planning_structure: ["planning_structure_fias_id"],
    street: ["street_fias_id"],
};

export const fiasIDFieldNames = Object.values(fiasIDFields).flat();

const kladrFormats = {
    country: {
        digits: 0,
        zeros: 13,
    },
    region: {
        digits: 2,
        zeros: 11,
    },
    area: {
        digits: 5,
        zeros: 8,
    },
    city: {
        digits: 8,
        zeros: 5,
    },
    city_district: {
        digits: 11,
        zeros: 2,
    },
    settlement: {
        digits: 11,
        zeros: 2,
    },
    planning_structure: {
        digits: 15,
        zeros: 2,
    },
    street: {
        digits: 15,
        zeros: 2,
    },
    house: {
        digits: 19,
        zeros: 0,
    },
    flat: {
        digits: 19,
        zeros: 0,
    },
};

export const getFieldNames = (baseFieldName: string) => ({
    type: `${baseFieldName}_type`,
    withType: `${baseFieldName}_with_type`,
    typeFull: `${baseFieldName}_type_full`,
    base: baseFieldName,
});

export const getFiasFieldNames = (name: string) => fiasIDFields[name] || [];

export const getValueWithType = (
    baseFieldName: string,
    suggestionData: Suggestion["data"],
    composeTypeFirst = true
) => {
    const names = getFieldNames(baseFieldName);

    const valueWithType: string | undefined = suggestionData[names.withType];

    const composedValues = composeTypeFirst
        ? [suggestionData[names.type], suggestionData[names.base]]
        : [suggestionData[names.base], suggestionData[names.type]];

    const fullValueWithType: string | undefined = suggestionData[names.typeFull];

    return valueWithType || composedValues.filter(Boolean).join(" ") || fullValueWithType;
};

export const getBoundsIds = (bounds: Partial<Bounds>, type: "address" | "fias", all?: boolean) => {
    if (!["address", "fias"].includes(type)) return [];

    const boundsFields = type === "address" ? addressBounds : fiasBounds;

    const fromIndex = boundsFields.indexOf(bounds.from_bound?.value || "");
    const toIndex = boundsFields.indexOf(bounds.to_bound?.value || "");

    if ((fromIndex === -1 && !all) || toIndex === -1) return [];

    return boundsFields.slice(all ? 0 : fromIndex, toIndex + 1);
};

/**
 * Подгоняет kladr_id под уровень правой границы bounds.
 */
export const getBoundedKladr = (kladr: string, boundTo: string | undefined) => {
    const format = kladrFormats[boundTo as keyof typeof kladrFormats];

    if (!kladr || !format) return;

    return kladr.slice(0, format.digits) + "0".repeat(format.zeros);
};

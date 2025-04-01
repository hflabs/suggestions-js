import type { AnyData, Suggestion } from "@/lib/types";
import type { EnrichedPlugin, Locations, Options } from "@/wrappers/granular/types";

import { fiasIDFieldNames } from "@/utils/bounds/helpers";
import { getBoundedSuggestion } from "@/utils/bounds";
import { WRAPPER_PROXY_FIELD } from "@/wrappers/optionsSpy/options.constants";
import { OPTIONS_ID } from "@/wrappers/granular/granular.constants";

const locationsFieldsAddress = [
    "kladr_id",
    "postal_code",
    "country_iso_code",
    "country",
    "region_iso_code",
    "region_fias_id",
    "region_type_full",
    "region",
    "area_fias_id",
    "area_type_full",
    "area",
    "city_fias_id",
    "city_type_full",
    "city",
    "city_district_fias_id",
    "city_district_type_full",
    "city_district",
    "settlement_fias_id",
    "settlement_type_full",
    "settlement",
    "street_fias_id",
    "street_type_full",
    "street",
    "house",
];

const locationsFieldsFias = [
    "kladr_id",
    "region_fias_id",
    "region_type_full",
    "region",
    "area_fias_id",
    "area_type_full",
    "area",
    "city_fias_id",
    "city_type_full",
    "city",
    "city_district_fias_id",
    "city_district_type_full",
    "city_district",
    "settlement_fias_id",
    "settlement_type_full",
    "settlement",
    "planning_structure_fias_id",
    "planning_structure_type_full",
    "planning_structure",
    "street_fias_id",
    "street_type_full",
    "street",
];

const getLocationFields = (suggestion: Suggestion, type: "address" | "fias") => {
    if (!["address", "fias"].includes(type)) return {};

    const availableFields = type === "address" ? locationsFieldsAddress : locationsFieldsFias;

    const hasFiasKeys = fiasIDFieldNames.some(
        (field) => availableFields.includes(field) && suggestion.data[field]
    );

    if (!hasFiasKeys && suggestion.data.kladr_id) return { kladr_id: suggestion.data.kladr_id };

    return Object.fromEntries(
        Object.entries(suggestion.data).filter(([key, value]) => {
            if (!value || !availableFields.includes(key)) return false;
            if (!hasFiasKeys) return true;
            return fiasIDFieldNames.includes(key);
        })
    );
};

export const getParams = (query: string, params: Options<AnyData>["params"]) => {
    if (!params) return {};
    return typeof params === "function" ? params(query) : params;
};

/**
 * Формирует список ограничений по locations на основе цепочки родительских инстансов.
 *
 * Если есть валидный родительский инстанс с выбранной подсказкой
 * - собирает список значимых полей из этой подсказки,
 * иначе - возвращает список locations из параметров родителя
 */
export const getLocations = <T extends AnyData = AnyData>(
    query: string,
    parentsChain: EnrichedPlugin[],
    options: Options<T>
) => {
    const parentWithSuggestion = parentsChain.find((instance) => {
        const { type } = instance[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);
        if (!["address", "fias"].includes(type)) return false;
        return !!instance.getSelection();
    });

    const parentSuggestion = parentWithSuggestion?.getSelection();
    const parentParams = getParams(query, parentWithSuggestion?.getOptions().params);
    const type = options.type as "address" | "fias";

    const params = getParams(query, options.params);

    let parentSuggestionLocations: Locations;
    const instanceLocations = params.locations as Locations;

    if (parentSuggestion) {
        const boundedSuggestion = getBoundedSuggestion({
            bounds: parentParams,
            suggestion: parentSuggestion,
            type,
        });
        parentSuggestionLocations = [getLocationFields(boundedSuggestion, type)];
    }

    const parentLocations = parentsChain
        .map((instance) => {
            const instanceQuery = instance.getCurrentValue() || "";
            const instanceOptions = instance[WRAPPER_PROXY_FIELD].getOptions(OPTIONS_ID);
            return getParams(instanceQuery, instanceOptions.params).locations as Locations;
        })
        .find(Boolean);

    const locations = parentSuggestionLocations || parentLocations || instanceLocations;

    return {
        locations,
        restrict_value: Boolean(locations),
    };
};

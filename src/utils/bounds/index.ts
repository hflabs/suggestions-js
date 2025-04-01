import type { Suggestion } from "@/lib/types";
import {
    type Bounds,
    getBoundsIds,
    getFieldNames,
    getValueWithType,
    getBoundedKladr,
    getFiasFieldNames,
} from "./helpers";

interface IProps {
    bounds: Partial<Bounds>;
    suggestion: Suggestion;
    type: "address" | "fias";
}

/**
 * Возвращает значение подсказки с учетом границ bounds.
 * Только для подсказок по адресам и ФИАС
 */
export const getBoundedValue = ({ bounds, suggestion, type }: IProps) => {
    if (!["address", "fias"].includes(type)) return suggestion.value;

    const idsToCompose = getBoundsIds(bounds, type);

    if (!idsToCompose.length) return suggestion.value;

    const parts: Record<string, string | undefined> = {
        country: suggestion.data.country,
        region: getValueWithType("region", suggestion.data, false),
        area: getValueWithType("area", suggestion.data),
        city: getValueWithType("city", suggestion.data),
        settlement: getValueWithType("settlement", suggestion.data),
        city_district: getValueWithType("city_district", suggestion.data),
        planning_structure: getValueWithType("planning_structure", suggestion.data),
        street: getValueWithType("street", suggestion.data),
        house: [
            type === "address" && suggestion.data.stead_type,
            type === "address" && suggestion.data.stead,
            suggestion.data.house_type,
            suggestion.data.house,
            suggestion.data.block_type,
            suggestion.data.block,
        ]
            .filter(Boolean)
            .join(" "),
        flat: [suggestion.data.flat_type, suggestion.data.flat].filter(Boolean).join(" "),
    };

    // если регион совпадает с городом, например г Москва, г Москва, то не показываем регион
    if (
        suggestion.data.region === suggestion.data.city &&
        idsToCompose.includes("city") &&
        idsToCompose.includes("region")
    ) {
        parts.region = "";
    }

    return idsToCompose
        .map((part) => parts[part])
        .filter(Boolean)
        .join(", ");
};

/**
 * Возвращает объект подсказки с отфильтрованными в соответствии с bounds полями.
 * В т.ч. подгоняет kladr_id под границы bounds.
 *
 * Используется для получения правильных полей для ограничения по locations в рамках гранулярных подсказок
 * (один объект подсказки для полей с разными уровнями границ bounds).
 *
 * Только для подсказок по адресам и ФИАС
 */
export const getBoundedSuggestion = ({ bounds, suggestion, type }: IProps) => {
    if (!["address", "fias"].includes(type)) return suggestion;

    const idsToCompose = getBoundsIds(bounds, type, true);
    const fields = idsToCompose
        .map((id) => [...Object.values(getFieldNames(id)), ...getFiasFieldNames(id)])
        .flat();

    const data = Object.fromEntries(
        Object.entries(suggestion.data).filter((entry) => fields.includes(entry[0]) && !!entry[1])
    );

    data.kladr_id = getBoundedKladr(suggestion.data.kladr_id, bounds.to_bound?.value);

    return {
        ...suggestion,
        data,
    };
};

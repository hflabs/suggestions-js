import type { AnyData, NonVerifiedSuggestion } from "@/lib/types";
import { clone } from "@/helpers/object";
import type { SUGGEST_OPTIONS } from "./types";

/**
 * Проверяет параметры с помощью коллбэка onSearchStart.
 * Возвращает финальные параметры и признак, можно ли выполнять запрос к Подсказкам.
 *
 * onSearchStart мутирует напрямую переданный объект параметров
 */
export const checkParams = (params: AnyData, onSearchStart: SUGGEST_OPTIONS["onSearchStart"]) => {
    if (typeof onSearchStart !== "function") {
        return {
            finalParams: params,
            canStartRequest: true,
        };
    }

    const copiedParams = clone(params);
    const checkResult = onSearchStart(copiedParams);

    return {
        finalParams: copiedParams,
        canStartRequest: checkResult !== false,
    };
};

export const getVerifiedSuggestion = (suggestion: NonVerifiedSuggestion) => {
    if (typeof suggestion === "string") {
        return {
            value: suggestion,
            unrestricted_value: suggestion,
            data: {},
        };
    }

    const value = typeof suggestion.value === "string" ? suggestion.value : "";

    const verified = {
        value,
        unrestricted_value: suggestion.unrestricted_value ?? value,
        data: suggestion.data ?? {},
    };

    if (typeof verified.unrestricted_value !== "string") verified.unrestricted_value = value;
    if (typeof verified.data !== "object") verified.data = {};

    return verified;
};

/**
 * Возвращает обработанные коллбэком onSuggestionsFetch подсказки (фильтрация, сортировка и т.д.)
 * Если результат onSuggestionsFetch не массив - возвращает исходные подсказки
 *
 * onSuggestionsFetch может мутировать напрямую переданный массив подсказки
 */
export const getFormattedSuggestions = (
    suggestions: NonVerifiedSuggestion[],
    onSuggestionsFetch: SUGGEST_OPTIONS["onSuggestionsFetch"]
) => {
    const verifiedSuggestions = suggestions.filter(Boolean).map(getVerifiedSuggestion);

    if (typeof onSuggestionsFetch !== "function") return verifiedSuggestions;

    const copiedSuggestions = clone(verifiedSuggestions);

    const formattedSuggestions = onSuggestionsFetch(copiedSuggestions);

    return Array.isArray(formattedSuggestions)
        ? formattedSuggestions.filter(Boolean).map(getVerifiedSuggestion)
        : copiedSuggestions;
};

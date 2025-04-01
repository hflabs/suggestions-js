import type { Suggestion } from "@/lib/types";
import { getDeepValue } from "./object";
import { normalize, stringEncloses, splitTokens, split } from "./text";

/**
 * Находит индекс подходящей подсказки, сравнивая suggestion.value
 * и query с учетом стоп-слов.
 * Возвращает индекс единственной подходящей подсказки
 * или -1, если подходящих нет или несколько.
 */
export const matchByNormalizedQuery =
    (stopwords?: string[]) => (query: string, suggestions: Suggestion[]) => {
        if (suggestions.length === 0) return -1;

        const normalizedQuery = normalize(query, stopwords);
        const matches: number[] = [];

        suggestions.every((suggestion, i) => {
            const suggestedValue = suggestion.value.toLowerCase();

            if (
                stringEncloses(query, suggestedValue) ||
                suggestedValue.indexOf(normalizedQuery) > 0
            ) {
                return false;
            }

            if (normalizedQuery === normalize(suggestion.value.toLowerCase(), stopwords)) {
                matches.push(i);
            }

            return true;
        });

        return matches.length === 1 ? matches[0] : -1;
    };

/**
 * Сравнивает запрос c подсказками, по словам.
 * Срабатывает, только если у всех подсказок общий родитель.
 * Игнорирует стоп-слова.
 * Возвращает индекс единственной подходящей подсказки
 * или -1, если подходящих нет или несколько.
 */
export const matchByWords =
    (stopwords?: string[]) => (query: string, suggestions: Suggestion[]) => {
        const suggestionsHasSameParent = suggestions.every(
            (suggestion) => suggestion.value.indexOf(suggestions[0].value) === 0
        );

        if (!suggestionsHasSameParent || suggestions.length === 0) return -1;

        const matches: number[] = [];
        const queryTokens = splitTokens(split(query, stopwords));

        suggestions.every((suggestion, i) => {
            if (stringEncloses(query, suggestion.value)) {
                return false;
            }

            const suggestionTokens = splitTokens(split(suggestion.value, stopwords));

            if (queryTokens.every((token) => suggestionTokens.includes(token))) {
                matches.push(i);
            }

            return true;
        });

        return matches.length === 1 ? matches[0] : -1;
    };

/**
 * Сравнивает запрос c конкретными полями в объекте подсказки.
 * Работает только с одной подсказкой.
 * Учитывает стоп-слова для каждого поля.
 */
export const matchByFields =
    (fields: { [k: string]: string[] | null }) => (query: string, suggestions: Suggestion[]) => {
        if (suggestions.length !== 1 || !Object.keys(fields).length) return -1;

        const tokens = splitTokens(split(query));

        const suggestionTokens = Object.entries(fields).map(([fieldName, stopwords]) => {
            const valueByField = getDeepValue(suggestions[0], fieldName);
            if (!valueByField || typeof valueByField !== "string") return;

            return splitTokens(split(valueByField, stopwords || []));
        });

        const cleanSuggestionTokens = suggestionTokens.flat().filter(Boolean);

        return tokens.every((token) =>
            cleanSuggestionTokens.some((t) => `${t}`.indexOf(token) === 0)
        )
            ? 0
            : -1;
    };

// Модуль для работы с кэшем запросов к Подсказкам

import type { AnyData, Suggestion, SuggestionsType } from "@/lib/types";

/**
 * Подсказка со статусом, была ли она обогащена.
 * Статус используется для упрощения внутренних операций, не является единственным источником истины
 *
 * При проверке на необходимость обогащения подсказки используется этот статус +
 * проверяется поле qc в самой подсказке (на случай пришедшей извне подсказки)
 */
export type MaybeEnrichedSuggestion = {
    suggestion: Suggestion;
    enriched: boolean;
};

type EnrichedSuggestions = {
    suggestions: MaybeEnrichedSuggestion[];
};

type SuggestCache = {
    [K: string]: EnrichedSuggestions | undefined;
};
type EnrichmentCache = {
    [K: string]: Suggestion | undefined;
};

/**
 * Кэш результатов основных запросов к Подсказкам.
 */
const getSuggestCache = () => {
    let cache: SuggestCache = {};

    return {
        get: (params: AnyData, type: SuggestionsType) => {
            const key = JSON.stringify(params) + type;
            return cache[key];
        },
        set: (params: AnyData, type: SuggestionsType, suggestions: EnrichedSuggestions) => {
            const key = JSON.stringify(params) + type;
            cache[key] = suggestions;
        },
        clear: () => {
            cache = {};
        },
    };
};

/**
 * Кэш результатов запросов на обогащение конкретной подсказки
 */
const getEnrichmentCache = () => {
    let cache: EnrichmentCache = {};

    return {
        get: (suggestion: Suggestion, type: SuggestionsType) => {
            const key = JSON.stringify(suggestion.data) + type;
            return cache[key];
        },
        set: (type: SuggestionsType, suggestion: Suggestion, original: Suggestion) => {
            const key = JSON.stringify(original.data) + type;
            cache[key] = suggestion;
        },
        clear: () => {
            cache = {};
        },
    };
};

/**
 * Кэш запросов (поисковых фраз), по которым не было результатов
 */
const getBadQueriesCache = () => {
    let badQueries: string[] = [];

    return {
        check: (query: string) => {
            if (!badQueries.length) return false;
            return badQueries.some((badQuery) => query.startsWith(badQuery));
        },
        set: (query: string) => {
            badQueries.push(query);
        },
        clear: () => {
            badQueries = [];
        },
    };
};

export const createCache = () => {
    const cache = {
        suggest: getSuggestCache(),
        enrich: getEnrichmentCache(),
        badQueries: getBadQueriesCache(),
    };

    const clearCache = () => {
        cache.suggest.clear();
        cache.enrich.clear();
        cache.badQueries.clear();
    };

    return {
        cache,
        clearCache,
    };
};

export type RequestsCache = ReturnType<typeof createCache>["cache"];

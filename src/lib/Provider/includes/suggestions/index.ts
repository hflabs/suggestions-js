import type { ISuggestionsStrategy } from "@provider_strategy/types";
import type { HasQueryChanged } from "@/lib/Provider/types";
import type { AnyData, Suggestion } from "@/lib/types";
import type { SUGGEST_OPTIONS } from "./types";

import { SuggestProvider } from "./includes/suggest";
import { EnrichProvider } from "./includes/enrich";
import { StatusProvider } from "./includes/status";
import { createCache, type MaybeEnrichedSuggestion } from "./includes/cache";

/**
 * Сервис для работы с Подсказками.
 * Позволяет получить список подсказок по query и обогатить конкретную подсказку.
 *
 * Использует кэш (если разрешено в опциях):
 * - основной: хранит результаты запросов подсказок. Ключ - параметры и тип запроса
 * - обогащение: хранит обогащенные результаты.
 * При запросе списка подсказок каждая подходящая подсказка заменяется на обогащенную из кеша
 * - пустые запросы: query, по которым был получен пустой результат.
 * Повторные запросы с этим query выполняться не будут
 *
 * При выполнении любого типа запросов (общий или обогащение) - отменяет другой.
 *
 * Предоставляет методы:
 * - getSuggestions - получить список подсказок
 * - enrichSuggestion - обогатить подсказку
 * - updateOptions - обновить опции
 * - abortSuggestionsRequest - отменить запрос за списком подсказок
 * - clearCache - очистить все кэши (основной, обогащение и пустые запросы)
 */
export const getSuggestionsService = (
    options: SUGGEST_OPTIONS,
    strategy: ISuggestionsStrategy,
    hasQueryChanged: HasQueryChanged
) => {
    const { cache, clearCache } = createCache();

    const suggestProvider = new SuggestProvider(options, strategy, cache);
    const enrichmentProvider = new EnrichProvider(options, strategy, cache);
    const statusProvider = new StatusProvider(options, strategy);

    const updateOptions = (newOptions: SUGGEST_OPTIONS, newStrategy: ISuggestionsStrategy) => {
        suggestProvider.updateOptions(newOptions, newStrategy);
        enrichmentProvider.updateOptions(newOptions, newStrategy);
        statusProvider.updateOptions(newOptions, newStrategy);
    };

    const getSuggestions = async (query: string, params: AnyData) => {
        enrichmentProvider.abortEnrichRequest();
        return await suggestProvider.suggest(query, params, () => hasQueryChanged(query));
    };

    const enrichSuggestion = async (
        suggestion: MaybeEnrichedSuggestion,
        params: AnyData,
        query: string
    ) => {
        suggestProvider.abortSuggestionsRequest();
        return await enrichmentProvider.enrich(suggestion, params, () => hasQueryChanged(query));
    };

    const getEnrichedSuggestionFromCache = (suggestion: Suggestion) =>
        enrichmentProvider.getCachedSuggestion(suggestion);

    return {
        updateOptions,
        getSuggestions,
        enrichSuggestion,
        abortSuggestionsRequest: suggestProvider.abortSuggestionsRequest.bind(suggestProvider),
        clearCache,
        getStatus: statusProvider.getStatus.bind(statusProvider),
        getEnrichedSuggestionFromCache,
    };
};

export type SuggestionsService = ReturnType<typeof getSuggestionsService>;

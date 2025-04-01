import type { AnyData, NonVerifiedSuggestion, Suggestion } from "@/lib/types";
import type { SUGGEST_OPTIONS } from "@/lib/Provider/includes/suggestions/types";
import type { ISuggestionsStrategy } from "@provider_strategy/types";
import { useDebouncedRequest, getFetchParams } from "@provider_api/index";
import { API_ENDPOINTS } from "@provider_api/api.constants";
import { getFormattedSuggestions, checkParams } from "@provider_suggestions/helpers";
import { clone } from "@/helpers/object";
import type { RequestsCache } from "./cache";

type Suggestions = { suggestions: NonVerifiedSuggestion[] };

/**
 * Провайдер для функционала запроса списка подсказок.
 * Возвращает список подсказок или ничего (если невозможно выполнить запрос).
 *
 * В списке подсказок каждая подходящая подсказка заменяется на обогащенную из кеша (если разрешено).
 * Если разрешено в опциях - сохраняет полученный список подсказок в кэше.
 *
 * Вызывает onSearchError при ошибке запроса (кроме отмены),
 * пополняет кэш badQueries при получении пустого ответа (если разрешено в опциях).
 *
 * Каждый следующий запрос отменяет предыдущий,
 * дополнительно позволяет отменить запрос извне через abortSuggestionsRequest.
 *
 * Предоставляет методы:
 * - suggest - получить список подсказок
 * - updateOptions - обновить опции
 * - abortSuggestionsRequest - отменить текущий запрос к API
 */
export class SuggestProvider {
    private _options: SUGGEST_OPTIONS;
    private _strategy: ISuggestionsStrategy;
    private _cache: RequestsCache;
    private _suggestionsRequestController: AbortController | null = null;
    private _makeRequest: ReturnType<typeof useDebouncedRequest<Suggestions>>;

    constructor(options: SUGGEST_OPTIONS, strategy: ISuggestionsStrategy, cache: RequestsCache) {
        this._options = options;
        this._strategy = strategy;
        this._cache = cache;
        this._makeRequest = useDebouncedRequest<Suggestions>();
    }

    updateOptions = (newOptions: SUGGEST_OPTIONS, newStrategy: ISuggestionsStrategy) => {
        this._options = newOptions;
        this._strategy = newStrategy;
    };

    abortSuggestionsRequest() {
        if (this._suggestionsRequestController) this._suggestionsRequestController.abort();
    }

    async suggest(query: string, params: AnyData, hasQueryChanged: () => boolean) {
        const { finalParams, canStartRequest } = checkParams(params, this._options.onSearchStart);
        if (!canStartRequest) return;

        const cached = this._getCachedSuggestions(finalParams);
        if (cached) return cached;

        if (this._options.preventBadQueries && this._cache.badQueries.check(query)) return;

        const { urlSlug } = this._strategy;
        const fetchParams = getFetchParams(this._options, API_ENDPOINTS.suggest, urlSlug);
        const { url, method } = fetchParams;

        this._suggestionsRequestController = fetchParams.params.controller;
        const response = await this._makeRequest(url, method, fetchParams.params, finalParams);
        this._suggestionsRequestController = null;

        if (response.data) {
            const formattedSuggestions = getFormattedSuggestions(
                response.data.suggestions,
                this._options.onSuggestionsFetch
            );

            if (hasQueryChanged() && typeof this._options.onSearchComplete === "function") {
                this._options.onSearchComplete(query, clone(formattedSuggestions));
                return;
            }

            return this._handleResponse(formattedSuggestions, query, params);
        }

        if (!response.isAborted && typeof this._options.onSearchError === "function") {
            this._options.onSearchError(
                query,
                response.res,
                response.error.code,
                response.error.statusText
            );
        }
    }

    private _handleResponse(suggestions: Suggestion<AnyData>[], query: string, params: AnyData) {
        const enrichedSuggestions = suggestions.map(this._enrichSuggestionFromCache.bind(this));
        const { noCache, preventBadQueries } = this._options;

        if (!noCache) {
            const dataToCache = { suggestions: enrichedSuggestions };
            this._cache.suggest.set(params, this._options.type, dataToCache);

            if (preventBadQueries && !enrichedSuggestions.length) this._cache.badQueries.set(query);
        }

        if (typeof this._options.onSearchComplete === "function") {
            const enrichedSuggestionsData = enrichedSuggestions.map(({ suggestion }) => suggestion);
            this._options.onSearchComplete(query, enrichedSuggestionsData);
        }

        return enrichedSuggestions;
    }

    _getCachedSuggestions(params: AnyData) {
        const cached = this._cache.suggest.get(params, this._options.type);

        if (!cached) return;

        return cached.suggestions.map((s) =>
            s.enriched ? s : this._enrichSuggestionFromCache(s.suggestion)
        );
    }

    /**
     * Преобразует список подсказок.
     * Для каждой подсказки возвращает оригинальное или обогащенное значение (если возможно) и статус enriched
     */
    _enrichSuggestionFromCache(suggestion: Suggestion) {
        const enrichedSuggestionByQuery = this._options.noCache
            ? null
            : this._cache.enrich.get(suggestion, this._options.type);

        return {
            suggestion: enrichedSuggestionByQuery || suggestion,
            enriched: Boolean(enrichedSuggestionByQuery),
        };
    }
}

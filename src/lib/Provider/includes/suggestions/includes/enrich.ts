import type { AnyData, NonVerifiedSuggestion, Suggestion } from "@/lib/types";
import type { SUGGEST_OPTIONS } from "@/lib/Provider/includes/suggestions/types";
import type { ISuggestionsStrategy } from "@provider_strategy/types";
import { getFetchParams, useDebouncedRequest } from "@provider_api/index";
import { getFormattedSuggestions, checkParams } from "@provider_suggestions/helpers";
import type { MaybeEnrichedSuggestion, RequestsCache } from "./cache";

type Suggestions = { suggestions: [NonVerifiedSuggestion] };

/**
 * Провайдер для функционала обогащения подсказки.
 *
 * Обогащает подсказку, если это возможно, или возвращает оригинальную.
 * Если разрешено в опциях - сохраняет обогащенную подсказку в кэше.
 *
 * Для обогащения обращается к API с учетом переданных опций.
 *
 * Каждый следующий запрос отменяет предыдущий,
 * дополнительно позволяет отменить запрос извне через abortEnrichRequest.
 *
 * Предоставляет методы:
 * - enrich - обогатить подсказку
 * - updateOptions - обновить опции и стратегию
 * - abortEnrichRequest - отменить текущий запрос к API на обогащение
 */
export class EnrichProvider {
    private _options: SUGGEST_OPTIONS;
    private _strategy: ISuggestionsStrategy;
    private _cache: RequestsCache;
    private _enrichRequestController: AbortController | null = null;
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

    abortEnrichRequest() {
        if (this._enrichRequestController) this._enrichRequestController.abort();
    }

    async enrich(
        suggestion: MaybeEnrichedSuggestion,
        requestParams: AnyData,
        hasQueryChanged: () => boolean
    ) {
        const { enrichmentEndpoint, urlSlug, getEnrichmentParams } = this._strategy;
        const { onSearchStart } = this._options;

        const enrichParams = getEnrichmentParams(suggestion.suggestion, requestParams);
        if (!this._canEnrich(suggestion, enrichParams.query) || !enrichmentEndpoint) return;

        const { finalParams, canStartRequest } = checkParams(enrichParams, onSearchStart);
        if (!canStartRequest) return;

        const { url, method, params } = getFetchParams(this._options, enrichmentEndpoint, urlSlug);
        this._enrichRequestController = params.controller;
        const response = await this._makeRequest(url, method, params, finalParams);
        this._enrichRequestController = null;

        if (!response.data || hasQueryChanged()) return;
        return this._handleResponse(response.data, suggestion.suggestion);
    }

    private _handleResponse(data: Suggestions, original: Suggestion) {
        const formattedSuggestions = getFormattedSuggestions(
            data.suggestions,
            this._options.onSuggestionsFetch
        );

        if (!this._options.noCache) {
            this._cache.enrich.set(this._options.type, formattedSuggestions[0], original);
        }

        return formattedSuggestions[0];
    }

    private _canEnrich(suggestion: MaybeEnrichedSuggestion, query: string) {
        if (suggestion.enriched) return false;
        if (!this._options.preventBadQueries) return true;
        return !this._cache.badQueries.check(query);
    }
}

import type { AnyData, SuggestionMatcherFn, Suggestion, SuggestionsMatches } from "@/lib/types";
import type { Endpoint } from "@provider_api/includes/getParams";

export type STRATEGY_OPTIONS = {
    suggest_local?: boolean;
};

export interface DataCompleteOptions {
    suggestion: Suggestion;
    params: AnyData;
}

/**
 * Абстрактный интерфейс стратегии для имплементации в конкретных стратегиях.
 * Предоставляет контракт для публичных методов и свойств
 */
export interface ISuggestionsStrategy {
    noSuggestionsHint: string;
    matchers: SuggestionMatcherFn[];
    urlSlug: string;
    labelsDictionary: { [k: string]: string };
    unformattableTokens: string[];
    enrichmentEndpoint: Endpoint | null;

    findQueryMatches(suggestion: Suggestion, query: string): SuggestionsMatches;
    getEnrichmentParams(suggestion: Suggestion, params: AnyData): AnyData;
    isQueryRequestable(query: string, options: STRATEGY_OPTIONS): boolean;
    getSuggestionLabels(suggestion: Suggestion, suggestions: Suggestion[]): string[];
    isDataComplete(data: DataCompleteOptions): boolean;
    formatSelected(suggestion: Suggestion): string | null;
}

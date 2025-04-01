import type { Suggestion, SuggestionMatcherFn, SuggestionsType, AnyData } from "@/lib/types";
import type { DataCompleteOptions, STRATEGY_OPTIONS } from "@/lib/Provider/includes/strategy/types";

import { matchByNormalizedQuery } from "@/helpers/matchers";
import { escapeHtml, findMatches, getWordsFromString, tokenize } from "@/helpers/text";
import type { Endpoint } from "@provider_api/includes/getParams";

/**
 * Базовый тип подсказок.
 * Предоставляет базовую реализацию публичных методов и свойств
 */
export class BaseSuggestionsStrategy {
    noSuggestionsHint: string;
    matchers: SuggestionMatcherFn[];

    urlSlug: string;
    labelsDictionary: { [k: string]: string };
    unformattableTokens: string[];
    enrichmentEndpoint: Endpoint | null;

    constructor(type: SuggestionsType) {
        this.noSuggestionsHint = "Неизвестное значение";
        this.matchers = [matchByNormalizedQuery()];
        this.urlSlug = type;
        this.labelsDictionary = {};
        this.unformattableTokens = [];
        this.enrichmentEndpoint = null;
    }

    getSuggestionLabels(suggestion: Suggestion, suggestions: Suggestion[]) {
        const labelsKeys = Object.keys(this.labelsDictionary);
        const suggestionDuplicated = suggestions.some(
            (s) => s.value === suggestion.value && s !== suggestion
        );

        if (!labelsKeys || !suggestionDuplicated || !suggestion.data) return [];

        const labels: string[] = [];

        const labelsData = labelsKeys.reduce(
            (acc, key) => {
                if (suggestion.data[key]) acc[key] = suggestion.data[key];
                return acc;
            },
            {} as Suggestion["data"]
        );

        getWordsFromString(suggestion.value).forEach((word) => {
            const matchingKey = Object.keys(labelsData).find((key) => labelsData[key] === word);

            if (matchingKey) {
                labels.push(this.labelsDictionary[matchingKey]);
                delete labelsData[matchingKey];
            }
        });

        return labels.map((label) => escapeHtml(label));
    }

    getEnrichmentParams(_suggestion: Suggestion, params: AnyData) {
        return {
            ...params,
            count: 1,
        };
    }

    isQueryRequestable(_query: string, _options: STRATEGY_OPTIONS) {
        return true;
    }

    findQueryMatches(suggestion: Suggestion, query: string) {
        const tokens = tokenize(query, []);
        return { main: { full: findMatches(suggestion.value, tokens, []) } };
    }

    isDataComplete(_data: DataCompleteOptions) {
        return true;
    }

    formatSelected(suggestion: Suggestion): string | null {
        return suggestion.value;
    }
}

/*
    Стратегия для подсказок по адресам (расширяет базовую BaseSuggestionStrategy).
*/

import type { Suggestion, SuggestionsType, AnyData } from "@/lib/types";
import type { ISuggestionsStrategy, DataCompleteOptions } from "@provider_strategy/types";

import { BaseSuggestionsStrategy } from "@provider_strategy/strategies/BaseSuggestionsStrategy";
import { matchByNormalizedQuery, matchByWords } from "@/helpers/matchers";
import { tokenize, findMatches } from "@/helpers/text";
import { API_ENDPOINTS } from "@/lib/Provider/includes/api/api.constants";
import { ADDRESS_STOPWORDS, fieldsUnderDistrict } from "./data";

export class AddressStrategy extends BaseSuggestionsStrategy implements ISuggestionsStrategy {
    constructor(type: SuggestionsType) {
        super(type);
        this.noSuggestionsHint = "Неизвестный адрес";
        this.matchers = [
            matchByNormalizedQuery(ADDRESS_STOPWORDS),
            matchByWords(ADDRESS_STOPWORDS),
        ];

        this.urlSlug = "address";
        this.unformattableTokens = ADDRESS_STOPWORDS;
        this.enrichmentEndpoint = API_ENDPOINTS.suggest;
    }

    getEnrichmentParams(suggestion: Suggestion, params: AnyData) {
        return {
            ...params,
            count: 1,
            query: suggestion.unrestricted_value,
        };
    }

    findQueryMatches(suggestion: Suggestion, query: string) {
        let { value } = suggestion;
        const historyValues = suggestion.data.history_values as string[];
        const tokens = tokenize(query, ADDRESS_STOPWORDS);

        if (historyValues && historyValues.length) {
            const unusedInQueryTokens = tokens.filter((token) => !value.includes(token));
            const formattedHistoryValues = this._getFormattedHistoryValues(
                unusedInQueryTokens,
                historyValues
            );

            if (formattedHistoryValues) value += formattedHistoryValues;
        }

        const mainMatches = findMatches(value, tokens, ADDRESS_STOPWORDS);

        const district = suggestion.data.city_district_with_type as string | undefined;
        let extraMatches;

        if (district && fieldsUnderDistrict.some((field) => Boolean(suggestion.data[field]))) {
            extraMatches = findMatches(district, tokens, ADDRESS_STOPWORDS);
        }

        return {
            main: { full: mainMatches },
            extra: extraMatches ? [{ full: extraMatches }] : undefined,
        };
    }

    isDataComplete({ suggestion, params }: DataCompleteOptions) {
        return Boolean(suggestion.data[params.to_bound?.value || "flat"]);
    }

    private _getFormattedHistoryValues(tokens: string[], historyValues: string[]) {
        const values = historyValues.filter((value) =>
            Boolean(tokens.find((token) => value.toLowerCase().includes(token)))
        );
        return values.length ? ` (бывш. ${values.join(", ")})` : "";
    }
}

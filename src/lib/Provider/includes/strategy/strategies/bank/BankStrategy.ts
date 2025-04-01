/*
    Стратегия для подсказок по банкам (расширяет базовую BaseSuggestionStrategy).
*/

import type { AnyData, Suggestion, SuggestionsType } from "@/lib/types";
import type { ISuggestionsStrategy } from "@provider_strategy/types";

import { BaseSuggestionsStrategy } from "@provider_strategy/strategies/BaseSuggestionsStrategy";
import { matchByFields } from "@/helpers/matchers";

import { ADDRESS_STOPWORDS } from "@provider_strategy/strategies/address/data";
import { findMatches, tokenize, WORD_DELIMITERS } from "@/helpers/text";
import { API_ENDPOINTS } from "@/lib/Provider/includes/api/api.constants";

export class BankStrategy extends BaseSuggestionsStrategy implements ISuggestionsStrategy {
    constructor(type: SuggestionsType) {
        super(type);
        this.noSuggestionsHint = "Неизвестный банк";
        this.matchers = [
            matchByFields({
                value: null,
                "data.bic": null,
                "data.swift": null,
            }),
        ];

        this.urlSlug = "bank";
        this.unformattableTokens = ADDRESS_STOPWORDS;
        this.enrichmentEndpoint = API_ENDPOINTS.findById;
    }

    getEnrichmentParams(suggestion: Suggestion, params: AnyData) {
        return {
            ...params,
            count: 1,
            query: suggestion.data.bic,
        };
    }

    formatSelected(suggestion: Suggestion) {
        return (suggestion.data?.name?.payment as string) || null;
    }

    findQueryMatches(suggestion: Suggestion, query: string) {
        const tokens = tokenize(query, []);

        const BICMatches = findMatches(suggestion.data?.bic || "", tokens);
        const addressValue = suggestion.data?.address?.value || "";

        const mainMatches = findMatches(suggestion.value, tokens);

        let addressMatches = null;

        if (addressValue) {
            const cleanedAddress = addressValue.replace(/^\d{6}( РОССИЯ)?, /i, "");

            // только первые 2 слова
            const shortAddress = cleanedAddress.replace(
                new RegExp(
                    `^([^${WORD_DELIMITERS}]+[${WORD_DELIMITERS}]+[^${WORD_DELIMITERS}]+).*`
                ),
                "$1"
            ) as string;

            addressMatches = {
                full: findMatches(cleanedAddress, tokens, ADDRESS_STOPWORDS),
                short: [
                    {
                        text: shortAddress,
                        matched: false,
                    },
                ],
            };
        }

        const BICMatchPart = {
            full: BICMatches,
            short: BICMatches,
        };

        const extraMatches = addressMatches ? [BICMatchPart, addressMatches] : [BICMatchPart];

        return {
            main: { full: mainMatches },
            extra: extraMatches,
        };
    }
}

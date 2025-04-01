/*
    Стратегия для подсказок по ФИАС (расширяет базовую BaseSuggestionStrategy).
    Использует стоп-слова по адресам, но собственные дата-компоненты.

    Реализация метода getSuggestionValue идентична стратегии по адресам, но основана на компонентах ФИАС
*/

import type { ISuggestionsStrategy, DataCompleteOptions } from "@provider_strategy/types";
import type { Suggestion, SuggestionsType } from "@/lib/types";

import { BaseSuggestionsStrategy } from "@provider_strategy/strategies/BaseSuggestionsStrategy";
import { matchByNormalizedQuery, matchByWords } from "@/helpers/matchers";
import { tokenize, findMatches } from "@/helpers/text";
import { ADDRESS_STOPWORDS } from "@provider_strategy/strategies/address/data";

export class FiasStrategy extends BaseSuggestionsStrategy implements ISuggestionsStrategy {
    constructor(type: SuggestionsType) {
        super(type);
        this.noSuggestionsHint = "Неизвестный адрес";
        this.matchers = [
            matchByNormalizedQuery(ADDRESS_STOPWORDS),
            matchByWords(ADDRESS_STOPWORDS),
        ];

        this.urlSlug = "fias";
    }

    findQueryMatches(suggestion: Suggestion, query: string) {
        const tokens = tokenize(query, []);
        return { main: { full: findMatches(suggestion.value, tokens, ADDRESS_STOPWORDS) } };
    }

    isDataComplete({ suggestion, params }: DataCompleteOptions) {
        return Boolean(suggestion.data[params.to_bound?.value || "house"]);
    }
}

/*
    Стратегия для подсказок по email (расширяет базовую BaseSuggestionStrategy).
*/

import type { ISuggestionsStrategy, STRATEGY_OPTIONS } from "@provider_strategy/types";
import type { SuggestionsType } from "@/lib/types";
import { BaseSuggestionsStrategy } from "@provider_strategy/strategies/BaseSuggestionsStrategy";

const SUGGEST_LOCAL_DEFAULT = true;

export class EmailStrategy extends BaseSuggestionsStrategy implements ISuggestionsStrategy {
    constructor(type: SuggestionsType) {
        super(type);
        this.noSuggestionsHint = "";
        this.urlSlug = "email";
    }

    isQueryRequestable(query: string, options: STRATEGY_OPTIONS) {
        const suggestLocalEnabled = options.suggest_local ?? SUGGEST_LOCAL_DEFAULT;

        return Boolean(suggestLocalEnabled) || query.indexOf("@") >= 0;
    }
}

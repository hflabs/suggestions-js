import type { AnyData, Suggestion, SuggestionsType } from "../types";
import type { API_OPTIONS } from "./includes/api/types";
import type { STRATEGY_OPTIONS } from "./includes/strategy/types";
import type { SUGGEST_OPTIONS } from "./includes/suggestions/types";

interface BASE_OPTIONS<T = AnyData> {
    minChars?: number;
    noSuggestionsHint?: string | false;
    hint?: string | false;
    deferRequestBy?: number;
    autoSelectFirst?: boolean;
    type: SuggestionsType;
    enrichmentEnabled?: boolean;
    params?: Record<string, unknown> | ((query: string) => Record<string, unknown>);
    formatResult?: (
        value: string,
        currentValue: string,
        suggestion: Suggestion<T>,
        options: { unformattableTokens: string[] }
    ) => string;
    formatSelected?: (suggestion: Suggestion<T>) => string | null;
    beforeFormat?: (suggestion: Suggestion<T>, query: string) => Suggestion<T>;
}

export type PROVIDER_OPTIONS<T = AnyData> = API_OPTIONS &
    STRATEGY_OPTIONS &
    SUGGEST_OPTIONS<T> &
    BASE_OPTIONS<T>;

export type HasQueryChanged = (q: string) => boolean;

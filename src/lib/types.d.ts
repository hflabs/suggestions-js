// Глобальные типы

export interface Match {
    text: string;
    matched: boolean;
    groupEnd?: boolean;
}

export type ExplicitSuggestionsTypes = "name" | "address" | "bank" | "email" | "party" | "fias";
export type SuggestionsType = (string & NonNullable<unknown>) | ExplicitSuggestionsTypes;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyData = { [K: string]: any };

export interface Suggestion<T = AnyData> {
    value: string;
    unrestricted_value: string;
    data: T;
}
export type RawStringSuggestion = string;
export interface RawPartialSuggestion {
    value: string;
    unrestricted_value?: string;
    data?: null;
}

export type NonVerifiedSuggestion = Suggestion | RawStringSuggestion | RawPartialSuggestion;

export type SuggestionMatcherFn = (query: string, suggestions: Suggestion[]) => number;
export interface SuggestionsMatches {
    main: {
        full: Match[];
        short?: Match[];
    };
    extra?: {
        full: Match[];
        short?: Match[];
    }[];
}

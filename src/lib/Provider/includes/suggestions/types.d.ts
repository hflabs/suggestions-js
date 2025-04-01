import type { AnyData, Suggestion, SuggestionsType } from "../../../types";
import type { API_OPTIONS } from "../api/types";

export interface SUGGEST_OPTIONS<T = AnyData> extends API_OPTIONS {
    onSearchStart?: (params: Record<string, unknown>) => void | false;
    onSuggestionsFetch?: (suggestions: Suggestion<T>[]) => Suggestion<T>[] | void;
    onSearchComplete?: (query: string, suggestions: Suggestion<T>[]) => void;
    onSearchError?: (
        query: string | null,
        res: Response | undefined,
        textStatus: string,
        errorThrown: string
    ) => void;
    preventBadQueries?: boolean;
    noCache?: boolean;
    type: SuggestionsType;
}

import type { SuggestionData, SuggestionHint, NoSuggestionsHint } from "@provider/index";

export interface CONTAINER_OPTIONS {
    hint: SuggestionHint;
    noSuggestionsHint: NoSuggestionsHint;
    suggestions: SuggestionData[];
    planName: string;
    selectedIndex: number;
    closeDelay?: number;
    onClick: (suggestionIndex: number) => void;
    beforeRender?: (container: HTMLElement) => void;
}
